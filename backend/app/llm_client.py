from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional


class BaseLLMClient(ABC):
    """Base abstract class for LLM clients (Gemini, Claude, etc.)"""

    @abstractmethod
    async def chat(
        self,
        user_message: str,
        conversation_history: List[Dict[str, str]],
        tools: Optional[List[Dict[str, Any]]] = None,
        mcp_client=None
    ) -> str:
        """
        Send a chat message and get a response.

        Args:
            user_message: The user's message
            conversation_history: List of previous messages
            tools: Optional list of tools for function calling
            mcp_client: Optional MCP client for tool execution

        Returns:
            The assistant's response text
        """
        pass

    @abstractmethod
    async def analyze(
        self,
        data: Dict[str, Any],
        prompt: str,
        system_instruction: str
    ) -> str:
        """
        Perform analysis with custom system instruction (for sub-agents).

        Args:
            data: The data to analyze
            prompt: The analysis prompt
            system_instruction: Custom system instruction for the analysis

        Returns:
            The analysis result text
        """
        pass
