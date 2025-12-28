"""
Google Cloud configuration and credential management.
"""

import os
import json
from typing import Optional, Dict
import logging
from pathlib import Path

logger = logging.getLogger(__name__)

class GoogleCloudConfig:
    """Manages Google Cloud configuration and credentials."""
    
    def __init__(self):
        """Initialize Google Cloud configuration."""
        self.project_id = os.getenv('GOOGLE_CLOUD_PROJECT')
        self.credentials_path = os.getenv('GOOGLE_APPLICATION_CREDENTIALS')
        self._credentials_valid = None
    
    def is_configured(self) -> bool:
        """Check if Google Cloud is properly configured."""
        if not self.project_id:
            logger.warning("GOOGLE_CLOUD_PROJECT environment variable not set")
            return False
        
        if not self.credentials_path:
            logger.warning("GOOGLE_APPLICATION_CREDENTIALS environment variable not set")
            return False
        
        if not os.path.exists(self.credentials_path):
            logger.error(f"Credentials file not found: {self.credentials_path}")
            return False
        
        return self._validate_credentials()
    
    def _validate_credentials(self) -> bool:
        """Validate the credentials file format."""
        if self._credentials_valid is not None:
            return self._credentials_valid
        
        try:
            with open(self.credentials_path, 'r') as f:
                creds = json.load(f)
            
            required_fields = ['type', 'project_id', 'private_key_id', 'private_key', 'client_email']
            missing_fields = [field for field in required_fields if field not in creds]
            
            if missing_fields:
                logger.error(f"Credentials file missing required fields: {missing_fields}")
                self._credentials_valid = False
                return False
            
            if creds.get('type') != 'service_account':
                logger.error("Credentials file is not a service account key")
                self._credentials_valid = False
                return False
            
            self._credentials_valid = True
            logger.info("Google Cloud credentials validated successfully")
            return True
            
        except json.JSONDecodeError as e:
            logger.error(f"Invalid JSON in credentials file: {e}")
            self._credentials_valid = False
            return False
        except Exception as e:
            logger.error(f"Error validating credentials: {e}")
            self._credentials_valid = False
            return False
    
    def get_config_status(self) -> Dict[str, any]:
        """Get detailed configuration status."""
        return {
            "project_id": self.project_id,
            "credentials_path": self.credentials_path,
            "credentials_file_exists": os.path.exists(self.credentials_path) if self.credentials_path else False,
            "is_configured": self.is_configured(),
            "validation_errors": self._get_validation_errors()
        }
    
    def _get_validation_errors(self) -> list:
        """Get list of configuration validation errors."""
        errors = []
        
        if not self.project_id:
            errors.append("GOOGLE_CLOUD_PROJECT environment variable not set")
        
        if not self.credentials_path:
            errors.append("GOOGLE_APPLICATION_CREDENTIALS environment variable not set")
        elif not os.path.exists(self.credentials_path):
            errors.append(f"Credentials file not found: {self.credentials_path}")
        elif not self._validate_credentials():
            errors.append("Invalid credentials file format")
        
        return errors
    
    def setup_instructions(self) -> str:
        """Get setup instructions for Google Cloud configuration."""
        return """
Google Cloud Setup Instructions:

1. Create a Google Cloud Project:
   - Go to https://console.cloud.google.com/
   - Create a new project or select an existing one
   - Note your Project ID

2. Enable Required APIs:
   - Cloud Speech-to-Text API
   - Cloud Translation API

3. Create Service Account:
   - Go to IAM & Admin > Service Accounts
   - Create a new service account
   - Assign roles: Cloud Speech Client, Cloud Translation API User

4. Download Service Account Key:
   - Click on your service account
   - Go to Keys tab > Add Key > Create new key
   - Choose JSON format and download

5. Set Environment Variables:
   - GOOGLE_CLOUD_PROJECT=your-project-id
   - GOOGLE_APPLICATION_CREDENTIALS=/path/to/your/service-account-key.json

6. Verify Configuration:
   - Run: python -c "from app.services.google_config import google_config; print(google_config.get_config_status())"

For detailed instructions, see: GOOGLE_CLOUD_SETUP.md
"""

# Global configuration instance
google_config = GoogleCloudConfig()