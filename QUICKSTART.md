# Quick Start Guide

## What We Built

A complete web application with:

### Backend (FastAPI + Python)
- `/backend/app/main.py` - Main FastAPI server with chat endpoint
- `/backend/app/mcp_client.py` - Connects to your MCP server
- `/backend/app/gemini_client.py` - Integrates with Gemini AI
- `/backend/app/models.py` - Data models for requests/responses
- `/backend/app/config.py` - Configuration management

### Frontend (React + Vite)
- Modern chat interface with dark theme
- Real-time connection status indicator
- Auto-scrolling message history
- Loading states and error handling

## Getting Started (First Time)

### 1. Set Up Backend

```bash
# Navigate to backend
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # macOS/Linux
# OR
venv\Scripts\activate     # Windows

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env with your settings:
#   - GEMINI_API_KEY: Get from https://aistudio.google.com/app/apikey
#   - MCP_SERVER_COMMAND: node
#   - MCP_SERVER_ARGS: /path/to/your/mcp/server/index.js
```

### 2. Set Up Frontend

```bash
# Open a new terminal
cd frontend

# Install dependencies
npm install
```

## Running the Application

### Terminal 1 - Backend
```bash
cd backend
source venv/bin/activate  # Activate venv if not already active
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

You should see:
```
INFO:     Application startup complete.
INFO:     Uvicorn running on http://0.0.0.0:8000
```

### Terminal 2 - Frontend
```bash
cd frontend
npm run dev
```

You should see:
```
  VITE v5.x.x  ready in xxx ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

### 3. Open Browser

Navigate to `http://localhost:5173` (or the URL shown in the terminal)

You should see:
- "Dota 2 Assistant" header
- Green "Connected" status (if backend and MCP server are running correctly)
- Welcome message with example questions

## Testing the Application

Try asking:
- "How is player Topson performing?"
- "Show me recent matches"
- "Tell me about hero Invoker"

## Troubleshooting

### Backend won't start
- Check your `.env` file is configured correctly
- Make sure your MCP server path is correct
- Verify your Gemini API key is valid

### Frontend shows "Disconnected"
- Make sure the backend is running on port 8000
- Check backend logs for errors
- Verify MCP server is accessible

### MCP Connection Errors
- Verify your MCP server path in `.env`
- Make sure the MCP server command is correct
- Check MCP server logs for errors

## Project Structure

```
opendota-analytics-platform/
├── backend/              # Python FastAPI backend
│   ├── app/
│   │   ├── main.py      # FastAPI app & endpoints
│   │   ├── mcp_client.py    # MCP integration
│   │   ├── gemini_client.py # Gemini AI
│   │   ├── config.py    # Settings
│   │   └── models.py    # Data models
│   ├── requirements.txt
│   ├── .env.example
│   └── .env (you create this)
│
├── frontend/            # React frontend
│   ├── src/
│   │   ├── components/  # Chat UI components
│   │   ├── services/    # API communication
│   │   └── App.jsx      # Main app
│   └── package.json
│
└── README.md           # Full documentation
```

## Next Steps

See the main [README.md](./README.md) for:
- Detailed API documentation
- Deployment instructions
- Contributing guidelines
- Future enhancement ideas
