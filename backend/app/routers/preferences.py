from fastapi import APIRouter, HTTPException, Depends, Request
from fastapi.responses import JSONResponse
from typing import Optional
import uuid
from datetime import datetime
import logging

from app.models.user import (
    UserPreferences, 
    UserPreferencesUpdate, 
    UserSession,
    DEFAULT_USER_PREFERENCES
)
from app.models.api import ApiResponse, ApiStatus, ValidationErrorResponse
from app.services.cache_service import CacheService

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/api/preferences",
    tags=["preferences"],
    responses={
        404: {"description": "Not found"},
        422: {"model": ValidationErrorResponse}
    }
)

# In-memory session storage (in production, use Redis or database)
sessions = {}
cache_service = CacheService()

def get_session_id(request: Request) -> str:
    """Get or create session ID from request headers or cookies"""
    session_id = request.headers.get("X-Session-ID")
    if not session_id:
        # Try to get from cookies
        session_id = request.cookies.get("session_id")
    
    if not session_id:
        # Create new session
        session_id = str(uuid.uuid4())
        
    return session_id

def get_or_create_session(session_id: str, request: Request) -> UserSession:
    """Get existing session or create new one with default preferences"""
    if session_id not in sessions:
        sessions[session_id] = UserSession(
            id=session_id,
            preferences=DEFAULT_USER_PREFERENCES.copy(),
            ip_address=request.client.host if request.client else None,
            user_agent=request.headers.get("User-Agent")
        )
        logger.info(f"Created new session: {session_id}")
    else:
        # Update last active time
        sessions[session_id].last_active = datetime.utcnow()
    
    return sessions[session_id]

@router.get("/", response_model=UserPreferences)
async def get_preferences(
    request: Request,
    session_id: str = Depends(get_session_id)
):
    """Get user preferences for the current session"""
    try:
        session = get_or_create_session(session_id, request)
        
        # Try to get cached preferences first
        cache_key = f"preferences:{session_id}"
        cached_prefs = await cache_service.get(cache_key)
        
        if cached_prefs:
            logger.info(f"Retrieved cached preferences for session: {session_id}")
            return UserPreferences.parse_obj(cached_prefs)
        
        # Cache the preferences
        await cache_service.set(cache_key, session.preferences.dict(), ttl_seconds=3600)
        
        logger.info(f"Retrieved preferences for session: {session_id}")
        return session.preferences
        
    except Exception as e:
        logger.error(f"Error retrieving preferences: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to retrieve preferences")

@router.post("/", response_model=ApiResponse)
async def save_preferences(
    preferences: UserPreferences,
    request: Request,
    session_id: str = Depends(get_session_id)
):
    """Save user preferences for the current session"""
    try:
        session = get_or_create_session(session_id, request)
        
        # Update session preferences
        session.preferences = preferences
        session.last_active = datetime.utcnow()
        
        # Update cache
        cache_key = f"preferences:{session_id}"
        await cache_service.set(cache_key, preferences.dict(), ttl_seconds=3600)
        
        logger.info(f"Saved preferences for session: {session_id}")
        
        response = JSONResponse(
            content={"message": "Preferences saved successfully", "success": True},
            status_code=200
        )
        
        # Set session cookie
        response.set_cookie(
            key="session_id",
            value=session_id,
            max_age=30 * 24 * 60 * 60,  # 30 days
            httponly=True,
            secure=False,  # Set to True in production with HTTPS
            samesite="lax"
        )
        
        return response
        
    except Exception as e:
        logger.error(f"Error saving preferences: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to save preferences")

@router.patch("/", response_model=ApiResponse)
async def update_preferences(
    preferences_update: UserPreferencesUpdate,
    request: Request,
    session_id: str = Depends(get_session_id)
):
    """Update specific user preference fields"""
    try:
        session = get_or_create_session(session_id, request)
        
        # Update only provided fields
        update_data = preferences_update.dict(exclude_unset=True, by_alias=False)
        
        # Create a new preferences object with updated fields
        current_prefs_dict = session.preferences.dict()
        current_prefs_dict.update(update_data)
        
        # Create new preferences object
        session.preferences = UserPreferences(**current_prefs_dict)
        session.last_active = datetime.utcnow()
        
        # Update cache
        cache_key = f"preferences:{session_id}"
        await cache_service.set(cache_key, session.preferences.dict(), ttl_seconds=3600)
        
        logger.info(f"Updated preferences for session: {session_id}, fields: {list(update_data.keys())}")
        
        return ApiResponse(
            status=ApiStatus.SUCCESS,
            message="Preferences updated successfully"
        )
        
    except Exception as e:
        logger.error(f"Error updating preferences: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to update preferences")

@router.delete("/", response_model=ApiResponse)
async def reset_preferences(
    request: Request,
    session_id: str = Depends(get_session_id)
):
    """Reset user preferences to default values"""
    try:
        session = get_or_create_session(session_id, request)
        
        # Reset to default preferences
        session.preferences = DEFAULT_USER_PREFERENCES.copy()
        session.last_active = datetime.utcnow()
        
        # Update cache
        cache_key = f"preferences:{session_id}"
        await cache_service.set(cache_key, session.preferences.dict(), ttl_seconds=3600)
        
        logger.info(f"Reset preferences to default for session: {session_id}")
        
        return ApiResponse(
            status=ApiStatus.SUCCESS,
            message="Preferences reset to default"
        )
        
    except Exception as e:
        logger.error(f"Error resetting preferences: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to reset preferences")

@router.get("/session", response_model=dict)
async def get_session_info(
    request: Request,
    session_id: str = Depends(get_session_id)
):
    """Get current session information"""
    try:
        session = get_or_create_session(session_id, request)
        
        return {
            "session_id": session.id,
            "created_at": session.created_at.isoformat(),
            "last_active": session.last_active.isoformat(),
            "preferences_set": session.preferences != DEFAULT_USER_PREFERENCES
        }
        
    except Exception as e:
        logger.error(f"Error retrieving session info: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to retrieve session info")