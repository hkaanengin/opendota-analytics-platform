from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    gemini_api_key: str
    mcp_server_command: str
    mcp_server_args: str
    frontend_url: str = "http://localhost:3000"

    class Config:
        env_file = ".env"


settings = Settings()
