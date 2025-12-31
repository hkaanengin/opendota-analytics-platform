# OpenDota Analytics Platform

An AI-powered Dota 2 chatbot assistant that uses OpenDota data through an MCP server to answer questions about players, matches, heroes, and game statistics.

## Architecture

```
┌─────────────┐
│   React     │  User Interface (Frontend)
│   Frontend  │
└──────┬──────┘
       │ HTTP REST API
       ▼
┌─────────────────────────────┐
│   FastAPI Backend           │
│                             │
│  - Conversation management  │
│  - Gemini LLM integration  │
│  - MCP client              │
└──────┬──────────────────────┘
       │ MCP Protocol
       ▼
┌─────────────────────────────┐
│   MCP Server                │
│   (OpenDota API wrapper)    │
└─────────────────────────────┘
```
