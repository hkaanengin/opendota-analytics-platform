from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    gemini_api_key: str
    mcp_server_url: str = "http://localhost:8080"
    frontend_url: str = "http://localhost:5173"

    class Config:
        env_file = ".env"


settings = Settings()
