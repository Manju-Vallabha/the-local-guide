import os
from typing import Optional, Dict, List
from google.cloud import translate_v2 as translate
from google.api_core import exceptions as google_exceptions
import logging
from datetime import datetime
from dotenv import load_dotenv

# Load environment variables early
load_dotenv()

from .cache_service import cache_service
from app.config import settings

logger = logging.getLogger(__name__)

class TranslationService:
    """Service for Google Cloud Translation API integration with caching."""
    
    def __init__(self):
        """Initialize the Translation client."""
        try:
            # Initialize the client - will use GOOGLE_APPLICATION_CREDENTIALS env var
            self.client = translate.Client()
            logger.info("Translation client initialized successfully")
            
        except Exception as e:
            logger.error(f"Failed to initialize Translation client: {e}")
            self.client = None
        
        # Cache TTL configuration
        self._cache_ttl_seconds = getattr(settings, 'translation_cache_ttl', 3600)
        
        # Varanasi slang dictionary for context-aware translation
        self._varanasi_slang = self._load_slang_dictionary()
        
        # Statistics tracking
        self._stats = {
            "total_requests": 0,
            "cache_hits": 0,
            "api_calls": 0,
            "errors": 0
        }
    
    def _load_slang_dictionary(self) -> Dict[str, Dict[str, str]]:
        """Load Varanasi slang dictionary for better translations."""
        # This would typically be loaded from a file or database
        return {
            # Hindi slang to English/Telugu mappings
            "बाबू": {
                "en": "sir/mister",
                "te": "సార్",
                "context": "respectful address"
            },
            "गंगा": {
                "en": "Ganges river",
                "te": "గంగా నది",
                "context": "sacred river"
            },
            "घाट": {
                "en": "riverfront steps",
                "te": "నది దగ్గర మెట్లు",
                "context": "steps leading to river"
            },
            "आरती": {
                "en": "prayer ceremony",
                "te": "ప్రార్థన వేడుక",
                "context": "evening prayer ritual"
            },
            "पंडित": {
                "en": "priest/scholar",
                "te": "పండితుడు",
                "context": "religious scholar"
            }
        }
    
    def _generate_cache_key(self, text: str, target_language: str, source_language: Optional[str] = None) -> str:
        """Generate a cache key for translation requests."""
        return cache_service.generate_key(
            "translation",
            text=text,
            target_language=target_language,
            source_language=source_language or "auto"
        )
    
    async def _get_cached_translation(self, cache_key: str) -> Optional[Dict]:
        """Get translation from cache if available."""
        try:
            cached_data = await cache_service.get_json(cache_key)
            if cached_data:
                logger.debug(f"Cache hit for translation key: {cache_key[:8]}...")
                self._stats["cache_hits"] += 1
                return cached_data
        except Exception as e:
            logger.error(f"Error retrieving from cache: {e}")
        
        return None
    
    async def _cache_translation(self, cache_key: str, translation_data: Dict):
        """Cache translation result."""
        try:
            success = await cache_service.set_json(
                cache_key, 
                translation_data, 
                self._cache_ttl_seconds
            )
            if success:
                logger.debug(f"Cached translation for key: {cache_key[:8]}...")
            else:
                logger.warning(f"Failed to cache translation for key: {cache_key[:8]}...")
        except Exception as e:
            logger.error(f"Error caching translation: {e}")
    
    def _enhance_with_slang_context(self, text: str, target_language: str) -> str:
        """Enhance translation with Varanasi slang context."""
        enhanced_text = text
        
        # Check if text contains known slang terms
        for slang_term, translations in self._varanasi_slang.items():
            if slang_term in text:
                if target_language in translations:
                    # Add context hint for better translation
                    context = translations.get('context', '')
                    enhanced_text = enhanced_text.replace(
                        slang_term, 
                        f"{slang_term} ({context})"
                    )
        
        return enhanced_text
    
    async def translate_text(
        self,
        text: str,
        target_language: str,
        source_language: Optional[str] = None,
        use_slang_context: bool = True
    ) -> Dict:
        """
        Translate text using Google Translation API with caching.
        
        Args:
            text: Text to translate
            target_language: Target language code (en, hi, te)
            source_language: Source language code (auto-detect if None)
            use_slang_context: Whether to use Varanasi slang context
            
        Returns:
            Dictionary containing translation result and metadata
        """
        self._stats["total_requests"] += 1
        
        if not self.client:
            self._stats["errors"] += 1
            raise RuntimeError("Translation service is not available. Please check Google Cloud configuration.")
        
        if not text.strip():
            return {
                "original_text": text,
                "translated_text": "",
                "confidence": 0.0,
                "detected_language": None,
                "target_language": target_language,
                "cached": False,
                "error": "Empty text provided"
            }
        
        # Generate cache key
        cache_key = self._generate_cache_key(text, target_language, source_language)
        
        # Check cache first
        cached_result = await self._get_cached_translation(cache_key)
        if cached_result:
            cached_result['cached'] = True
            return cached_result
        
        try:
            # Enhance text with slang context if enabled
            enhanced_text = text
            if use_slang_context:
                enhanced_text = self._enhance_with_slang_context(text, target_language)
            
            # Perform translation using Google Cloud Translation
            result = self.client.translate(
                enhanced_text,
                target_language=target_language,
                source_language=source_language,
                format_='text'
            )
            
            self._stats["api_calls"] += 1
            
            # Extract translation data
            translated_text = result['translatedText']
            detected_language = result.get('detectedSourceLanguage')
            
            # Default to English if no language is detected
            if not detected_language:
                detected_language = 'en'
            
            # Calculate confidence (Google Translate doesn't provide this directly)
            # We'll use a heuristic based on text length and language detection
            confidence = self._calculate_confidence(text, translated_text, detected_language)
            
            translation_result = {
                "original_text": text,
                "translated_text": translated_text,
                "confidence": confidence,
                "detected_language": detected_language,
                "target_language": target_language,
                "cached": False,
                "slang_enhanced": use_slang_context and any(slang in text for slang in self._varanasi_slang.keys()),
                "timestamp": datetime.now().isoformat()
            }
            
            # Cache the result
            await self._cache_translation(cache_key, translation_result)
            
            return translation_result
            
        except google_exceptions.InvalidArgument as e:
            self._stats["errors"] += 1
            logger.error(f"Invalid argument for translation: {e}")
            raise ValueError(f"Invalid translation request: {e}")
        
        except google_exceptions.PermissionDenied as e:
            self._stats["errors"] += 1
            logger.error(f"Permission denied for translation: {e}")
            raise PermissionError("Insufficient permissions for Translation API")
        
        except Exception as e:
            self._stats["errors"] += 1
            logger.error(f"Unexpected error in translation: {e}")
            raise RuntimeError(f"Translation failed: {e}")
    
    def _calculate_confidence(self, original: str, translated: str, detected_lang: Optional[str]) -> float:
        """Calculate translation confidence score (heuristic)."""
        confidence = 0.8  # Base confidence
        
        # Adjust based on text length
        if len(original) < 5:
            confidence -= 0.2
        elif len(original) > 100:
            confidence += 0.1
        
        # Adjust based on language detection
        if detected_lang:
            confidence += 0.1
        
        # Adjust if translation seems too similar (might indicate poor translation)
        if original.lower() == translated.lower():
            confidence -= 0.3
        
        return max(0.0, min(1.0, confidence))
    
    async def detect_language(self, text: str) -> Dict:
        """
        Detect the language of the given text.
        
        Args:
            text: Text to analyze
            
        Returns:
            Dictionary containing detected language and confidence
        """
        if not self.client:
            raise RuntimeError("Translation client not initialized")
        
        try:
            result = self.client.detect_language(text)
            
            return {
                "language": result['language'],
                "confidence": result['confidence'],
                "text": text
            }
            
        except Exception as e:
            logger.error(f"Language detection failed: {e}")
            raise RuntimeError(f"Language detection failed: {e}")
    
    def get_supported_languages(self) -> List[Dict]:
        """Get list of supported languages."""
        if not self.client:
            return []
        
        try:
            languages = self.client.get_languages()
            return [
                {
                    "code": lang['language'],
                    "name": lang['name']
                }
                for lang in languages
                if lang['language'] in ['en', 'hi', 'te']  # Filter to our supported languages
            ]
        except Exception as e:
            logger.error(f"Failed to get supported languages: {e}")
            return [
                {"code": "en", "name": "English"},
                {"code": "hi", "name": "Hindi"},
                {"code": "te", "name": "Telugu"}
            ]
    
    def is_available(self) -> bool:
        """Check if the Translation service is available."""
        return self.client is not None
    
    def get_cache_stats(self) -> Dict:
        """Get cache statistics for monitoring."""
        cache_stats = cache_service.get_stats()
        
        # Combine with translation service stats
        return {
            **cache_stats,
            "translation_service": {
                "total_requests": self._stats["total_requests"],
                "cache_hits": self._stats["cache_hits"],
                "api_calls": self._stats["api_calls"],
                "errors": self._stats["errors"],
                "cache_hit_ratio": (
                    self._stats["cache_hits"] / max(self._stats["total_requests"], 1)
                ),
                "cache_backend": cache_service.get_backend_type()
            }
        }
    
    async def clear_cache(self):
        """Clear the translation cache."""
        try:
            success = await cache_service.clear()
            if success:
                logger.info("Translation cache cleared successfully")
            else:
                logger.warning("Failed to clear translation cache")
            return success
        except Exception as e:
            logger.error(f"Error clearing translation cache: {e}")
            return False

# Global service instance
translation_service = TranslationService()