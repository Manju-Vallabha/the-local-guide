"""
Production configuration for The Local Guide API.
This module contains production-specific settings and configurations.
"""

import os
from typing import List, Optional
from pydantic import BaseSettings, validator


class ProductionConfig(BaseSettings):
    """Production configuration settings"""
    
    # Environment
    environment: str = "production"
    debug: bool = False
    
    # Google Cloud
    google_cloud_project: Optional[str] = None
    google_application_credentials: Optional[str] = None
    
    # API Configuration
    api_title: str = "The Local Guide API"
    api_description: str = "API for local slang translation and recommendations in Varanasi"
    api_version: str = "1.0.0"
    
    # CORS Configuration
    allowed_origins: List[str] = [
        "https://your-frontend-domain.com",
        "https://your-custom-domain.com"
    ]
    
    # Caching
    redis_url: Optional[str] = None
    cache_ttl_seconds: int = 3600
    cache_max_size: int = 1000
    enable_caching: bool = True
    
    # Security
    session_cookie_secure: bool = True
    session_cookie_samesite: str = "strict"
    session_cookie_httponly: bool = True
    session_max_age: int = 30 * 24 * 60 * 60  # 30 days
    
    # Performance
    max_translation_length: int = 1000
    max_search_results: int = 100
    request_timeout_seconds: int = 30
    
    # Logging
    log_level: str = "INFO"
    log_format: str = "json"
    
    # Feature Flags
    enable_rate_limiting: bool = True
    enable_analytics: bool = False
    enable_health_checks: bool = True
    
    # Google APIs
    speech_to_text_language_code: str = "en-US"
    speech_sample_rate: int = 16000
    speech_audio_format: str = "LINEAR16"
    
    # Translation
    supported_languages: List[str] = ["en", "hi", "te"]
    default_source_language: str = "en"
    default_target_language: str = "en"
    
    @validator("allowed_origins", pre=True)
    def parse_allowed_origins(cls, v):
        """Parse comma-separated origins from environment variable"""
        if isinstance(v, str):
            return [origin.strip() for origin in v.split(",")]
        return v
    
    @validator("google_cloud_project")
    def validate_google_cloud_project(cls, v):
        """Ensure Google Cloud project is set in production"""
        if not v:
            raise ValueError("GOOGLE_CLOUD_PROJECT must be set in production")
        return v
    
    class Config:
        env_file = ".env.production"
        case_sensitive = False


# Global production config instance
production_config = ProductionConfig()


def get_cors_config() -> dict:
    """Get CORS configuration for production"""
    return {
        "allow_origins": production_config.allowed_origins,
        "allow_credentials": True,
        "allow_methods": ["GET", "POST", "PUT", "DELETE", "PATCH"],
        "allow_headers": ["*"],
        "expose_headers": ["X-Session-ID"]
    }


def get_logging_config() -> dict:
    """Get logging configuration for production"""
    return {
        "version": 1,
        "disable_existing_loggers": False,
        "formatters": {
            "json": {
                "format": '{"timestamp": "%(asctime)s", "level": "%(levelname)s", "logger": "%(name)s", "message": "%(message)s"}',
                "datefmt": "%Y-%m-%d %H:%M:%S"
            },
            "standard": {
                "format": "%(asctime)s [%(levelname)s] %(name)s: %(message)s"
            }
        },
        "handlers": {
            "default": {
                "level": production_config.log_level,
                "formatter": production_config.log_format,
                "class": "logging.StreamHandler",
                "stream": "ext://sys.stdout"
            }
        },
        "loggers": {
            "": {
                "handlers": ["default"],
                "level": production_config.log_level,
                "propagate": False
            }
        }
    }


def get_cache_config() -> dict:
    """Get cache configuration for production"""
    return {
        "redis_url": production_config.redis_url,
        "ttl_seconds": production_config.cache_ttl_seconds,
        "max_size": production_config.cache_max_size,
        "enabled": production_config.enable_caching
    }