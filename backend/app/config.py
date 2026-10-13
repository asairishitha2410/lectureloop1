from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # Database
    database_url: str = "sqlite:///./lectureloop.db"

    # Security
    secret_key: str = "dev-secret-change-me"
    access_token_expire_minutes: int = 60 * 24 * 7
    algorithm: str = "HS256"

    # CORS
    cors_origins: str = "http://localhost:3000"

    # AI generation
    llm_api_key: str = ""
    llm_base_url: str = "https://api.openai.com/v1"
    llm_model: str = "gpt-4o-mini"

    # Processing
    max_segment_chars: int = 6000
    enable_youtube_captions: bool = True

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]

    @property
    def llm_enabled(self) -> bool:
        return bool(self.llm_api_key)


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
