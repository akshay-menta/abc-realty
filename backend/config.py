import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    # Database — use Supabase/Postgres URI from .env when set; otherwise local SQLite
    BASE_DIR = os.path.abspath(os.path.dirname(__file__))
    SQLALCHEMY_DATABASE_URI = os.getenv(
        "SQLALCHEMY_DATABASE_URI",
        f"sqlite:///{os.path.join(BASE_DIR, 'realestate.db')}",
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    # Recommended for hosted Postgres (Supabase) — recycle stale connections
    SQLALCHEMY_ENGINE_OPTIONS = (
        {"pool_pre_ping": True, "pool_recycle": 300}
        if SQLALCHEMY_DATABASE_URI.startswith("postgresql")
        else {}
    )


    # JWT
    JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "abc-realty-super-secret-key-change-in-production")
    JWT_ACCESS_TOKEN_EXPIRES = 86400  # 24 hours in seconds

    # File uploads
    UPLOAD_FOLDER = os.path.join(BASE_DIR, "uploads")
    MAX_CONTENT_LENGTH = 50 * 1024 * 1024  # 50MB
    ALLOWED_IMAGE_EXTENSIONS = {"png", "jpg", "jpeg", "webp", "gif"}
    ALLOWED_DOC_EXTENSIONS = {"pdf", "doc", "docx", "xlsx", "xls"}

    # LLM Provider — Groq is the default for this project
    # Options: groq | gemini | openai | anthropic
    _explicit_provider = os.getenv("LLM_PROVIDER", "groq").strip().lower()
    GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
    GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")

    if _explicit_provider in {"groq", "gemini", "openai", "anthropic"}:
        LLM_PROVIDER = _explicit_provider
    else:
        LLM_PROVIDER = "groq"

    # Groq — free tier, no credit card (recommended for deploy)
    # https://console.groq.com/keys
    GROQ_MODEL = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")

    # Google Gemini — free tier via AI Studio
    # https://aistudio.google.com/apikey
    GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.0-flash")

    # OpenAI (paid)
    OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
    OPENAI_MODEL = os.getenv("OPENAI_MODEL", "gpt-4o-mini")

    # Anthropic (paid)
    ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY", "")
    ANTHROPIC_MODEL = os.getenv("ANTHROPIC_MODEL", "claude-3-haiku-20240307")

    # Company info
    COMPANY_NAME = "ABC Realty"
    COMPANY_TAGLINE = "Your Trusted Real Estate Partner"
