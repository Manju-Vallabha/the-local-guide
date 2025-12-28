from pydantic import BaseModel, Field, validator
from typing import Dict, Optional
from datetime import datetime
from .translation import SupportedLanguage

class NotificationPreferences(BaseModel):
    new_recommendations: bool = Field(True, description="Notify about new recommendations", alias="newRecommendations")
    translation_updates: bool = Field(False, description="Notify about translation improvements", alias="translationUpdates")
    system_updates: bool = Field(True, description="Notify about system updates", alias="systemUpdates")
    
    class Config:
        populate_by_name = True  # Allow both field names and aliases

class UserPreferences(BaseModel):
    preferred_language: SupportedLanguage = Field(SupportedLanguage.ENGLISH, description="User's preferred language", alias="preferredLanguage")
    location_sharing: bool = Field(False, description="Whether user allows location sharing", alias="locationSharing")
    cache_translations: bool = Field(True, description="Whether to cache user's translations", alias="cacheTranslations")
    voice_input_enabled: bool = Field(True, description="Whether voice input is enabled", alias="voiceInputEnabled")
    notification_preferences: NotificationPreferences = Field(default_factory=NotificationPreferences, description="Notification settings", alias="notificationPreferences")
    theme: Optional[str] = Field("light", description="UI theme preference")
    
    class Config:
        populate_by_name = True  # Allow both field names and aliases
    
    @validator('theme')
    def validate_theme(cls, v):
        if v is not None:
            allowed_themes = ["light", "dark", "auto"]
            if v not in allowed_themes:
                raise ValueError(f'Theme must be one of: {", ".join(allowed_themes)}')
        return v

class UserSession(BaseModel):
    id: str = Field(..., description="Unique session identifier")
    preferences: UserPreferences = Field(..., description="User preferences")
    created_at: datetime = Field(default_factory=datetime.utcnow, description="Session creation time")
    last_active: datetime = Field(default_factory=datetime.utcnow, description="Last activity time")
    ip_address: Optional[str] = Field(None, description="User's IP address")
    user_agent: Optional[str] = Field(None, description="User's browser/device info")
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }

class UserPreferencesUpdate(BaseModel):
    preferred_language: Optional[SupportedLanguage] = Field(None, description="Updated preferred language", alias="preferredLanguage")
    location_sharing: Optional[bool] = Field(None, description="Updated location sharing setting", alias="locationSharing")
    cache_translations: Optional[bool] = Field(None, description="Updated translation caching setting", alias="cacheTranslations")
    voice_input_enabled: Optional[bool] = Field(None, description="Updated voice input setting", alias="voiceInputEnabled")
    notification_preferences: Optional[NotificationPreferences] = Field(None, description="Updated notification settings", alias="notificationPreferences")
    theme: Optional[str] = Field(None, description="Updated theme preference")
    
    class Config:
        populate_by_name = True  # Allow both field names and aliases
    
    @validator('theme')
    def validate_theme(cls, v):
        if v is not None:
            allowed_themes = ["light", "dark", "auto"]
            if v not in allowed_themes:
                raise ValueError(f'Theme must be one of: {", ".join(allowed_themes)}')
        return v

class UserActivity(BaseModel):
    session_id: str = Field(..., description="Session identifier")
    action: str = Field(..., description="Action performed")
    timestamp: datetime = Field(default_factory=datetime.utcnow, description="Action timestamp")
    details: Optional[Dict] = Field(None, description="Additional action details")
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }

# Default preferences
DEFAULT_USER_PREFERENCES = UserPreferences(
    preferred_language=SupportedLanguage.ENGLISH,
    location_sharing=False,
    cache_translations=True,
    voice_input_enabled=True,
    notification_preferences=NotificationPreferences(),
    theme="light"
)