from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client
from typing import List, Dict, Any
import logging

logger = logging.getLogger(__name__)


class MCPClient:
    def __init__(self, server_command: str, server_args: str):
        self.server_params = StdioServerParameters(
            command=server_command,
            args=server_args.split() if server_args else []
        )
        self.session: ClientSession | None = None
        self.available_tools: List[Dict[str, Any]] = []

    async def connect(self):
        """Connect to the MCP server and list available tools"""
        try:
            self.stdio_transport = await stdio_client(self.server_params).__aenter__()
            self.read, self.write = self.stdio_transport
            self.session = ClientSession(self.read, self.write)
            await self.session.__aenter__()

            # Initialize and list available tools
            await self.session.initialize()
            tools_response = await self.session.list_tools()
            self.available_tools = [
                {
                    "name": tool.name,
                    "description": tool.description,
                    "input_schema": tool.inputSchema
                }
                for tool in tools_response.tools
            ]

            logger.info(f"Connected to MCP server. Available tools: {[t['name'] for t in self.available_tools]}")
            return self.available_tools
        except Exception as e:
            logger.error(f"Failed to connect to MCP server: {e}")
            raise

    async def call_tool(self, tool_name: str, arguments: Dict[str, Any]) -> Any:
        """Call a specific MCP tool"""
        if not self.session:
            raise RuntimeError("MCP client not connected")

        try:
            result = await self.session.call_tool(tool_name, arguments)
            return result
        except Exception as e:
            logger.error(f"Error calling tool {tool_name}: {e}")
            raise

    async def disconnect(self):
        """Disconnect from the MCP server"""
        if self.session:
            await self.session.__aexit__(None, None, None)
            await self.stdio_transport.__aexit__(None, None, None)
            logger.info("Disconnected from MCP server")

    def get_tools_for_gemini(self) -> List[Dict[str, Any]]:
        """Format tools for Gemini function calling"""
        gemini_tools = []
        for tool in self.available_tools:
            gemini_tool = {
                "name": tool["name"],
                "description": tool["description"],
                "parameters": tool["input_schema"]
            }
            gemini_tools.append(gemini_tool)
        return gemini_tools
