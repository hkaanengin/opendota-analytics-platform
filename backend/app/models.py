from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime


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


# Legacy models (kept for backwards compatibility)
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


# New models for raw match data (no agents)
class MatchDataResponse(BaseModel):
    """Raw match data from MCP/OpenDota - no agent processing"""
    match_id: int
    fetch_timestamp: str
    data: Dict[str, Any]  # Raw MCP response data


class TeamfightSummaryRequest(BaseModel):
    """Request for a single teamfight summary"""
    teamfight: Dict[str, Any]  # Single teamfight object from match data


class TeamfightSummaryResponse(BaseModel):
    """LLM-generated summary of a teamfight"""
    summary: str
