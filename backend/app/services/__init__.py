"""
Services package for The Local Guide application.

This package contains all external service integrations including:
- Google Speech-to-Text API
- Google Translation API
- Caching services
- Recommendation services
"""

from .speech_service import speech_service, SpeechToTextService
from .translation_service import translation_service, TranslationService
from .recommendation_service import recommendation_service, RecommendationService

__all__ = [
    'speech_service',
    'SpeechToTextService', 
    'translation_service',
    'TranslationService',
    'recommendation_service',
    'RecommendationService'
]