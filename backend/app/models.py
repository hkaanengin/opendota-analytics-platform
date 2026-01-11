from pydantic import BaseModel
from typing import List, Optional, Dict, Any


class Message(BaseModel):
    role: str  # "user" or "assistant"
    content: str


class ChatRequest(BaseModel):
    message: str
    conversation_history: Optional[List[Message]] = []


class ChatResponse(BaseModel):
    response: str
    conversation_history: List[Message]


class MatchAnalysisRequest(BaseModel):
    match_id: int


class AnalysisSection(BaseModel):
    title: str
    agent: str
    content: str
    status: str


class MatchMetadata(BaseModel):
    winner: str
    duration: str
    radiant_score: Optional[int]
    dire_score: Optional[int]


class MatchAnalysisResponse(BaseModel):
    match_id: Optional[int]
    analysis_timestamp: str
    processing_time_ms: float
    agents_used: int
    sections: Dict[str, AnalysisSection]
    metadata: MatchMetadata
