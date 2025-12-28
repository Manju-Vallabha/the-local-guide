import pytest
from pydantic import ValidationError
from app.models import (
    TranslationRequest, 
    TranslationResponse,
    SupportedLanguage,
    RecommendationItem,
    RecommendationCategory,
    UserPreferences,
    ApiResponse,
    ApiStatus
)

class TestTranslationModels:
    def test_translation_request_valid(self):
        """Test valid translation request creation."""
        request = TranslationRequest(
            text="Hello world",
            target_language=SupportedLanguage.HINDI
        )
        assert request.text == "Hello world"
        assert request.target_language == SupportedLanguage.HINDI
        assert request.context == "varanasi_slang"
    
    def test_translation_request_empty_text(self):
        """Test translation request with empty text fails validation."""
        with pytest.raises(ValidationError):
            TranslationRequest(
                text="",
                target_language=SupportedLanguage.HINDI
            )
    
    def test_translation_request_whitespace_text(self):
        """Test translation request with whitespace-only text fails validation."""
        with pytest.raises(ValidationError):
            TranslationRequest(
                text="   ",
                target_language=SupportedLanguage.HINDI
            )
    
    def test_translation_response_valid(self):
        """Test valid translation response creation."""
        response = TranslationResponse(
            original_text="Hello",
            translated_text="नमस्ते",
            confidence=0.95,
            target_language="hi",
            cached=False
        )
        assert response.original_text == "Hello"
        assert response.translated_text == "नमस्ते"
        assert response.confidence == 0.95
        assert response.target_language == "hi"
        assert response.cached is False

class TestRecommendationModels:
    def test_recommendation_item_valid(self):
        """Test valid recommendation item creation."""
        item = RecommendationItem(
            id="food_001",
            name="Kachori Sabzi",
            category=RecommendationCategory.STREET_FOOD,
            description="Traditional deep-fried pastry served with spicy potato curry",
            location="Vishwanath Gali, Varanasi",
            cultural_insight="A popular breakfast item among locals, best enjoyed hot",
            tags=["breakfast", "vegetarian", "spicy"]
        )
        assert item.id == "food_001"
        assert item.category == RecommendationCategory.STREET_FOOD
        assert len(item.tags) == 3
    
    def test_recommendation_item_empty_name(self):
        """Test recommendation item with empty name fails validation."""
        with pytest.raises(ValidationError):
            RecommendationItem(
                id="food_001",
                name="",
                category=RecommendationCategory.STREET_FOOD,
                description="Test description",
                location="Test location",
                cultural_insight="Test insight"
            )

class TestUserModels:
    def test_user_preferences_valid(self):
        """Test valid user preferences creation."""
        prefs = UserPreferences(
            preferred_language=SupportedLanguage.TELUGU,
            location_sharing=True,
            cache_translations=False
        )
        assert prefs.preferred_language == SupportedLanguage.TELUGU
        assert prefs.location_sharing is True
        assert prefs.cache_translations is False
        assert prefs.voice_input_enabled is True  # default value

class TestApiModels:
    def test_api_response_valid(self):
        """Test valid API response creation."""
        response = ApiResponse[str](
            status=ApiStatus.SUCCESS,
            data="test data",
            message="Operation successful"
        )
        assert response.status == ApiStatus.SUCCESS
        assert response.data == "test data"
        assert response.message == "Operation successful"
        assert response.timestamp is not None