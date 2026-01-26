import anthropic
from typing import List, Dict, Any, Optional
import logging
import json

from app.llm_client import BaseLLMClient

logger = logging.getLogger(__name__)


class ClaudeClient(BaseLLMClient):
    """Claude LLM client implementation with chat and analysis capabilities."""

    def __init__(self, api_key: str):
        self.client = anthropic.AsyncAnthropic(api_key=api_key)
        self.model = "claude-sonnet-4-5-20250929"

        self.system_instruction = """You are a helpful Dota 2 assistant with access to comprehensive player, match, and hero statistics through the OpenDota API via MCP tools.
            CRITICAL INSTRUCTIONS:
            - When users ask about ANY player, hero, match, or statistic, you MUST use the available tools
            - NEVER say you need more information - TRY THE TOOL FIRST with what the user provided
            - The tools support fuzzy matching and player name searches - use them!
            - If a user mentions a player name, immediately call get_player_info with that name
            - If a user asks about items or heroes, use the appropriate tool with the name they provided
            - ALWAYS attempt to use tools before asking for more details

            Your process:
            1. User asks about something → Immediately try the relevant tool
            2. Tool returns data → Analyze and present it clearly
            3. Only if the tool fails should you ask for clarification

            Be proactive with tool usage - that's your superpower!
            """

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
            # Build messages from conversation history
            messages = []
            for msg in conversation_history:
                messages.append({
                    "role": msg["role"],
                    "content": msg["content"]
                })

            # Add the current user message
            messages.append({"role": "user", "content": user_message})

            if tools and mcp_client:
                # Convert tools to Claude format
                claude_tools = self._convert_tools_to_claude_format(tools)

                # Initial request with tools
                response = await self.client.messages.create(
                    model=self.model,
                    max_tokens=4096,
                    system=self.system_instruction,
                    messages=messages,
                    tools=claude_tools
                )

                # Handle tool calls iteratively
                while response.stop_reason == "tool_use":
                    # Find tool use blocks
                    tool_use_blocks = [
                        block for block in response.content
                        if block.type == "tool_use"
                    ]

                    # Add assistant's response to messages
                    messages.append({
                        "role": "assistant",
                        "content": response.content
                    })

                    # Process each tool call and gather results
                    tool_results = []
                    for tool_use in tool_use_blocks:
                        tool_name = tool_use.name
                        tool_args = tool_use.input

                        logger.info(f"Claude requesting tool: {tool_name} with args: {tool_args}")

                        # Call the MCP tool
                        tool_result = await mcp_client.call_tool(tool_name, tool_args)

                        # Format the result
                        result_content = self._format_tool_result(tool_result)

                        tool_results.append({
                            "type": "tool_result",
                            "tool_use_id": tool_use.id,
                            "content": result_content
                        })

                    # Add tool results to messages
                    messages.append({
                        "role": "user",
                        "content": tool_results
                    })

                    # Continue the conversation
                    response = await self.client.messages.create(
                        model=self.model,
                        max_tokens=4096,
                        system=self.system_instruction,
                        messages=messages,
                        tools=claude_tools
                    )

                # Extract final text response
                return self._extract_text_response(response)
            else:
                # Simple chat without tools
                response = await self.client.messages.create(
                    model=self.model,
                    max_tokens=4096,
                    system=self.system_instruction,
                    messages=messages
                )
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
            # Prepare the input
            data_json = json.dumps(data, indent=2)
            full_prompt = f"{prompt}\n\nData to analyze:\n{data_json}"

            # Generate analysis
            response = await self.client.messages.create(
                model=self.model,
                max_tokens=4096,
                system=system_instruction,
                messages=[{
                    "role": "user",
                    "content": full_prompt
                }]
            )

            return response.content[0].text

        except Exception as e:
            logger.error(f"Error in Claude analysis: {e}")
            raise

    def _convert_tools_to_claude_format(self, tools: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """Convert MCP tools to Claude function calling format."""
        claude_tools = []
        for tool in tools:
            claude_tool = {
                "name": tool["name"],
                "description": tool["description"],
                "input_schema": tool.get("parameters", {"type": "object", "properties": {}})
            }
            claude_tools.append(claude_tool)
        return claude_tools

    def _format_tool_result(self, result: Any) -> str:
        """Format MCP tool result for Claude."""
        if hasattr(result, 'content'):
            # Extract content from MCP result
            content_items = []
            for item in result.content:
                if hasattr(item, 'text'):
                    content_items.append(item.text)
                elif hasattr(item, 'data'):
                    content_items.append(json.dumps(item.data))
            return "\n".join(content_items)
        return str(result)

    def _extract_text_response(self, response) -> str:
        """Extract text content from Claude response."""
        text_blocks = [
            block.text for block in response.content
            if hasattr(block, 'text')
        ]
        return "\n".join(text_blocks) if text_blocks else ""
