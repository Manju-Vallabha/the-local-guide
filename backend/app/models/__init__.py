# Data models for The Local Guide

from .translation import (
    SupportedLanguage,
    TranslationRequest,
    TranslationResponse,
    SpeechToTextRequest,
    SpeechToTextResponse,
    TranslationError,
    LANGUAGE_CODES,
    LANGUAGE_NAMES
)

from .recommendations import (
    RecommendationCategory,
    RecommendationItem,
    RecommendationSearchParams,
    RecommendationResponse,
    CategoryStats,
    RecommendationStats,
    RecommendationError,
    CATEGORY_LABELS,
    CATEGORY_DESCRIPTIONS
)

from .user import (
    NotificationPreferences,
    UserPreferences,
    UserSession,
    UserPreferencesUpdate,
    UserActivity,
    DEFAULT_USER_PREFERENCES
)

from .api import (
    ApiStatus,
    ApiResponse,
    ApiError,
    PaginatedResponse,
    HealthCheckResponse,
    ValidationError,
    ValidationErrorResponse,
    HttpStatusCode,
    ErrorCode
)

__all__ = [
    # Translation models
    "SupportedLanguage",
    "TranslationRequest", 
    "TranslationResponse",
    "SpeechToTextRequest",
    "SpeechToTextResponse",
    "TranslationError",
    "LANGUAGE_CODES",
    "LANGUAGE_NAMES",
    
    # Recommendation models
    "RecommendationCategory",
    "RecommendationItem",
    "RecommendationSearchParams", 
    "RecommendationResponse",
    "CategoryStats",
    "RecommendationStats",
    "RecommendationError",
    "CATEGORY_LABELS",
    "CATEGORY_DESCRIPTIONS",
    
    # User models
    "NotificationPreferences",
    "UserPreferences",
    "UserSession",
    "UserPreferencesUpdate",
    "UserActivity",
    "DEFAULT_USER_PREFERENCES",
    
    # API models
    "ApiStatus",
    "ApiResponse",
    "ApiError",
    "PaginatedResponse",
    "HealthCheckResponse",
    "ValidationError",
    "ValidationErrorResponse",
    "HttpStatusCode",
    "ErrorCode"
]