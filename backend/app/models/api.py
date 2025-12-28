from pydantic import BaseModel, Field
from typing import Any, Optional, Generic, TypeVar, List
from datetime import datetime
from enum import Enum

T = TypeVar('T')

class ApiStatus(str, Enum):
    SUCCESS = "success"
    ERROR = "error"
    WARNING = "warning"

class ApiResponse(BaseModel, Generic[T]):
    status: ApiStatus = Field(..., description="Response status")
    data: Optional[T] = Field(None, description="Response data")
    message: Optional[str] = Field(None, description="Response message")
    timestamp: datetime = Field(default_factory=datetime.utcnow, description="Response timestamp")
    request_id: Optional[str] = Field(None, description="Unique request identifier")
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }

class ApiError(BaseModel):
    code: str = Field(..., description="Error code")
    message: str = Field(..., description="Human-readable error message")
    details: Optional[dict] = Field(None, description="Additional error details")
    timestamp: datetime = Field(default_factory=datetime.utcnow, description="Error timestamp")
    request_id: Optional[str] = Field(None, description="Request identifier that caused the error")
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }

class PaginatedResponse(BaseModel, Generic[T]):
    items: List[T] = Field(..., description="List of items")
    total: int = Field(..., ge=0, description="Total number of items")
    page: int = Field(..., ge=1, description="Current page number")
    page_size: int = Field(..., ge=1, description="Number of items per page")
    has_next: bool = Field(..., description="Whether there are more pages")
    has_previous: bool = Field(..., description="Whether there are previous pages")

class HealthCheckResponse(BaseModel):
    status: str = Field(..., description="Health status")
    service: str = Field(..., description="Service name")
    timestamp: datetime = Field(default_factory=datetime.utcnow, description="Health check timestamp")
    version: Optional[str] = Field(None, description="Service version")
    uptime: Optional[float] = Field(None, description="Service uptime in seconds")
    dependencies: Optional[dict] = Field(None, description="Status of external dependencies")
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }

class ValidationError(BaseModel):
    field: str = Field(..., description="Field that failed validation")
    message: str = Field(..., description="Validation error message")
    value: Optional[Any] = Field(None, description="Invalid value")

class ValidationErrorResponse(BaseModel):
    message: str = Field("Validation failed", description="General validation error message")
    errors: List[ValidationError] = Field(..., description="List of validation errors")
    timestamp: datetime = Field(default_factory=datetime.utcnow, description="Error timestamp")
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }

# HTTP Status Code Enums
class HttpStatusCode(int, Enum):
    # Success
    OK = 200
    CREATED = 201
    ACCEPTED = 202
    NO_CONTENT = 204
    
    # Client Errors
    BAD_REQUEST = 400
    UNAUTHORIZED = 401
    FORBIDDEN = 403
    NOT_FOUND = 404
    METHOD_NOT_ALLOWED = 405
    CONFLICT = 409
    UNPROCESSABLE_ENTITY = 422
    TOO_MANY_REQUESTS = 429
    
    # Server Errors
    INTERNAL_SERVER_ERROR = 500
    BAD_GATEWAY = 502
    SERVICE_UNAVAILABLE = 503
    GATEWAY_TIMEOUT = 504

# Common error codes
class ErrorCode(str, Enum):
    # Validation errors
    VALIDATION_ERROR = "VALIDATION_ERROR"
    MISSING_FIELD = "MISSING_FIELD"
    INVALID_FORMAT = "INVALID_FORMAT"
    
    # Translation errors
    TRANSLATION_FAILED = "TRANSLATION_FAILED"
    UNSUPPORTED_LANGUAGE = "UNSUPPORTED_LANGUAGE"
    TEXT_TOO_LONG = "TEXT_TOO_LONG"
    
    # Speech processing errors
    SPEECH_PROCESSING_FAILED = "SPEECH_PROCESSING_FAILED"
    INVALID_AUDIO_FORMAT = "INVALID_AUDIO_FORMAT"
    AUDIO_TOO_LONG = "AUDIO_TOO_LONG"
    
    # Recommendation errors
    RECOMMENDATIONS_NOT_FOUND = "RECOMMENDATIONS_NOT_FOUND"
    INVALID_CATEGORY = "INVALID_CATEGORY"
    
    # System errors
    EXTERNAL_API_ERROR = "EXTERNAL_API_ERROR"
    DATABASE_ERROR = "DATABASE_ERROR"
    CACHE_ERROR = "CACHE_ERROR"
    RATE_LIMIT_EXCEEDED = "RATE_LIMIT_EXCEEDED"