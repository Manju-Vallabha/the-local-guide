import os
import io
from typing import Optional
from google.cloud import speech
from google.api_core import exceptions as google_exceptions
import logging
from dotenv import load_dotenv

# Load environment variables early
load_dotenv()

logger = logging.getLogger(__name__)

class SpeechToTextService:
    """Service for Google Cloud Speech-to-Text API integration."""
    
    def __init__(self):
        """Initialize the Speech-to-Text client."""
        try:
            # Initialize the client - will use GOOGLE_APPLICATION_CREDENTIALS env var
            self.client = speech.SpeechClient()
            logger.info("Speech-to-Text client initialized successfully")
        except Exception as e:
            logger.error(f"Failed to initialize Speech-to-Text client: {e}")
            self.client = None
    
    async def transcribe_audio(
        self, 
        audio_content: bytes, 
        language_code: str = "hi-IN",
        sample_rate: int = 16000,
        encoding: speech.RecognitionConfig.AudioEncoding = speech.RecognitionConfig.AudioEncoding.LINEAR16
    ) -> dict:
        """
        Transcribe audio content to text using Google Speech-to-Text API.
        
        Args:
            audio_content: Raw audio bytes
            language_code: Language code (default: hi-IN for Hindi India)
            sample_rate: Audio sample rate in Hz (default: 16000)
            encoding: Audio encoding format (default: LINEAR16)
            
        Returns:
            Dictionary containing transcript, confidence, and metadata
        """
        if not self.client:
            raise RuntimeError("Speech-to-Text client not initialized")
        
        try:
            # Configure recognition settings
            config = speech.RecognitionConfig(
                encoding=encoding,
                sample_rate_hertz=sample_rate,
                language_code=language_code,
                enable_automatic_punctuation=True,
                enable_word_confidence=True,
                model="latest_long"  # Use latest model for better accuracy
            )
            
            # Create audio object
            audio = speech.RecognitionAudio(content=audio_content)
            
            # Perform synchronous speech recognition
            response = self.client.recognize(config=config, audio=audio)
            
            if not response.results:
                return {
                    "transcript": "",
                    "confidence": 0.0,
                    "alternatives": [],
                    "language_code": language_code,
                    "error": "No speech detected in audio"
                }
            
            # Get the best result
            result = response.results[0]
            alternative = result.alternatives[0]
            
            # Extract word-level confidence if available
            word_info = []
            if hasattr(alternative, 'words'):
                word_info = [
                    {
                        "word": word.word,
                        "confidence": word.confidence,
                        "start_time": word.start_time.total_seconds(),
                        "end_time": word.end_time.total_seconds()
                    }
                    for word in alternative.words
                ]
            
            return {
                "transcript": alternative.transcript.strip(),
                "confidence": alternative.confidence,
                "alternatives": [alt.transcript for alt in result.alternatives[1:5]],  # Top 5 alternatives
                "language_code": language_code,
                "word_info": word_info,
                "processing_time": None  # Could add timing if needed
            }
            
        except google_exceptions.InvalidArgument as e:
            logger.error(f"Invalid argument for speech recognition: {e}")
            raise ValueError(f"Invalid audio format or configuration: {e}")
        
        except google_exceptions.DeadlineExceeded as e:
            logger.error(f"Speech recognition timeout: {e}")
            raise TimeoutError("Speech recognition request timed out")
        
        except google_exceptions.PermissionDenied as e:
            logger.error(f"Permission denied for speech recognition: {e}")
            raise PermissionError("Insufficient permissions for Speech-to-Text API")
        
        except Exception as e:
            logger.error(f"Unexpected error in speech recognition: {e}")
            raise RuntimeError(f"Speech recognition failed: {e}")
    
    async def transcribe_streaming(self, audio_stream, language_code: str = "hi-IN"):
        """
        Transcribe streaming audio (for future real-time implementation).
        
        Args:
            audio_stream: Stream of audio data
            language_code: Language code for recognition
            
        Returns:
            Generator yielding transcription results
        """
        if not self.client:
            raise RuntimeError("Speech-to-Text client not initialized")
        
        # This is a placeholder for streaming implementation
        # Would be used for real-time voice input in the future
        raise NotImplementedError("Streaming transcription not yet implemented")
    
    def is_available(self) -> bool:
        """Check if the Speech-to-Text service is available."""
        return self.client is not None
    
    def get_supported_languages(self) -> list:
        """Get list of supported language codes."""
        return [
            "hi-IN",  # Hindi (India)
            "en-IN",  # English (India)
            "te-IN",  # Telugu (India)
            "en-US",  # English (US)
            "en-GB",  # English (UK)
        ]

# Global service instance
speech_service = SpeechToTextService()