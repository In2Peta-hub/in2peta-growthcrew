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

    # Direct Meta / Facebook & Instagram Graph API integration
    FB_PAGE_ID: str = os.getenv("FB_PAGE_ID", "1306999285838432")
    IG_BUSINESS_ACCOUNT_ID: str = os.getenv("IG_BUSINESS_ACCOUNT_ID", "17841415311653642")
    
    # Permanent Never-Expiring Meta Token (expires_at: 0) with Facebook & Instagram permissions
    _PERMANENT_TOKEN = "EAAg1wV1x46IBSjrYyo12ghTVsTi5ireqKVCV13SEspJKtXINV3PZBWmRC1ZA3UIvmwvCNlCHlou45vnmzCr5FKUJre4h4pMMXx8QK7ZA8YO5Sl96TGW7chfaZA2dR3bbnnPF7tZBF03Ue0whPy0ak91xIjKRBoQMrIONxLPxhSJ47WzOy1DLkZAyFhTIQZBZBGQss6jNGkf2"
    _env_token = os.getenv("FB_PAGE_ACCESS_TOKEN", "").strip()
    FB_PAGE_ACCESS_TOKEN: str = (
        _env_token if (_env_token.startswith("EAAg1wV1x46IBSjrYyo") or _env_token.startswith("EAAg1wV1x46IBSmt"))
        else _PERMANENT_TOKEN
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
