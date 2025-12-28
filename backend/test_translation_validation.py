#!/usr/bin/env python3
"""
Quick test to debug the translation validation issue
"""

import json
from app.models.translation import TranslationRequest, SupportedLanguage

# Test the exact payload that frontend is sending
test_payload = {
    "text": "Hello world",
    "target_language": "hi",
    "source_language": None,
    "context": "varanasi_slang"
}

print("Testing translation request validation...")
print(f"Payload: {json.dumps(test_payload, indent=2)}")

try:
    # Try to create the model
    request = TranslationRequest(**test_payload)
    print("✅ Validation successful!")
    print(f"Parsed request: {request}")
except Exception as e:
    print(f"❌ Validation failed: {e}")
    print(f"Error type: {type(e)}")

# Test with different variations
test_cases = [
    {"text": "Hello", "target_language": "hi"},
    {"text": "Hello", "target_language": "en"},
    {"text": "Hello", "target_language": "te"},
    {"text": "Hello", "target_language": "hindi"},  # This should fail
    {"text": "", "target_language": "hi"},  # This should fail
]

print("\nTesting various cases:")
for i, case in enumerate(test_cases):
    try:
        request = TranslationRequest(**case)
        print(f"Case {i+1}: ✅ {case}")
    except Exception as e:
        print(f"Case {i+1}: ❌ {case} - Error: {e}")