import os
from pathlib import Path
from dotenv import load_dotenv

# Load .env file from current directory or root
env_path = Path(__file__).parent / '.env'
if env_path.exists():
    load_dotenv(dotenv_path=env_path)
else:
    load_dotenv()

class Config:
    PORT: int = int(os.getenv("PORT", "3005"))
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    GEMINI_MODEL: str = os.getenv("GEMINI_MODEL", "gemini-3.5-flash")
    POSTIZ_API_URL: str = os.getenv("POSTIZ_API_URL", "http://127.0.0.1:4007/api/public/v1")
    POSTIZ_API_KEY: str = os.getenv("POSTIZ_API_KEY", "")
    S3_BUCKET: str = os.getenv("S3_BUCKET", "in2peta-postiz-media")
    AWS_REGION: str = os.getenv("AWS_REGION", "ap-southeast-2")
    AWS_ACCESS_KEY_ID: str = os.getenv("AWS_ACCESS_KEY_ID", "")
    AWS_SECRET_ACCESS_KEY: str = os.getenv("AWS_SECRET_ACCESS_KEY", "")

    # Direct Meta / Facebook Graph API integration (no Docker/Temporal dependency required)
    FB_PAGE_ID: str = os.getenv("FB_PAGE_ID", "1306999285838432")
    FB_PAGE_ACCESS_TOKEN: str = os.getenv(
        "FB_PAGE_ACCESS_TOKEN",
        "EAAg1wV1x46IBSvtoVuzo1wjvEeJZB8VrZC9FZATCIZA2K6R6GQnuuJq01qwikjZCYlXHzoh2Ev5tjEVz1it8XjZAP0UtZA9AuBUeOFpPtPTU6MxtZAMNHZAsHWVviD552KEPQDoJOFLUmK6pZAq6ipZBujqLQ9l6lwtLnAuxb0WM6FeOU6N1q918nIMnKchgIrLuPttEtiOJgOt"
    )

    # GrowthCrew outreach (ported from the gpu_platform Fastify module)
    CORECLAW_API_KEY: str = os.getenv("CORECLAW_API_KEY", "")
    AGENTMAIL_API_KEY: str = os.getenv("AGENTMAIL_API_KEY", "")
    AGENTMAIL_WEBHOOK_SECRET: str = os.getenv("AGENTMAIL_WEBHOOK_SECRET", "")
    CENTRAL_INBOX: str = os.getenv("CENTRAL_INBOX", "in2peta@gmail.com")
    PHYSICAL_ADDRESS: str = os.getenv("PHYSICAL_ADDRESS", "")
    UNSUBSCRIBE_URL: str = os.getenv("UNSUBSCRIBE_URL", "")
    CAMPAIGN_CONCURRENCY: int = int(os.getenv("CAMPAIGN_CONCURRENCY", "10"))
    MAX_SENDS_PER_INBOX: int = int(os.getenv("MAX_SENDS_PER_INBOX", "200"))
    # In2Peta AI Inference API (DeepSeek-Flash)
    IN2PETA_API_KEY: str = os.getenv("IN2PETA_API_KEY", os.getenv("LITELLM_MASTER_KEY", "sk-in2peta-litellm-dev-master"))
    IN2PETA_API_URL: str = os.getenv("IN2PETA_API_URL", "https://code.in2peta.com/v1")
    IN2PETA_MODEL: str = os.getenv("IN2PETA_MODEL", "deepseek-v4-flash")
    DISCORD_WEBHOOK_URL: str = os.getenv("DISCORD_WEBHOOK_URL", "")

CONFIG = Config()
