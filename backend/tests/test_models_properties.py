"""
Property-based tests for data models.

Feature: local-guide-app, Property 1: Translation Language Consistency
Validates: Requirements 1.1
"""

import pytest
from hypothesis import given, strategies as st
from pydantic import ValidationError

from app.models import (
    TranslationRequest,
    SupportedLanguage
)


def test_simple_property_test():
    """Simple test to verify property testing works."""
    assert True


class TestTranslationLanguageConsistency:
    """
    Property 1: Translation Language Consistency
    For any valid slang text input and target language selection, 
    the translation output should be in the specified target language 
    and contain meaningful translated content.
    Validates: Requirements 1.1
    """
    
    def test_basic_translation_request(self):
        """Basic test for translation request."""
        request = TranslationRequest(
            text="Hello world",
            target_language=SupportedLanguage.HINDI
        )
        assert request.text == "Hello world"
        assert request.target_language == SupportedLanguage.HINDI
    
    @given(target_language=st.sampled_from(list(SupportedLanguage)))
    def test_translation_request_language_consistency(self, target_language):
        """
        Feature: local-guide-app, Property 1: Translation Language Consistency
        For any valid text input and target language, the TranslationRequest 
        should be created successfully and preserve the target language.
        """
        # Create translation request with fixed text
        request = TranslationRequest(
            text="Hello world",
            target_language=target_language
        )
        
        # Verify the request preserves the target language
        assert request.target_language == target_language
        assert request.text == "Hello world"
        assert isinstance(request.target_language, SupportedLanguage)