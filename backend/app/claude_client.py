import anthropic
from typing import List, Dict, Any, Optional
import logging
import json

logger = logging.getLogger(__name__)


# Per-player fields stripped from OpenDota match payloads before they reach the LLM.
# Source: a single get_match call returns ~930KB / 250K tokens; the per-player block
# alone is ~327KB. These fields are timeseries, raw event logs, or breakdowns the
# model rarely uses — see to-do.md item #1.
_PLAYER_DROP_FIELDS = frozenset({
    "gold_t", "xp_t", "lh_t", "dn_t", "times",
    "purchase_log", "kills_log", "killed", "killed_by",
    "obs_log", "obs_left_log", "sen_log", "sen_left_log",
    "runes_log", "neutral_item_history", "neutral_tokens_log",
    "connection_log", "buyback_log",
    "ability_upgrades_arr", "ability_targets", "ability_uses",
    "item_usage", "item_uses", "item_win",
    "damage", "damage_taken", "damage_targets",
    "damage_inflictor", "damage_inflictor_received",
    "purchase", "purchase_time", "first_purchase_time",
    "gold_reasons", "xp_reasons",
    "benchmarks", "permanent_buffs", "actions",
    "kill_streaks",
    "cosmetics", "lane_pos",
    "life_state", "life_state_dead",
    "is_subscriber", "is_contributor", "last_login",
    "obs", "sen", "runes",
})

_MATCH_DROP_FIELDS = frozenset({
    "chat", "all_word_counts", "my_word_counts", "cosmetics",
    "pauses", "draft_timings", "cluster", "metadata", "od_data",
    "engine", "flags", "replay_salt", "replay_url",
    "match_seq_num", "human_players", "pre_game_duration", "region",
    "throw", "loss",
})

_TEAMFIGHT_PLAYER_DROP_FIELDS = frozenset({
    "ability_targets", "ability_uses", "item_uses",
    "killed", "deaths_pos",
})


def _looks_like_match_payload(obj: Any) -> bool:
    return (
        isinstance(obj, dict)
        and "match_id" in obj
        and isinstance(obj.get("players"), list)
    )


def _filter_player(player: Dict[str, Any]) -> Dict[str, Any]:
    return {k: v for k, v in player.items() if k not in _PLAYER_DROP_FIELDS}


def _filter_teamfight(tf: Dict[str, Any]) -> Dict[str, Any]:
    out = dict(tf)
    if isinstance(out.get("players"), list):
        out["players"] = [
            {k: v for k, v in p.items() if k not in _TEAMFIGHT_PLAYER_DROP_FIELDS}
            for p in out["players"]
        ]
    return out


def _filter_match_data(match: Dict[str, Any]) -> Dict[str, Any]:
    out = {k: v for k, v in match.items() if k not in _MATCH_DROP_FIELDS}
    if isinstance(out.get("players"), list):
        out["players"] = [_filter_player(p) for p in out["players"]]
    if isinstance(out.get("teamfights"), list):
        out["teamfights"] = [_filter_teamfight(t) for t in out["teamfights"]]
    return out


def _filter_tool_payload(payload: Any) -> Any:
    """Apply match-data filtering wherever the payload looks like one."""
    if _looks_like_match_payload(payload):
        return _filter_match_data(payload)
    if isinstance(payload, list):
        return [_filter_tool_payload(item) for item in payload]
    return payload


class ClaudeClient:
    """Claude LLM client with chat and analysis capabilities."""

    def __init__(self, api_key: str, model: str = "claude-sonnet-4-5-20250929"):
        self.client = anthropic.AsyncAnthropic(api_key=api_key)
        self.model = model

        self.system_instruction = (
            "You are a Dota 2 assistant with access to OpenDota data through MCP tools.\n\n"
            "Available tools cover players, matches, heroes, items, and pro-scene stats. "
            "Use a tool when the user asks about a specific player, match, hero, or stat — "
            "the tools support fuzzy name matching, so a partial name from the user is "
            "enough to try a call. If a tool fails or returns nothing useful, then ask "
            "the user for clarification.\n\n"
            "For general or conceptual Dota questions (\"what's a good carry?\", \"how does X "
            "ability work?\"), answer from your own knowledge — no tool needed.\n\n"
            "When a tool returns data, summarize the parts the user asked about. Don't "
            "echo the full payload back."
        )

    async def chat(
        self,
        user_message: str,
        conversation_history: List[Dict[str, str]],
        tools: Optional[List[Dict[str, Any]]] = None,
        mcp_client=None
    ) -> str:
        """
        Send a chat message and get a response, handling tool calls if needed.
        """
        try:
            messages: List[Dict[str, Any]] = []
            for msg in conversation_history:
                messages.append({
                    "role": msg["role"],
                    "content": msg["content"]
                })

            messages.append({"role": "user", "content": user_message})

            if tools and mcp_client:
                claude_tools = self._convert_tools_to_claude_format(tools)
                system_blocks = self._build_cached_system_blocks()

                response = await self.client.messages.create(
                    model=self.model,
                    max_tokens=4096,
                    system=system_blocks,
                    messages=messages,
                    tools=claude_tools,
                )
                self._log_usage(response, stage="chat:initial")

                # Track the most recent message-level cache breakpoint so we can
                # rotate it forward each iteration instead of accumulating
                # breakpoints (Anthropic caps the request at 4 total).
                previous_cached_block: Optional[Dict[str, Any]] = None

                while response.stop_reason == "tool_use":
                    tool_use_blocks = [
                        block for block in response.content
                        if block.type == "tool_use"
                    ]

                    messages.append({
                        "role": "assistant",
                        "content": response.content,
                    })

                    tool_results: List[Dict[str, Any]] = []
                    for tool_use in tool_use_blocks:
                        tool_name = tool_use.name
                        tool_args = tool_use.input

                        logger.info(
                            f"Claude requesting tool: {tool_name} with args: {tool_args}"
                        )

                        tool_result = await mcp_client.call_tool(tool_name, tool_args)
                        result_content = self._format_tool_result(tool_name, tool_result)

                        tool_results.append({
                            "type": "tool_result",
                            "tool_use_id": tool_use.id,
                            "content": result_content,
                        })

                    messages.append({
                        "role": "user",
                        "content": tool_results,
                    })

                    if previous_cached_block is not None:
                        previous_cached_block.pop("cache_control", None)
                    tool_results[-1]["cache_control"] = {"type": "ephemeral"}
                    previous_cached_block = tool_results[-1]

                    response = await self.client.messages.create(
                        model=self.model,
                        max_tokens=4096,
                        system=system_blocks,
                        messages=messages,
                        tools=claude_tools,
                    )
                    self._log_usage(response, stage="chat:tool-loop")

                return self._extract_text_response(response)
            else:
                response = await self.client.messages.create(
                    model=self.model,
                    max_tokens=4096,
                    system=self._build_cached_system_blocks(),
                    messages=messages,
                )
                self._log_usage(response, stage="chat:no-tools")
                return self._extract_text_response(response)

        except Exception as e:
            logger.error(f"Error in Claude chat: {e}")
            raise

    async def analyze(
        self,
        data: Dict[str, Any],
        prompt: str,
        system_instruction: str
    ) -> str:
        """
        Perform analysis with custom system instruction (for sub-agents).
        """
        try:
            data_json = json.dumps(data, indent=2)
            full_prompt = f"{prompt}\n\nData to analyze:\n{data_json}"

            response = await self.client.messages.create(
                model=self.model,
                max_tokens=500,
                system=[{
                    "type": "text",
                    "text": system_instruction,
                    "cache_control": {"type": "ephemeral"},
                }],
                messages=[{
                    "role": "user",
                    "content": full_prompt,
                }],
            )
            self._log_usage(response, stage="analyze")

            return response.content[0].text

        except Exception as e:
            logger.error(f"Error in Claude analysis: {e}")
            raise

    def _build_cached_system_blocks(self) -> List[Dict[str, Any]]:
        """System prompt as a cacheable block so repeated requests hit the cache."""
        return [{
            "type": "text",
            "text": self.system_instruction,
            "cache_control": {"type": "ephemeral"},
        }]

    def _convert_tools_to_claude_format(self, tools: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Convert MCP tools to Claude function calling format."""
        claude_tools: List[Dict[str, Any]] = []
        for tool in tools:
            claude_tools.append({
                "name": tool["name"],
                "description": tool["description"],
                "input_schema": tool.get("parameters", {"type": "object", "properties": {}}),
            })
        # Cache the rendered tool block — it's stable across requests within
        # the cache TTL and is one of the larger pieces of the prefix.
        if claude_tools:
            claude_tools[-1]["cache_control"] = {"type": "ephemeral"}
        return claude_tools

    def _format_tool_result(self, tool_name: str, result: Any) -> str:
        """Format MCP tool result for Claude, filtering heavy match payloads."""
        if hasattr(result, "content"):
            content_items = []
            for item in result.content:
                if hasattr(item, "text"):
                    content_items.append(item.text)
                elif hasattr(item, "data"):
                    content_items.append(json.dumps(item.data))
            return "\n".join(content_items)

        if isinstance(result, (dict, list)):
            filtered = _filter_tool_payload(result)
            serialized = json.dumps(filtered)
            original_size = len(json.dumps(result))
            if original_size and len(serialized) < original_size:
                logger.info(
                    "Filtered tool_result for %s: %d -> %d chars (%.1f%% smaller)",
                    tool_name,
                    original_size,
                    len(serialized),
                    100 * (1 - len(serialized) / original_size),
                )
            return serialized

        return str(result)

    def _log_usage(self, response: Any, stage: str) -> None:
        """Emit token usage so we can verify caching/filtering wins in logs."""
        usage = getattr(response, "usage", None)
        if usage is None:
            return
        logger.info(
            "Claude usage [%s]: input=%s output=%s cache_create=%s cache_read=%s",
            stage,
            getattr(usage, "input_tokens", None),
            getattr(usage, "output_tokens", None),
            getattr(usage, "cache_creation_input_tokens", None),
            getattr(usage, "cache_read_input_tokens", None),
        )

    def _extract_text_response(self, response) -> str:
        """Extract text content from Claude response."""
        text_blocks = [
            block.text for block in response.content
            if hasattr(block, "text")
        ]
        return "\n".join(text_blocks) if text_blocks else ""
