from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    gemini_api_key: str
    claude_api_key: str
    mcp_server_url: str = "http://localhost:8080"
    frontend_url: str = "http://localhost:5173"

    # LLM provider selection: "gemini" or "claude"
    chat_llm_provider: str = "gemini"
    analysis_llm_provider: str = "claude"

    class Config:
        env_file = ".env"


settings = Settings()
