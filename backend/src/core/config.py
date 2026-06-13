from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    PROJECT_NAME: str = "Campus Query API"
    API_V1_STR: str = "/api/v1"
    
    # Database connections
    DATABASE_URL: str
    ALLOCATION_READONLY_DATABASE_URL: str
    DATASETS_READONLY_DATABASE_URL: str
    
    # AI Config
    GEMINI_API_KEY: str
    GEMINI_MODEL_PRO: str = "gemini-2.5-flash"
    GEMINI_MODEL_FLASH: str = "gemini-2.5-flash"
    
    # CORS
    BACKEND_CORS_ORIGINS: list[str] = ["http://localhost:3000", "http://localhost:3001", "http://localhost:3002"]
    
    model_config = SettingsConfigDict(env_file=(".env", "../.env"), env_file_encoding="utf-8", extra="ignore")

settings = Settings()
