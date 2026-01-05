import google.generativeai as genai
from typing import List, Dict, Any, Optional
import logging
import json

logger = logging.getLogger(__name__)


class GeminiClient:
    def __init__(self, api_key: str):
        genai.configure(api_key=api_key)

        system_instruction = """You are a helpful Dota 2 assistant with access to comprehensive player, match, and hero statistics through the OpenDota API via MCP tools.
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

        # Using Gemini 2.5 Flash with system instruction
        self.model = genai.GenerativeModel(
            'models/gemini-2.5-flash',
            system_instruction=system_instruction
        )

    async def chat(
        self,
        user_message: str,
        conversation_history: List[Dict[str, str]],
        tools: Optional[List[Dict[str, Any]]] = None,
        mcp_client = None
    ) -> str:
        """
        Send a message to Gemini and handle tool calls if needed
        """
        try:
            # Build the conversation history for Gemini
            chat_history = []
            for msg in conversation_history:
                role = "user" if msg["role"] == "user" else "model"
                chat_history.append({"role": role, "parts": [msg["content"]]})

            # Create chat session
            if tools and mcp_client:
                # Convert tools to Gemini format
                gemini_tools = self._convert_tools_to_gemini_format(tools)
                chat = self.model.start_chat(history=chat_history)

                # Send message with tools
                response = chat.send_message(
                    user_message,
                    tools=gemini_tools
                )

                # Handle function calls iteratively
                while response.candidates[0].content.parts[0].function_call:
                    function_call = response.candidates[0].content.parts[0].function_call
                    tool_name = function_call.name
                    tool_args = dict(function_call.args)

                    logger.info(f"Gemini requesting tool: {tool_name} with args: {tool_args}")

                    # Call the MCP tool
                    tool_result = await mcp_client.call_tool(tool_name, tool_args)

                    # Format the result
                    result_content = self._format_tool_result(tool_result)

                    # Send the function response back to Gemini
                    response = chat.send_message(
                        genai.types.content_types.to_content({
                            "parts": [{
                                "function_response": {
                                    "name": tool_name,
                                    "response": {"result": result_content}
                                }
                            }]
                        })
                    )

                return response.text
            else:
                # Simple chat without tools
                chat = self.model.start_chat(history=chat_history)
                response = chat.send_message(user_message)
                return response.text

        except Exception as e:
            logger.error(f"Error in Gemini chat: {e}")
            raise

    def _convert_tools_to_gemini_format(self, tools: List[Dict[str, Any]]) -> List[Any]:
        """Convert MCP tools to Gemini function calling format"""
        gemini_tools = []
        for tool in tools:
            function_declaration = genai.types.FunctionDeclaration(
                name=tool["name"],
                description=tool["description"],
                parameters=tool.get("parameters", {"type": "object", "properties": {}})
            )
            gemini_tools.append(function_declaration)

        return [genai.types.Tool(function_declarations=gemini_tools)]

    def _format_tool_result(self, result: Any) -> str:
        """Format MCP tool result for Gemini"""
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
