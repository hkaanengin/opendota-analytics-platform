from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from datetime import datetime
import logging

from app.config import settings
from app.models import (
    ChatRequest, ChatResponse, Message,
    MatchAnalysisRequest, MatchDataResponse,
    TeamfightSummaryRequest, TeamfightSummaryResponse
)
from app.mcp_client import MCPClient
from app.claude_client import ClaudeClient
from app.match_analyzer import TeamfightSummarizer


# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Global clients
mcp_client: MCPClient | None = None
chat_client: ClaudeClient | None = None
teamfight_summarizer: TeamfightSummarizer | None = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown events"""
    global mcp_client, chat_client, teamfight_summarizer

    # Startup
    logger.info("Starting up application...")
    try:
        # Initialize MCP client
        mcp_client = MCPClient(server_url=settings.mcp_server_url)
        await mcp_client.connect()
        logger.info("MCP client connected successfully")

        # Chat path: Sonnet handles tool routing + conversation.
        chat_client = ClaudeClient(api_key=settings.claude_api_key)
        logger.info("Chat LLM client created: Claude (Sonnet)")

        # Analysis path (teamfight summaries) is short, deterministic prose —
        # Haiku is the right tier here, not Sonnet.
        analysis_client = ClaudeClient(
            api_key=settings.claude_api_key,
            model="claude-haiku-4-5-20251001",
        )
        logger.info("Analysis LLM client created: Claude (Haiku)")

        teamfight_summarizer = TeamfightSummarizer(llm_client=analysis_client)
        logger.info("Teamfight Summarizer created")

    except Exception as e:
        logger.error(f"Failed to initialize clients: {e}")
        raise

    yield

    # Shutdown
    logger.info("Shutting down application...")
    if mcp_client:
        await mcp_client.disconnect()


app = FastAPI(
    title="Dota 2 Assistant API",
    description="AI-powered Dota 2 assistant using OpenDota data",
    version="1.0.0",
    lifespan=lifespan
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_url],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "message": "Dota 2 Assistant API is running",
        "mcp_connected": mcp_client is not None,
        "available_tools": len(mcp_client.available_tools) if mcp_client else 0
    }


@app.get("/tools")
async def list_tools():
    """List available MCP tools"""
    if not mcp_client:
        raise HTTPException(status_code=503, detail="MCP client not connected")

    return {
        "tools": mcp_client.available_tools
    }


@app.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """
    Main chat endpoint
    Receives a user message and conversation history, processes it with configured LLM + MCP tools
    """
    if not mcp_client or not chat_client:
        raise HTTPException(status_code=503, detail="Services not initialized")

    try:
        # Convert conversation history to dict format
        history = [
            {"role": msg.role, "content": msg.content}
            for msg in request.conversation_history
        ]

        # Get tools for LLM
        tools = mcp_client.get_tools()

        # Call LLM with tools
        response_text = await chat_client.chat(
            user_message=request.message,
            conversation_history=history,
            tools=tools,
            mcp_client=mcp_client
        )

        # Update conversation history
        updated_history = history + [
            {"role": "user", "content": request.message},
            {"role": "assistant", "content": response_text}
        ]

        # Convert back to Message objects
        message_history = [
            Message(role=msg["role"], content=msg["content"])
            for msg in updated_history
        ]

        return ChatResponse(
            response=response_text,
            conversation_history=message_history
        )

    except Exception as e:
        logger.error(f"Error processing chat request: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/match-analysis", response_model=MatchDataResponse)
async def analyze_match(request: MatchAnalysisRequest):
    """
    Match data endpoint
    Fetches match details from MCP/OpenDota and returns raw data for frontend visualization
    """
    if not mcp_client:
        raise HTTPException(status_code=503, detail="MCP client not initialized")

    try:
        logger.info(f"Received match data request for match ID: {request.match_id}")

        # Fetch match details from MCP
        match_data = await mcp_client.call_tool(
            "get_match_details",
            {"match_id": request.match_id}
        )

        # Check if match is parsed
        if not match_data.get("parsed", False):
            raise HTTPException(
                status_code=400,
                detail="Match is not parsed. Please use request_parse_match first and wait for parsing to complete."
            )

        # Return raw match data for frontend visualization
        return MatchDataResponse(
            match_id=request.match_id,
            fetch_timestamp=datetime.now().isoformat(),
            data=match_data
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching match data: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/teamfight-summary", response_model=TeamfightSummaryResponse)
async def get_teamfight_summary(request: TeamfightSummaryRequest):
    """
    Generate an LLM summary for a single teamfight.
    Called when user clicks on a teamfight in the match timeline.
    """
    if not teamfight_summarizer:
        raise HTTPException(status_code=503, detail="Teamfight summarizer not initialized")

    try:
        logger.info(f"Generating summary for teamfight at {request.teamfight.get('start', 'unknown')}")

        summary = await teamfight_summarizer.summarize_teamfight(request.teamfight)

        return TeamfightSummaryResponse(summary=summary)

    except Exception as e:
        logger.error(f"Error generating teamfight summary: {e}")
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
