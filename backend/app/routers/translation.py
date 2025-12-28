"""
Translation API endpoints for The Local Guide.
"""

from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from fastapi.responses import JSONResponse
from typing import Optional
import logging
import io
from google.cloud import speech

from app.models.translation import (
    TranslationRequest, 
    TranslationResponse, 
    SpeechToTextRequest, 
    SpeechToTextResponse
)
from app.services.translation_service import translation_service
from app.services.speech_service import speech_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api", tags=["translation"])

@router.post("/translate", response_model=TranslationResponse)
async def translate_text(request: TranslationRequest):
    """
    Translate text from one language to another.
    
    Supports translation of Varanasi slang with cultural context.
    Uses caching to improve performance and reduce API costs.
    """
    try:
        # Validate that translation service is available
        if not translation_service.is_available():
            raise HTTPException(
                status_code=503,
                detail="Translation service is not available. Please check Google Cloud configuration."
            )
        
        # Perform translation
        result = await translation_service.translate_text(
            text=request.text,
            target_language=request.target_language,
            source_language=request.source_language,
            use_slang_context=request.context == "varanasi_slang"
        )
        
        # Return structured response
        return TranslationResponse(
            original_text=result["original_text"],
            translated_text=result["translated_text"],
            confidence=result["confidence"],
            detected_language=result.get("detected_language"),
            target_language=result["target_language"],
            cached=result["cached"],
            slang_enhanced=result.get("slang_enhanced", False)
        )
        
    except ValueError as e:
        logger.error(f"Invalid translation request: {e}")
        raise HTTPException(status_code=400, detail=str(e))
    
    except PermissionError as e:
        logger.error(f"Permission denied for translation: {e}")
        raise HTTPException(status_code=403, detail="Insufficient permissions for translation service")
    
    except Exception as e:
        logger.error(f"Translation failed: {e}")
        raise HTTPException(status_code=500, detail="Translation service error")

@router.post("/speech-to-text", response_model=SpeechToTextResponse)
async def speech_to_text(
    audio: UploadFile = File(..., description="Audio file to transcribe"),
    language_code: str = Form("hi-IN", description="Language code for recognition"),
    sample_rate: int = Form(16000, description="Audio sample rate in Hz")
):
    """
    Convert speech audio to text using Google Speech-to-Text API.
    
    Supports various audio formats with automatic format detection.
    Optimized for Varanasi local languages and accents.
    """
    try:
        # Validate that speech service is available
        if not speech_service.is_available():
            raise HTTPException(
                status_code=503,
                detail="Speech-to-Text service is not available. Please check Google Cloud configuration."
            )
        
        # Validate audio file
        if not audio.content_type or not audio.content_type.startswith('audio/'):
            raise HTTPException(
                status_code=400,
                detail="Invalid file type. Please upload an audio file."
            )
        
        # Read audio content
        audio_content = await audio.read()
        
        if len(audio_content) == 0:
            raise HTTPException(
                status_code=400,
                detail="Empty audio file provided"
            )
        
        # Validate language code
        supported_languages = speech_service.get_supported_languages()
        if language_code not in supported_languages:
            raise HTTPException(
                status_code=400,
                detail=f"Unsupported language code: {language_code}. Supported: {supported_languages}"
            )
        
        # Detect audio format and set appropriate encoding
        encoding = speech.RecognitionConfig.AudioEncoding.LINEAR16  # Default
        if audio.content_type:
            if 'webm' in audio.content_type.lower() or 'opus' in audio.content_type.lower():
                encoding = speech.RecognitionConfig.AudioEncoding.WEBM_OPUS
            elif 'flac' in audio.content_type.lower():
                encoding = speech.RecognitionConfig.AudioEncoding.FLAC
            elif 'ogg' in audio.content_type.lower():
                encoding = speech.RecognitionConfig.AudioEncoding.OGG_OPUS
        
        # Perform speech recognition with detected encoding
        result = await speech_service.transcribe_audio(
            audio_content=audio_content,
            language_code=language_code,
            sample_rate=sample_rate,
            encoding=encoding
        )
        
        # Log the result for debugging
        logger.info(f"Speech recognition result: transcript='{result.get('transcript', '')}', confidence={result.get('confidence', 0)}")
        
        # Check for errors in recognition
        if "error" in result:
            return SpeechToTextResponse(
                transcript="",
                confidence=0.0,
                language_code=language_code,
                processing_time=result.get("processing_time"),
                error=result["error"]
            )
        
        # Return successful response
        return SpeechToTextResponse(
            transcript=result["transcript"],
            confidence=result["confidence"],
            language_code=language_code,
            alternatives=result.get("alternatives", []),
            word_info=result.get("word_info", []),
            processing_time=result.get("processing_time")
        )
        
    except ValueError as e:
        logger.error(f"Invalid speech-to-text request: {e}")
        raise HTTPException(status_code=400, detail=str(e))
    
    except TimeoutError as e:
        logger.error(f"Speech recognition timeout: {e}")
        raise HTTPException(status_code=408, detail="Speech recognition request timed out")
    
    except PermissionError as e:
        logger.error(f"Permission denied for speech recognition: {e}")
        raise HTTPException(status_code=403, detail="Insufficient permissions for speech recognition service")
    
    except Exception as e:
        logger.error(f"Speech recognition failed: {e}")
        raise HTTPException(status_code=500, detail="Speech recognition service error")

@router.post("/speech-to-translation")
async def speech_to_translation(
    audio: UploadFile = File(..., description="Audio file to transcribe and translate"),
    target_language: str = Form(..., description="Target language for translation"),
    source_language_code: str = Form("hi-IN", description="Source language code for speech recognition"),
    sample_rate: int = Form(16000, description="Audio sample rate in Hz"),
    use_slang_context: bool = Form(True, description="Use Varanasi slang context for translation")
):
    """
    Complete flow: Convert speech to text, then translate to target language.
    
    This endpoint combines speech-to-text and translation in a single request
    for optimal user experience and reduced latency.
    """
    try:
        # Validate services are available
        if not speech_service.is_available():
            raise HTTPException(
                status_code=503,
                detail="Speech-to-Text service is not available"
            )
        
        if not translation_service.is_available():
            raise HTTPException(
                status_code=503,
                detail="Translation service is not available"
            )
        
        # Step 1: Speech to text
        audio_content = await audio.read()
        
        if len(audio_content) == 0:
            raise HTTPException(status_code=400, detail="Empty audio file provided")
        
        speech_result = await speech_service.transcribe_audio(
            audio_content=audio_content,
            language_code=source_language_code,
            sample_rate=sample_rate
        )
        
        # Check for speech recognition errors
        if "error" in speech_result or not speech_result.get("transcript"):
            return JSONResponse(
                status_code=200,
                content={
                    "speech_result": {
                        "transcript": speech_result.get("transcript", ""),
                        "confidence": speech_result.get("confidence", 0.0),
                        "error": speech_result.get("error", "No speech detected")
                    },
                    "translation_result": None,
                    "success": False
                }
            )
        
        # Step 2: Translate the transcribed text
        translation_result = await translation_service.translate_text(
            text=speech_result["transcript"],
            target_language=target_language,
            source_language=None,  # Auto-detect from transcribed text
            use_slang_context=use_slang_context
        )
        
        # Return combined result
        return JSONResponse(
            status_code=200,
            content={
                "speech_result": {
                    "transcript": speech_result["transcript"],
                    "confidence": speech_result["confidence"],
                    "language_code": source_language_code,
                    "alternatives": speech_result.get("alternatives", [])
                },
                "translation_result": {
                    "original_text": translation_result["original_text"],
                    "translated_text": translation_result["translated_text"],
                    "confidence": translation_result["confidence"],
                    "detected_language": translation_result.get("detected_language"),
                    "target_language": translation_result["target_language"],
                    "cached": translation_result["cached"],
                    "slang_enhanced": translation_result.get("slang_enhanced", False)
                },
                "success": True
            }
        )
        
    except Exception as e:
        logger.error(f"Speech-to-translation failed: {e}")
        raise HTTPException(status_code=500, detail="Speech-to-translation service error")

@router.get("/supported-languages")
async def get_supported_languages():
    """
    Get list of supported languages for translation and speech recognition.
    """
    try:
        translation_languages = translation_service.get_supported_languages()
        speech_languages = speech_service.get_supported_languages()
        
        return {
            "translation": translation_languages,
            "speech_recognition": speech_languages,
            "recommended": [
                {"code": "en", "name": "English"},
                {"code": "hi", "name": "Hindi"},
                {"code": "te", "name": "Telugu"}
            ]
        }
    except Exception as e:
        logger.error(f"Failed to get supported languages: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve supported languages")

@router.post("/detect-language")
async def detect_language(text: str = Form(..., description="Text to analyze")):
    """
    Detect the language of the provided text.
    """
    try:
        if not translation_service.is_available():
            raise HTTPException(
                status_code=503,
                detail="Translation service is not available"
            )
        
        if not text.strip():
            raise HTTPException(status_code=400, detail="Empty text provided")
        
        result = await translation_service.detect_language(text)
        
        return {
            "text": result["text"],
            "detected_language": result["language"],
            "confidence": result["confidence"]
        }
        
    except Exception as e:
        logger.error(f"Language detection failed: {e}")
        raise HTTPException(status_code=500, detail="Language detection service error")