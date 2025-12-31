# Dota 2 Assistant - Backend

FastAPI backend for the Dota 2 Assistant chatbot.

## Setup

1. **Create a virtual environment:**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

2. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

3. **Configure environment variables:**
   - Copy `.env.example` to `.env`
   - Get a Gemini API key from https://aistudio.google.com/app/apikey
   - Update the MCP server path to point to your existing MCP server
   ```bash
   cp .env.example .env
   # Then edit .env with your values
   ```

4. **Run the server:**
   ```bash
   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```

## API Endpoints

- `GET /` - Health check
- `GET /tools` - List available MCP tools
- `POST /chat` - Main chat endpoint

### Chat Request Example:
```json
{
  "message": "How is player Topson performing?",
  "conversation_history": []
}
```

### Chat Response Example:
```json
{
  "response": "Based on recent data...",
  "conversation_history": [
    {"role": "user", "content": "How is player Topson performing?"},
    {"role": "assistant", "content": "Based on recent data..."}
  ]
}
```

## Project Structure

```
backend/
├── app/
│   ├── main.py           # FastAPI application
│   ├── config.py         # Configuration settings
│   ├── models.py         # Pydantic models
│   ├── mcp_client.py     # MCP client integration
│   └── gemini_client.py  # Gemini API integration
├── requirements.txt      # Python dependencies
├── .env.example         # Environment variables template
└── README.md            # This file
```
