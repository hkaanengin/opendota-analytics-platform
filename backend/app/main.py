from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import logging

from app.config import settings
from app.models import ChatRequest, ChatResponse, Message, MatchAnalysisRequest, MatchAnalysisResponse
from app.mcp_client import MCPClient
from app.gemini_client import GeminiClient
from app.match_analyzer import MatchAnalysisOrchestrator

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Global clients
mcp_client: MCPClient | None = None
gemini_client: GeminiClient | None = None
match_orchestrator: MatchAnalysisOrchestrator | None = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown events"""
    global mcp_client, gemini_client, match_orchestrator

    # Startup
    logger.info("Starting up application...")
    try:
        # Initialize MCP client
        mcp_client = MCPClient(server_url=settings.mcp_server_url)
        await mcp_client.connect()
        logger.info("MCP client connected successfully")

        # Initialize Gemini client
        gemini_client = GeminiClient(api_key=settings.gemini_api_key)
        logger.info("Gemini client initialized successfully")

        # Initialize Match Analysis Orchestrator
        match_orchestrator = MatchAnalysisOrchestrator(api_key=settings.gemini_api_key)
        logger.info("Match Analysis Orchestrator initialized successfully")

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
    Receives a user message and conversation history, processes it with Gemini + MCP tools
    """
    if not mcp_client or not gemini_client:
        raise HTTPException(status_code=503, detail="Services not initialized")

    try:
        # Convert conversation history to dict format
        history = [
            {"role": msg.role, "content": msg.content}
            for msg in request.conversation_history
        ]

        # Get tools for Gemini
        tools = mcp_client.get_tools_for_gemini()

        # Call Gemini with tools
        response_text = await gemini_client.chat(
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


@app.post("/match-analysis", response_model=MatchAnalysisResponse)
async def analyze_match(request: MatchAnalysisRequest):
    """
    Multi-agent match analysis endpoint
    Fetches match details and runs comprehensive analysis using specialized sub-agents
    """
    if not mcp_client or not match_orchestrator:
        raise HTTPException(status_code=503, detail="Services not initialized")

    try:
        logger.info(f"Received match analysis request for match ID: {request.match_id}")

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

        # Run multi-agent analysis
        analysis_result = await match_orchestrator.analyze_match(match_data)

        return MatchAnalysisResponse(**analysis_result)

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error processing match analysis: {e}")
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
