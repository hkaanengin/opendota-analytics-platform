from pydantic import BaseModel
from typing import List, Optional


class Message(BaseModel):
    role: str  # "user" or "assistant"
    content: str


class ChatRequest(BaseModel):
    message: str
    conversation_history: Optional[List[Message]] = []


class ChatResponse(BaseModel):
    response: str
    conversation_history: List[Message]
