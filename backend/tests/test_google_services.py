import pytest
import asyncio
from unittest.mock import Mock, patch, AsyncMock
from app.services.speech_service import SpeechToTextService
from app.services.translation_service import TranslationService

class TestSpeechToTextService:
    """Test cases for Speech-to-Text service."""
    
    @pytest.fixture
    def speech_service(self):
        """Create a speech service instance for testing."""
        with patch('app.services.speech_service.speech.SpeechClient'):
            service = SpeechToTextService()
            service.client = Mock()
            return service
    
    @pytest.mark.asyncio
    async def test_transcribe_audio_success(self, speech_service):
        """Test successful audio transcription."""
        # Mock the Google API response
        mock_result = Mock()
        mock_alternative = Mock()
        mock_alternative.transcript = "नमस्ते, आप कैसे हैं?"
        mock_alternative.confidence = 0.95
        # Mock words attribute to avoid iteration error
        mock_alternative.words = []
        mock_result.alternatives = [mock_alternative]
        
        mock_response = Mock()
        mock_response.results = [mock_result]
        
        speech_service.client.recognize.return_value = mock_response
        
        # Test transcription
        audio_content = b"fake_audio_data"
        result = await speech_service.transcribe_audio(audio_content)
        
        assert result["transcript"] == "नमस्ते, आप कैसे हैं?"
        assert result["confidence"] == 0.95
        assert result["language_code"] == "hi-IN"
        assert "error" not in result
    
    @pytest.mark.asyncio
    async def test_transcribe_audio_no_speech(self, speech_service):
        """Test transcription when no speech is detected."""
        mock_response = Mock()
        mock_response.results = []
        
        speech_service.client.recognize.return_value = mock_response
        
        audio_content = b"silent_audio_data"
        result = await speech_service.transcribe_audio(audio_content)
        
        assert result["transcript"] == ""
        assert result["confidence"] == 0.0
        assert "No speech detected" in result["error"]
    
    @pytest.mark.asyncio
    async def test_transcribe_audio_client_not_initialized(self):
        """Test transcription when client is not initialized."""
        service = SpeechToTextService()
        service.client = None
        
        with pytest.raises(RuntimeError, match="Speech-to-Text client not initialized"):
            await service.transcribe_audio(b"audio_data")
    
    def test_is_available(self, speech_service):
        """Test service availability check."""
        assert speech_service.is_available() is True
        
        speech_service.client = None
        assert speech_service.is_available() is False
    
    def test_get_supported_languages(self, speech_service):
        """Test getting supported languages."""
        languages = speech_service.get_supported_languages()
        
        assert "hi-IN" in languages
        assert "en-IN" in languages
        assert "te-IN" in languages


class TestTranslationService:
    """Test cases for Translation service."""
    
    @pytest.fixture
    def translation_service(self):
        """Create a translation service instance for testing."""
        with patch('app.services.translation_service.translate.Client'):
            service = TranslationService()
            service.client = Mock()
            return service
    
    @pytest.mark.asyncio
    async def test_translate_text_success(self, translation_service):
        """Test successful text translation."""
        # Mock the Google API response
        mock_result = {
            'translatedText': 'Hello, how are you?',
            'detectedSourceLanguage': 'hi'
        }
        
        translation_service.client.translate.return_value = mock_result
        
        # Test translation
        result = await translation_service.translate_text(
            text="नमस्ते, आप कैसे हैं?",
            target_language="en"
        )
        
        assert result["original_text"] == "नमस्ते, आप कैसे हैं?"
        assert result["translated_text"] == "Hello, how are you?"
        assert result["detected_language"] == "hi"
        assert result["target_language"] == "en"
        assert result["cached"] is False
    
    @pytest.mark.asyncio
    async def test_translate_text_caching(self, translation_service):
        """Test translation caching functionality."""
        # Mock the Google API response
        mock_result = {
            'translatedText': 'Hello',
            'detectedSourceLanguage': 'hi'
        }
        
        translation_service.client.translate.return_value = mock_result
        
        # First translation - should call API
        result1 = await translation_service.translate_text("नमस्ते", "en")
        assert result1["cached"] is False
        
        # Second translation - should use cache
        result2 = await translation_service.translate_text("नमस्ते", "en")
        assert result2["cached"] is True
        assert result2["translated_text"] == result1["translated_text"]
    
    @pytest.mark.asyncio
    async def test_translate_empty_text(self, translation_service):
        """Test translation of empty text."""
        result = await translation_service.translate_text("", "en")
        
        assert result["original_text"] == ""
        assert result["translated_text"] == ""
        assert result["confidence"] == 0.0
        assert "Empty text provided" in result["error"]
    
    @pytest.mark.asyncio
    async def test_translate_with_slang_context(self, translation_service):
        """Test translation with Varanasi slang context."""
        # Mock the Google API response
        mock_result = {
            'translatedText': 'Hello sir (respectful address)',
            'detectedSourceLanguage': 'hi'
        }
        
        translation_service.client.translate.return_value = mock_result
        
        # Test translation with slang
        result = await translation_service.translate_text(
            text="नमस्ते बाबू",
            target_language="en",
            use_slang_context=True
        )
        
        assert result["slang_enhanced"] is True
        # The service should have enhanced the text before translation
        translation_service.client.translate.assert_called_once()
        call_args = translation_service.client.translate.call_args[0]
        assert "respectful address" in call_args[0]  # Enhanced text should contain context
    
    @pytest.mark.asyncio
    async def test_detect_language(self, translation_service):
        """Test language detection."""
        mock_result = {
            'language': 'hi',
            'confidence': 0.99
        }
        
        translation_service.client.detect_language.return_value = mock_result
        
        result = await translation_service.detect_language("नमस्ते")
        
        assert result["language"] == "hi"
        assert result["confidence"] == 0.99
        assert result["text"] == "नमस्ते"
    
    def test_get_supported_languages(self, translation_service):
        """Test getting supported languages."""
        mock_languages = [
            {'language': 'en', 'name': 'English'},
            {'language': 'hi', 'name': 'Hindi'},
            {'language': 'te', 'name': 'Telugu'},
            {'language': 'fr', 'name': 'French'}  # Should be filtered out
        ]
        
        translation_service.client.get_languages.return_value = mock_languages
        
        languages = translation_service.get_supported_languages()
        
        assert len(languages) == 3  # Only en, hi, te should be returned
        language_codes = [lang['code'] for lang in languages]
        assert 'en' in language_codes
        assert 'hi' in language_codes
        assert 'te' in language_codes
        assert 'fr' not in language_codes
    
    def test_cache_stats(self, translation_service):
        """Test cache statistics."""
        stats = translation_service.get_cache_stats()
        
        assert "backend" in stats
        assert "status" in stats
        assert "translation_service" in stats
        
        # Check translation service specific stats
        ts_stats = stats["translation_service"]
        assert "total_requests" in ts_stats
        assert "cache_hits" in ts_stats
        assert "api_calls" in ts_stats
        assert "errors" in ts_stats
        assert "cache_hit_ratio" in ts_stats
        assert "cache_backend" in ts_stats
    
    @pytest.mark.asyncio
    async def test_clear_cache(self, translation_service):
        """Test cache clearing."""
        # Test that clear_cache method works
        success = await translation_service.clear_cache()
        assert success


class TestServiceIntegration:
    """Integration tests for both services working together."""
    
    @pytest.mark.asyncio
    async def test_speech_to_translation_flow(self):
        """Test the complete flow from speech to translation."""
        with patch('app.services.speech_service.speech.SpeechClient'), \
             patch('app.services.translation_service.translate.Client'):
            
            # Initialize services
            speech_service = SpeechToTextService()
            translation_service = TranslationService()
            
            speech_service.client = Mock()
            translation_service.client = Mock()
            
            # Mock speech recognition
            mock_speech_result = Mock()
            mock_speech_alternative = Mock()
            mock_speech_alternative.transcript = "नमस्ते बाबू"
            mock_speech_alternative.confidence = 0.95
            mock_speech_alternative.words = []  # Add empty words list
            mock_speech_result.alternatives = [mock_speech_alternative]
            
            mock_speech_response = Mock()
            mock_speech_response.results = [mock_speech_result]
            speech_service.client.recognize.return_value = mock_speech_response
            
            # Mock translation
            mock_translation_result = {
                'translatedText': 'Hello sir',
                'detectedSourceLanguage': 'hi'
            }
            translation_service.client.translate.return_value = mock_translation_result
            
            # Test the complete flow
            audio_content = b"fake_audio_data"
            
            # Step 1: Speech to text
            speech_result = await speech_service.transcribe_audio(audio_content)
            assert speech_result["transcript"] == "नमस्ते बाबू"
            
            # Step 2: Translate the transcribed text
            translation_result = await translation_service.translate_text(
                speech_result["transcript"], 
                "en"
            )
            assert translation_result["translated_text"] == "Hello sir"
            assert translation_result["original_text"] == "नमस्ते बाबू"