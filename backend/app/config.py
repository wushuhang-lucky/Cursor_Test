import os
from dotenv import load_dotenv

load_dotenv()


class Settings:
    """应用配置，从环境变量读取"""

    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
    OPENAI_MODEL: str = os.getenv("OPENAI_MODEL", "deepseek-chat")
    OPENAI_BASE_URL: str = os.getenv("OPENAI_BASE_URL", "https://api.deepseek.com")
    ENABLE_THINKING: bool = os.getenv("ENABLE_THINKING", "true").lower() == "true"
    SYSTEM_PROMPT: str = os.getenv(
        "SYSTEM_PROMPT",
        "你是一个友好的 AI 助手，请用简洁清晰的中文回答用户的问题。",
    )


settings = Settings()
