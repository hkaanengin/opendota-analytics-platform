import httpx
from typing import List, Dict, Any
import logging

logger = logging.getLogger(__name__)


class MCPClient:
    def __init__(self, server_url: str):
        self.server_url = server_url.rstrip('/')
        self.available_tools: List[Dict[str, Any]] = []
        self.client: httpx.AsyncClient | None = None

    async def connect(self):
        """Connect to the MCP server via HTTP and list available tools"""
        try:
            self.client = httpx.AsyncClient(timeout=30.0)

            # Test connection with health check
            health_response = await self.client.get(f"{self.server_url}/health")
            health_response.raise_for_status()
            logger.info(f"MCP server health check passed: {health_response.json()}")

            # Get available tools from debug endpoint (simple, works!)
            tools_response = await self.client.get(f"{self.server_url}/debug/tools")
            tools_response.raise_for_status()
            tools_data = tools_response.json()

            # Store tools - we'll use basic schemas for Gemini
            raw_tools = tools_data.get('tools', [])

            # Add basic input schema for each tool
            for tool in raw_tools:
                tool['inputSchema'] = {
                    "type": "object",
                    "properties": {},
                    "required": []
                }

            self.available_tools = raw_tools

            logger.info(f"Connected to MCP server. Available tools: {[t['name'] for t in self.available_tools]}")
            return self.available_tools
        except Exception as e:
            logger.error(f"Failed to connect to MCP server: {e}")
            raise

    async def call_tool(self, tool_name: str, arguments: Dict[str, Any]) -> Any:
        """Call a specific MCP tool via HTTP"""
        if not self.client:
            raise RuntimeError("MCP client not connected")

        try:
            # Simple HTTP POST to /call_tool endpoint
            request_data = {
                "tool_name": tool_name,
                "arguments": arguments
            }

            logger.info(f"Calling tool {tool_name} with arguments: {arguments}")

            response = await self.client.post(
                f"{self.server_url}/call_tool",
                json=request_data,
                headers={"Content-Type": "application/json"}
            )
            response.raise_for_status()
            result = response.json()

            logger.info(f"Tool {tool_name} response: {str(result)[:200]}...")

            # Return the result
            if result.get("status") == "success":
                return result.get("result")
            else:
                raise Exception(f"MCP tool error: {result.get('message', 'Unknown error')}")

        except Exception as e:
            logger.error(f"Error calling tool {tool_name}: {e}")
            raise

    async def disconnect(self):
        """Disconnect from the MCP server"""
        if self.client:
            await self.client.aclose()
            logger.info("Disconnected from MCP server")

    def get_tools_for_gemini(self) -> List[Dict[str, Any]]:
        """Format tools for Gemini function calling"""
        gemini_tools = []
        for tool in self.available_tools:
            # Use flexible schema since we don't have exact schemas
            gemini_tool = {
                "name": tool["name"],
                "description": tool.get("description", "No description"),
                "parameters": {
                    "type": "object",
                    "properties": {},  # Let Gemini infer from description
                    "required": []
                }
            }
            gemini_tools.append(gemini_tool)
        return gemini_tools
