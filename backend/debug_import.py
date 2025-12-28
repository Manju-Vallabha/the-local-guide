#!/usr/bin/env python3

import sys
import traceback
import importlib.util

try:
    print("Attempting to import translation router...")
    
    # Try to import with error handling
    spec = importlib.util.spec_from_file_location(
        "translation", 
        "app/routers/translation.py"
    )
    translation_module = importlib.util.module_from_spec(spec)
    
    print("Module spec created, executing...")
    spec.loader.exec_module(translation_module)
    
    print("Module executed successfully!")
    print(f"Module attributes: {dir(translation_module)}")
    
    if hasattr(translation_module, 'router'):
        print("Router found!")
    else:
        print("Router not found!")
        
except Exception as e:
    print(f"Import failed: {e}")
    traceback.print_exc()