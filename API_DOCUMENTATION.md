# The Local Guide API Documentation

> **Comprehensive API reference for The Local Guide - A culturally-aware tourist assistant**

## 📋 Table of Contents

- [Overview](#overview)
- [Authentication](#authentication)
- [Base URLs](#base-urls)
- [Translation API](#translation-api)
- [Recommendations API](#recommendations-api)
- [User Preferences API](#user-preferences-api)
- [Health & Status API](#health--status-api)
- [Error Handling](#error-handling)
- [Rate Limits](#rate-limits)
- [SDKs & Examples](#sdks--examples)

## 🌟 Overview

The Local Guide API provides culturally-aware translation and recommendation services for tourists visiting Varanasi. Built with FastAPI and deployed on Google Cloud Functions, it offers high-performance, scalable endpoints for:

- **Real-time slang translation** with cultural context
- **Voice-to-text processing** using Google Speech-to-Text
- **Curated local recommendations** for food and shopping
- **User preference management** with session handling

### Key Features
- ⚡ **Sub-200ms response times** with intelligent caching
- 🌍 **Multi-language support** (English, Hindi, Telugu)
- 🎤 **Voice input processing** with multiple audio formats
- 🏪 **Cultural context** for authentic local experiences
- 🔒 **Secure API key management** via Google Cloud

## 🔐 Authentication

The API uses Google Cloud service account authentication for external API calls. Client applications don't require authentication for public endpoints.

### Service Account Setup
```bash
# Set environment variable
export GOOGLE_APPLICATION_CREDENTIALS="path/to/service-account-key.json"

# Or in .env file
GOOGLE_APPLICATION_CREDENTIALS=./path/to/service-account-key.json
```

## 🌐 Base URLs

| Environment | Base URL |
|-------------|----------|
| Development | `http://localhost:8000` |
| Production | `https://your-cloud-function-url` |

## 🗣️ Translation API

### Translate Text

Translate Varanasi slang and local phrases with cultural context.

```http
POST /api/translate
Content-Type: application/json
```

#### Request Body
```json
{
  "text": "Bhaiya, yahan kya famous hai?",
  "target_language": "en",
  "source_language": "hi",
  "context": "varanasi_slang"
}
```

#### Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `text` | string | ✅ | Text to translate (max 1000 chars) |
| `target_language` | string | ✅ | Target language code (`en`, `hi`, `te`) |
| `source_language` | string | ❌ | Source language (auto-detect if null) |
| `context` | string | ❌ | Translation context (`varanasi_slang`, `general`) |

#### Response
```json
{
  "original_text": "Bhaiya, yahan kya famous hai?",
  "translated_text": "Brother, what is famous here?",
  "confidence": 0.95,
  "detected_language": "hi",
  "target_language": "en",
  "cached": false,
  "slang_enhanced": true
}
```

#### Response Fields
| Field | Type | Description |
|-------|------|-------------|
| `original_text` | string | Input text |
| `translated_text` | string | Translated output |
| `confidence` | float | Translation confidence (0.0-1.0) |
| `detected_language` | string | Auto-detected source language |
| `target_language` | string | Target language code |
| `cached` | boolean | Whether result was cached |
| `slang_enhanced` | boolean | Whether slang context was applied |

---

### Speech to Text

Convert audio input to text using Google Speech-to-Text API.

```http
POST /api/speech-to-text
Content-Type: multipart/form-data
```

#### Request Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `audio` | file | ✅ | Audio file (WAV, FLAC, OGG, WEBM) |
| `language_code` | string | ❌ | Language code (default: `en-US`) |
| `sample_rate` | integer | ❌ | Sample rate in Hz (default: 16000) |

#### Example Request
```bash
curl -X POST "http://localhost:8000/api/speech-to-text" \
  -F "audio=@recording.wav" \
  -F "language_code=hi-IN" \
  -F "sample_rate=16000"
```

#### Response
```json
{
  "transcript": "भैया यहाँ क्या फेमस है",
  "confidence": 0.92,
  "language_code": "hi-IN",
  "alternatives": [
    {
      "transcript": "भाई यहाँ क्या फेमस है",
      "confidence": 0.87
    }
  ],
  "word_info": [
    {
      "word": "भैया",
      "start_time": "0.1s",
      "end_time": "0.5s",
      "confidence": 0.95
    }
  ],
  "processing_time": 1.2
}
```

---

### Speech to Translation

Complete flow: Convert speech to text, then translate to target language.

```http
POST /api/speech-to-translation
Content-Type: multipart/form-data
```

#### Request Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `audio` | file | ✅ | Audio file to process |
| `target_language` | string | ✅ | Target language for translation |
| `source_language_code` | string | ❌ | Source language (default: `en-US`) |
| `sample_rate` | integer | ❌ | Audio sample rate (default: 16000) |
| `use_slang_context` | boolean | ❌ | Use Varanasi slang context (default: true) |

#### Response
```json
{
  "speech_result": {
    "transcript": "भैया यहाँ क्या फेमस है",
    "confidence": 0.92,
    "language_code": "hi-IN",
    "alternatives": []
  },
  "translation_result": {
    "original_text": "भैया यहाँ क्या फेमस है",
    "translated_text": "Brother, what is famous here?",
    "confidence": 0.95,
    "detected_language": "hi",
    "target_language": "en",
    "cached": false,
    "slang_enhanced": true
  },
  "success": true
}
```

---

### Supported Languages

Get list of supported languages for translation and speech recognition.

```http
GET /api/supported-languages
```

#### Response
```json
{
  "translation": [
    {"code": "en", "name": "English"},
    {"code": "hi", "name": "Hindi"},
    {"code": "te", "name": "Telugu"}
  ],
  "speech_recognition": [
    {"code": "en-US", "name": "English (US)"},
    {"code": "hi-IN", "name": "Hindi (India)"},
    {"code": "te-IN", "name": "Telugu (India)"}
  ],
  "recommended": [
    {"code": "en", "name": "English"},
    {"code": "hi", "name": "Hindi"},
    {"code": "te", "name": "Telugu"}
  ]
}
```

---

### Language Detection

Detect the language of provided text.

```http
POST /api/detect-language
Content-Type: application/x-www-form-urlencoded
```

#### Request Body
```
text=भैया यहाँ क्या फेमस है
```

#### Response
```json
{
  "text": "भैया यहाँ क्या फेमस है",
  "detected_language": "hi",
  "confidence": 0.98
}
```

## 🍛 Recommendations API

### Get All Recommendations

Retrieve recommendations across all categories with pagination.

```http
GET /api/recommendations/?limit=10&offset=0
```

#### Query Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `limit` | integer | ❌ | Max results (1-100, default: 10) |
| `offset` | integer | ❌ | Pagination offset (default: 0) |

#### Response
```json
{
  "items": [
    {
      "id": "kachori-ram-bhandar",
      "name": "Kachori at Ram Bhandar",
      "category": "street_food",
      "description": "Crispy, spiced lentil-filled pastries served with tangy tamarind chutney",
      "location": "Vishwanath Gali, near Kashi Vishwanath Temple",
      "cultural_insight": "Best enjoyed hot in the morning with sweet lassi. A traditional Varanasi breakfast that locals have been eating for generations.",
      "image_url": "https://example.com/kachori.jpg",
      "rating": 4.8,
      "tags": ["vegetarian", "breakfast", "traditional", "spicy"],
      "price_range": "₹20-40",
      "safety_rating": "high",
      "best_time": "6:00 AM - 11:00 AM"
    }
  ],
  "total": 45,
  "limit": 10,
  "offset": 0,
  "has_more": true
}
```

---

### Get Categories

Retrieve all available recommendation categories.

```http
GET /api/recommendations/categories
```

#### Response
```json
[
  {
    "value": "street_food",
    "label": "Street Food",
    "description": "Authentic local street food and snacks"
  },
  {
    "value": "shops",
    "label": "Local Shops",
    "description": "Traditional markets and local businesses"
  },
  {
    "value": "crafts",
    "label": "Handicrafts",
    "description": "Traditional Varanasi crafts and textiles"
  }
]
```

---

### Search Recommendations

Search recommendations with filters and query parameters.

```http
GET /api/recommendations/search?query=lassi&category=street_food&min_rating=4.0
```

#### Query Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `query` | string | ❌ | Search query (max 200 chars) |
| `category` | string | ❌ | Filter by category |
| `location` | string | ❌ | Filter by location |
| `min_rating` | float | ❌ | Minimum rating (0.0-5.0) |
| `limit` | integer | ❌ | Max results (1-100) |
| `offset` | integer | ❌ | Pagination offset |

#### Response
Same format as "Get All Recommendations" with filtered results.

---

### Get Recommendations by Category

Retrieve recommendations filtered by specific category.

```http
GET /api/recommendations/street_food?limit=5
```

#### Path Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `category` | string | ✅ | Category name (`street_food`, `shops`, `crafts`) |

#### Response
Same format as "Get All Recommendations" with category-filtered results.

---

### Get Recommendation by ID

Retrieve a specific recommendation by its unique identifier.

```http
GET /api/recommendations/item/kachori-ram-bhandar
```

#### Response
```json
{
  "id": "kachori-ram-bhandar",
  "name": "Kachori at Ram Bhandar",
  "category": "street_food",
  "description": "Crispy, spiced lentil-filled pastries served with tangy tamarind chutney",
  "location": "Vishwanath Gali, near Kashi Vishwanath Temple",
  "cultural_insight": "Best enjoyed hot in the morning with sweet lassi. A traditional Varanasi breakfast that locals have been eating for generations.",
  "image_url": "https://example.com/kachori.jpg",
  "rating": 4.8,
  "tags": ["vegetarian", "breakfast", "traditional", "spicy"],
  "price_range": "₹20-40",
  "safety_rating": "high",
  "best_time": "6:00 AM - 11:00 AM",
  "hygiene_tips": [
    "Choose stalls with high turnover",
    "Ensure oil is hot and fresh",
    "Avoid if sitting for too long"
  ],
  "cultural_etiquette": [
    "Eat with right hand only",
    "Share with others if in a group",
    "Don't waste food - it's considered disrespectful"
  ]
}
```

---

### Get Recommendation Statistics

Retrieve statistics about the recommendation database.

```http
GET /api/recommendations/stats
```

#### Response
```json
{
  "total_items": 45,
  "categories": {
    "street_food": 20,
    "shops": 15,
    "crafts": 10
  },
  "average_rating": 4.3,
  "last_updated": "2024-12-28T10:30:00Z",
  "featured_items": 8,
  "verified_items": 42
}
```

## 👤 User Preferences API

### Get User Preferences

Retrieve current user preferences for the session.

```http
GET /api/preferences/
Headers:
  X-Session-ID: optional-session-id
```

#### Response
```json
{
  "preferred_language": "en",
  "location_sharing": false,
  "cache_translations": true,
  "voice_input_enabled": true,
  "notification_preferences": {
    "cultural_tips": true,
    "safety_alerts": true,
    "new_recommendations": false
  },
  "dietary_restrictions": ["vegetarian"],
  "cultural_sensitivity_level": "high"
}
```

---

### Save User Preferences

Save complete user preferences for the session.

```http
POST /api/preferences/
Content-Type: application/json
Headers:
  X-Session-ID: optional-session-id
```

#### Request Body
```json
{
  "preferred_language": "hi",
  "location_sharing": true,
  "cache_translations": true,
  "voice_input_enabled": true,
  "notification_preferences": {
    "cultural_tips": true,
    "safety_alerts": true,
    "new_recommendations": true
  },
  "dietary_restrictions": ["vegetarian", "jain"],
  "cultural_sensitivity_level": "high"
}
```

#### Response
```json
{
  "message": "Preferences saved successfully",
  "success": true
}
```

---

### Update User Preferences

Update specific preference fields without overwriting others.

```http
PATCH /api/preferences/
Content-Type: application/json
```

#### Request Body
```json
{
  "preferred_language": "te",
  "voice_input_enabled": false
}
```

#### Response
```json
{
  "status": "success",
  "message": "Preferences updated successfully"
}
```

---

### Reset User Preferences

Reset all preferences to default values.

```http
DELETE /api/preferences/
```

#### Response
```json
{
  "status": "success",
  "message": "Preferences reset to default"
}
```

---

### Get Session Information

Retrieve current session details and metadata.

```http
GET /api/preferences/session
```

#### Response
```json
{
  "session_id": "550e8400-e29b-41d4-a716-446655440000",
  "created_at": "2024-12-28T10:00:00Z",
  "last_active": "2024-12-28T10:30:00Z",
  "preferences_set": true
}
```

## 🏥 Health & Status API

### Root Endpoint

Basic API information and health check.

```http
GET /
```

#### Response
```json
{
  "message": "The Local Guide API is running",
  "version": "1.0.0",
  "environment": "development",
  "docs": "/docs",
  "status": "healthy"
}
```

---

### Health Check

Detailed health status of the API and its dependencies.

```http
GET /health
```

#### Response
```json
{
  "status": "healthy",
  "service": "local-guide-api",
  "version": "1.0.0",
  "environment": "production",
  "dependencies": {
    "google_translation": "healthy",
    "google_speech": "healthy",
    "cache_service": "healthy"
  },
  "uptime": "2h 15m 30s",
  "timestamp": "2024-12-28T10:30:00Z"
}
```

## ⚠️ Error Handling

The API uses standard HTTP status codes and returns consistent error responses.

### Error Response Format
```json
{
  "error": {
    "code": "TRANSLATION_FAILED",
    "message": "Translation service is temporarily unavailable",
    "details": "Google Translation API rate limit exceeded",
    "timestamp": "2024-12-28T10:30:00Z",
    "request_id": "req_123456789"
  }
}
```

### Common Error Codes

| HTTP Status | Error Code | Description |
|-------------|------------|-------------|
| 400 | `INVALID_INPUT` | Invalid request parameters |
| 401 | `UNAUTHORIZED` | Authentication required |
| 403 | `FORBIDDEN` | Insufficient permissions |
| 404 | `NOT_FOUND` | Resource not found |
| 408 | `TIMEOUT` | Request timeout |
| 429 | `RATE_LIMIT_EXCEEDED` | Too many requests |
| 500 | `INTERNAL_ERROR` | Server error |
| 503 | `SERVICE_UNAVAILABLE` | External service unavailable |

### Translation-Specific Errors

| Error Code | Description |
|------------|-------------|
| `TRANSLATION_FAILED` | Translation service error |
| `UNSUPPORTED_LANGUAGE` | Language not supported |
| `TEXT_TOO_LONG` | Input text exceeds limit |
| `SPEECH_RECOGNITION_FAILED` | Audio processing error |
| `INVALID_AUDIO_FORMAT` | Unsupported audio format |

### Recommendation-Specific Errors

| Error Code | Description |
|------------|-------------|
| `CATEGORY_NOT_FOUND` | Invalid category |
| `NO_RECOMMENDATIONS` | No results found |
| `INVALID_SEARCH_QUERY` | Search query too short/long |

## 🚦 Rate Limits

The API implements rate limiting to ensure fair usage and system stability.

### Rate Limit Headers
```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
```

### Limits by Endpoint

| Endpoint | Rate Limit | Window |
|----------|------------|--------|
| Translation | 100 requests | 1 hour |
| Speech-to-Text | 50 requests | 1 hour |
| Recommendations | 200 requests | 1 hour |
| Preferences | 50 requests | 1 hour |

### Rate Limit Exceeded Response
```json
{
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Rate limit exceeded. Try again in 3600 seconds.",
    "retry_after": 3600
  }
}
```

## 📚 SDKs & Examples

### JavaScript/TypeScript Example

```typescript
// Translation client
class LocalGuideClient {
  constructor(private baseUrl: string) {}

  async translateText(text: string, targetLanguage: string): Promise<TranslationResponse> {
    const response = await fetch(`${this.baseUrl}/api/translate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text,
        target_language: targetLanguage,
        context: 'varanasi_slang'
      })
    });
    
    if (!response.ok) {
      throw new Error(`Translation failed: ${response.statusText}`);
    }
    
    return response.json();
  }

  async getRecommendations(category?: string): Promise<RecommendationResponse> {
    const url = category 
      ? `${this.baseUrl}/api/recommendations/${category}`
      : `${this.baseUrl}/api/recommendations/`;
      
    const response = await fetch(url);
    return response.json();
  }
}

// Usage
const client = new LocalGuideClient('http://localhost:8000');

// Translate text
const translation = await client.translateText(
  'Bhaiya, yahan kya famous hai?', 
  'en'
);
console.log(translation.translated_text); // "Brother, what is famous here?"

// Get food recommendations
const recommendations = await client.getRecommendations('street_food');
console.log(recommendations.items);
```

### Python Example

```python
import requests
from typing import Optional, Dict, Any

class LocalGuideClient:
    def __init__(self, base_url: str):
        self.base_url = base_url.rstrip('/')
    
    def translate_text(
        self, 
        text: str, 
        target_language: str,
        source_language: Optional[str] = None
    ) -> Dict[str, Any]:
        """Translate text using the Local Guide API"""
        response = requests.post(
            f"{self.base_url}/api/translate",
            json={
                "text": text,
                "target_language": target_language,
                "source_language": source_language,
                "context": "varanasi_slang"
            }
        )
        response.raise_for_status()
        return response.json()
    
    def get_recommendations(
        self, 
        category: Optional[str] = None,
        limit: int = 10
    ) -> Dict[str, Any]:
        """Get recommendations by category"""
        if category:
            url = f"{self.base_url}/api/recommendations/{category}"
        else:
            url = f"{self.base_url}/api/recommendations/"
        
        response = requests.get(url, params={"limit": limit})
        response.raise_for_status()
        return response.json()

# Usage
client = LocalGuideClient("http://localhost:8000")

# Translate text
translation = client.translate_text(
    "भैया यहाँ क्या फेमस है?", 
    "en"
)
print(translation["translated_text"])

# Get street food recommendations
food_recs = client.get_recommendations("street_food")
for item in food_recs["items"]:
    print(f"{item['name']}: {item['description']}")
```

### cURL Examples

```bash
# Translate text
curl -X POST "http://localhost:8000/api/translate" \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Bhaiya, yahan kya famous hai?",
    "target_language": "en",
    "context": "varanasi_slang"
  }'

# Upload audio for speech-to-text
curl -X POST "http://localhost:8000/api/speech-to-text" \
  -F "audio=@recording.wav" \
  -F "language_code=hi-IN"

# Get street food recommendations
curl "http://localhost:8000/api/recommendations/street_food?limit=5"

# Search recommendations
curl "http://localhost:8000/api/recommendations/search?query=lassi&min_rating=4.0"

# Save user preferences
curl -X POST "http://localhost:8000/api/preferences/" \
  -H "Content-Type: application/json" \
  -d '{
    "preferred_language": "hi",
    "voice_input_enabled": true,
    "dietary_restrictions": ["vegetarian"]
  }'
```

## 🔗 Interactive Documentation

For interactive API exploration and testing:

- **Swagger UI**: `http://localhost:8000/docs`
- **ReDoc**: `http://localhost:8000/redoc`

These interfaces provide:
- Interactive request/response testing
- Complete schema documentation
- Authentication testing
- Response examples and validation

---

**Built with ❤️ using [Kiro AI](https://kiro.ai) - Accelerating API development through intelligent automation**