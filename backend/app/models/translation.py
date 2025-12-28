from pydantic import BaseModel, Field, validator
from typing import Optional, Literal
from enum import Enum
import re

class SupportedLanguage(str, Enum):
    ENGLISH = "en"
    HINDI = "hi"
    TELUGU = "te"

class TranslationRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=5000, description="Text to translate")
    source_language: Optional[str] = Field(None, description="Source language code")
    target_language: SupportedLanguage = Field(..., description="Target language for translation")
    context: Optional[str] = Field("varanasi_slang", description="Translation context")
    
    @validator('text')
    def validate_text(cls, v):
        if not v or v.isspace():
            raise ValueError('Text cannot be empty or only whitespace')
        return v.strip()

class TranslationResponse(BaseModel):
    original_text: str = Field(..., description="Original input text")
    translated_text: str = Field(..., description="Translated text")
    confidence: float = Field(..., ge=0.0, le=1.0, description="Translation confidence score")
    detected_language: Optional[str] = Field(None, description="Detected source language")
    target_language: str = Field(..., description="Target language code")
    cached: bool = Field(False, description="Whether result was served from cache")
    slang_enhanced: bool = Field(False, description="Whether slang context was used")
    processing_time_ms: Optional[float] = Field(None, description="Processing time in milliseconds")

class SpeechToTextRequest(BaseModel):
    audio_format: str = Field("LINEAR16", description="Audio format")
    sample_rate: int = Field(16000, ge=8000, le=48000, description="Audio sample rate in Hz")
    language_code: str = Field("en-US", description="Language code for speech recognition")
    
    @validator('audio_format')
    def validate_audio_format(cls, v):
        allowed_formats = ["LINEAR16", "FLAC", "MULAW", "AMR", "AMR_WB", "OGG_OPUS", "SPEEX_WITH_HEADER_BYTE"]
        if v not in allowed_formats:
            raise ValueError(f'Audio format must be one of: {", ".join(allowed_formats)}')
        return v

class SpeechToTextResponse(BaseModel):
    transcript: str = Field(..., description="Transcribed text from audio")
    confidence: float = Field(..., ge=0.0, le=1.0, description="Transcription confidence score")
    language_code: str = Field(..., description="Language code used for recognition")
    alternatives: Optional[list] = Field([], description="Alternative transcriptions")
    word_info: Optional[list] = Field([], description="Word-level timing and confidence")
    processing_time: Optional[float] = Field(None, description="Processing time in seconds")
    error: Optional[str] = Field(None, description="Error message if transcription failed")

class TranslationError(BaseModel):
    error_code: str = Field(..., description="Error code")
    message: str = Field(..., description="Human-readable error message")
    details: Optional[dict] = Field(None, description="Additional error details")
    timestamp: str = Field(..., description="Error timestamp")

# Language mapping constants
LANGUAGE_CODES = {
    SupportedLanguage.ENGLISH: "en-US",
    SupportedLanguage.HINDI: "hi-IN", 
    SupportedLanguage.TELUGU: "te-IN"
}

LANGUAGE_NAMES = {
    SupportedLanguage.ENGLISH: "English",
    SupportedLanguage.HINDI: "Hindi",
    SupportedLanguage.TELUGU: "Telugu"
}