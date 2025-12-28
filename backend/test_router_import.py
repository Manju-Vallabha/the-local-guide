#!/usr/bin/env python3

import sys
import traceback

try:
    print("Testing router import...")
    
    # Test individual imports
    print("1. Importing FastAPI components...")
    from fastapi import APIRouter, HTTPException, UploadFile, File, Form
    print("   ✓ FastAPI components imported")
    
    print("2. Importing models...")
    from app.models.translation import TranslationRequest, TranslationResponse
    from app.models.api import ApiResponse, ErrorCode, HttpStatusCode
    print("   ✓ Models imported")
    
    print("3. Importing services...")
    from app.services.translation_service import translation_service
    from app.services.speech_service import speech_service
    print("   ✓ Services imported")
    
    print("4. Creating router...")
    router = APIRouter(prefix="/api", tags=["translation"])
    print("   ✓ Router created")
    
    print("5. Importing full translation module...")
    import app.routers.translation as translation_module
    print("   ✓ Translation module imported")
    
    print("6. Checking router attribute...")
    if hasattr(translation_module, 'router'):
        print("   ✓ Router attribute found")
        print(f"   Router: {translation_module.router}")
    else:
        print("   ✗ Router attribute NOT found")
        print(f"   Available attributes: {dir(translation_module)}")
    
    print("\nAll tests completed!")
    
except Exception as e:
    print(f"Error: {e}")
    traceback.print_exc()