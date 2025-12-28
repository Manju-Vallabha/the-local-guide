import os
from typing import Optional, Dict, Any
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    # Google Cloud Configuration
    google_application_credentials: Optional[str] = None
    google_cloud_project: Optional[str] = None
    
    # API Configuration
    api_host: str = "0.0.0.0"
    api_port: int = 8000
    
    # Redis Configuration
    redis_url: str = "redis://localhost:6379"
    redis_enabled: bool = True
    
    # Cache TTL settings (in seconds)
    translation_cache_ttl: int = 86400  # 24 hours
    speech_cache_ttl: int = 3600  # 1 hour
    recommendation_cache_ttl: int = 43200  # 12 hours
    
    # Cache size limits (for in-memory cache)
    max_cache_size: int = 1000  # Maximum number of entries
    
    # Cache cleanup settings
    cache_cleanup_interval: int = 3600  # 1 hour
    
    # Development Settings
    debug: bool = True
    
    # CORS Settings
    allowed_origins: list[str] = ["http://localhost:5173"]
    
    class Config:
        env_file = ".env"
    
    def get_cache_settings(self) -> Dict[str, Any]:
        """Get all cache settings as a dictionary."""
        return {
            "redis_url": self.redis_url,
            "redis_enabled": self.redis_enabled,
            "translation_ttl": self.translation_cache_ttl,
            "speech_ttl": self.speech_cache_ttl,
            "recommendation_ttl": self.recommendation_cache_ttl,
            "max_cache_size": self.max_cache_size,
            "cleanup_interval": self.cache_cleanup_interval
        }
    
    def is_redis_preferred(self) -> bool:
        """Check if Redis should be preferred over in-memory cache."""
        return self.redis_enabled and self.redis_url is not None

settings = Settings()