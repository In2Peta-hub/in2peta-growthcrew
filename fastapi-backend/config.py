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
    
    FB_PAGE_ACCESS_TOKEN: str = os.getenv("FB_PAGE_ACCESS_TOKEN", "").strip()

    # Direct X (Twitter) Developer API v2 integration
    TWITTER_API_KEY: str = os.getenv("TWITTER_API_KEY", "").strip()
    TWITTER_API_SECRET: str = os.getenv("TWITTER_API_SECRET", "").strip()
    TWITTER_ACCESS_TOKEN: str = os.getenv("TWITTER_ACCESS_TOKEN", "").strip()
    TWITTER_ACCESS_TOKEN_SECRET: str = os.getenv("TWITTER_ACCESS_TOKEN_SECRET", "").strip()


    # GrowthCrew outreach (ported from the gpu_platform Fastify module)
    CORECLAW_API_KEY: str = os.getenv("CORECLAW_API_KEY", "")
    AGENTMAIL_API_KEY: str = os.getenv("AGENTMAIL_API_KEY", "")
    AGENTMAIL_WEBHOOK_SECRET: str = os.getenv("AGENTMAIL_WEBHOOK_SECRET", "")
    CENTRAL_INBOX: str = os.getenv("CENTRAL_INBOX", "in2peta@gmail.com")
    PHYSICAL_ADDRESS: str = os.getenv("PHYSICAL_ADDRESS", "")
    UNSUBSCRIBE_URL: str = os.getenv("UNSUBSCRIBE_URL", "")
    CAMPAIGN_CONCURRENCY: int = int(os.getenv("CAMPAIGN_CONCURRENCY", "10"))
    MAX_SENDS_PER_INBOX: int = int(os.getenv("MAX_SENDS_PER_INBOX", "200"))

    # GrowthCrew lead database (MotherDuck: the ~10.6M USA business leads dataset).
    # Leads found here are merged with live CoreClaw search results.
    MOTHERDUCK_TOKEN: str = os.getenv("MOTHERDUCK_TOKEN", "")
    MOTHERDUCK_DATABASE: str = os.getenv("MOTHERDUCK_DATABASE", "business_leads")

    # GrowthCrew lead finder (docs/lead-finder-spec.md). AgentMail inbox that
    # sends sign-in links and Monday digests; the shared secret for the Render
    # cron that calls /digests/run; the review page base URL; and the flag that
    # starts the weekly-digest scheduler thread.
    FINDER_FROM_INBOX: str = os.getenv("FINDER_FROM_INBOX", "")
    FINDER_DIGEST_SECRET: str = os.getenv("FINDER_DIGEST_SECRET", "")
    FRONTEND_URL: str = os.getenv("FRONTEND_URL", "http://localhost:5173")
    FINDER_SCHEDULER: str = os.getenv("FINDER_SCHEDULER", "")
    # Optional testing account; PBKDF2 hash only, never a plaintext password.
    FINDER_TEST_EMAIL: str = os.getenv("FINDER_TEST_EMAIL", "")
    FINDER_TEST_PASSWORD_HASH: str = os.getenv("FINDER_TEST_PASSWORD_HASH", "")

    # GrowthCrew AI drafting (LiteLLM gateway / OpenAI-compatible endpoints)
    LITELLM_BASE_URL: str = os.getenv("LITELLM_BASE_URL", "")
    LITELLM_MASTER_KEY: str = os.getenv("LITELLM_MASTER_KEY", "")
    LITELLM_MODEL: str = os.getenv("LITELLM_MODEL", "kimi-k3")
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
    OPENAI_API_BASE: str = os.getenv("OPENAI_API_BASE", "")
    API_KEY_ENCRYPTION_KEY: str = os.getenv("API_KEY_ENCRYPTION_KEY", "")
    # In2Peta AI Inference API (DeepSeek-Flash)
    IN2PETA_API_KEY: str = os.getenv("IN2PETA_API_KEY", os.getenv("LITELLM_MASTER_KEY", ""))
    IN2PETA_API_URL: str = os.getenv("IN2PETA_API_URL", "https://code.in2peta.com/v1")
    IN2PETA_MODEL: str = os.getenv("IN2PETA_MODEL", "deepseek-v4-flash")
    DISCORD_WEBHOOK_URL: str = os.getenv("DISCORD_WEBHOOK_URL", "")

    # Direct Reddit API v1 integration (OAuth 2.0 / script app)
    REDDIT_CLIENT_ID: str = os.getenv("REDDIT_CLIENT_ID", "").strip()
    REDDIT_CLIENT_SECRET: str = os.getenv("REDDIT_CLIENT_SECRET", "").strip()
    REDDIT_USERNAME: str = os.getenv("REDDIT_USERNAME", "").strip()
    REDDIT_PASSWORD: str = os.getenv("REDDIT_PASSWORD", "").strip()
    REDDIT_REFRESH_TOKEN: str = os.getenv("REDDIT_REFRESH_TOKEN", "").strip()
    REDDIT_ACCESS_TOKEN: str = os.getenv("REDDIT_ACCESS_TOKEN", "").strip()
    REDDIT_USER_AGENT: str = os.getenv("REDDIT_USER_AGENT", "GrowthCrew:v1.0 (social-studio)").strip()
    REDDIT_SUBREDDIT: str = os.getenv("REDDIT_SUBREDDIT", "test").strip()

    # Meta / Facebook OAuth 2.0 (1-Click Client Connect)
    META_APP_ID: str = os.getenv("META_APP_ID", "2310904426390434")
    META_APP_SECRET: str = os.getenv("META_APP_SECRET", "")
    BACKEND_PUBLIC_URL: str = os.getenv("BACKEND_PUBLIC_URL", "https://in2peta-growthcrew-backend.onrender.com")
    FRONTEND_URL: str = os.getenv("FRONTEND_URL", "https://in2peta-postiz.vercel.app")

CONFIG = Config()
