"""
Health check endpoints for The Local Guide API.
"""

from fastapi import APIRouter, HTTPException
from app.services.google_config import google_config
from app.services.speech_service import speech_service
from app.services.translation_service import translation_service

router = APIRouter(prefix="/health", tags=["health"])

@router.get("/")
async def health_check():
    """Basic health check endpoint."""
    return {
        "status": "healthy",
        "service": "local-guide-api",
        "version": "1.0.0"
    }

@router.get("/google-services")
async def google_services_health():
    """Check Google Cloud services health and configuration."""
    config_status = google_config.get_config_status()
    
    services_status = {
        "google_cloud_config": {
            "configured": config_status["is_configured"],
            "project_id": config_status["project_id"],
            "errors": config_status["validation_errors"]
        },
        "speech_to_text": {
            "available": speech_service.is_available(),
            "supported_languages": speech_service.get_supported_languages()
        },
        "translation": {
            "available": translation_service.is_available(),
            "supported_languages": [lang["code"] for lang in translation_service.get_supported_languages()],
            "cache_stats": translation_service.get_cache_stats()
        }
    }
    
    # Determine overall health
    all_configured = (
        config_status["is_configured"] and
        speech_service.is_available() and
        translation_service.is_available()
    )
    
    return {
        "status": "healthy" if all_configured else "degraded",
        "google_cloud_configured": config_status["is_configured"],
        "services": services_status,
        "setup_instructions": google_config.setup_instructions() if not all_configured else None
    }

@router.get("/detailed")
async def detailed_health_check():
    """Detailed health check with all system information."""
    import os
    import sys
    from datetime import datetime
    
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "system": {
            "python_version": sys.version,
            "platform": sys.platform,
            "environment": {
                "GOOGLE_CLOUD_PROJECT": os.getenv("GOOGLE_CLOUD_PROJECT", "not_set"),
                "GOOGLE_APPLICATION_CREDENTIALS": "set" if os.getenv("GOOGLE_APPLICATION_CREDENTIALS") else "not_set",
                "DEBUG": os.getenv("DEBUG", "false")
            }
        },
        "google_services": await google_services_health()
    }