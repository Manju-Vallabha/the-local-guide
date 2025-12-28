# Google Cloud Setup Guide

This guide will help you set up Google Cloud services required for The Local Guide application.

## Prerequisites

- Google Cloud account
- Google Cloud CLI installed (optional but recommended)

## Step 1: Create a Google Cloud Project

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Click "Select a project" → "New Project"
3. Enter project name: "the-local-guide" (or your preferred name)
4. Note your Project ID (you'll need this later)

## Step 2: Enable Required APIs

Enable the following APIs in your project:

1. **Cloud Speech-to-Text API**
   - Go to APIs & Services → Library
   - Search for "Cloud Speech-to-Text API"
   - Click "Enable"

2. **Cloud Translation API**
   - Search for "Cloud Translation API"
   - Click "Enable"

3. **Cloud Functions API** (for deployment)
   - Search for "Cloud Functions API"
   - Click "Enable"

## Step 3: Create Service Account

1. Go to IAM & Admin → Service Accounts
2. Click "Create Service Account"
3. Name: "local-guide-service"
4. Description: "Service account for The Local Guide application"
5. Click "Create and Continue"

## Step 4: Assign Roles

Assign the following roles to your service account:
- Cloud Speech Client
- Cloud Translation API User
- Cloud Functions Developer (for deployment)

## Step 5: Create and Download Key

1. Click on your service account
2. Go to "Keys" tab
3. Click "Add Key" → "Create new key"
4. Choose JSON format
5. Download the key file
6. Save it securely (DO NOT commit to version control)

## Step 6: Configure Environment

1. Copy the downloaded JSON key to a secure location
2. Update your `backend/.env` file:
   ```
   GOOGLE_APPLICATION_CREDENTIALS=/path/to/your/service-account-key.json
   GOOGLE_CLOUD_PROJECT=your-project-id
   ```

## Step 7: Test Configuration

Run the backend server and check that it starts without errors:
```bash
cd backend
python main.py
```

## Security Notes

- Never commit service account keys to version control
- Use environment variables for sensitive configuration
- Consider using Google Cloud Secret Manager for production
- Rotate service account keys regularly

## Billing

- Both Speech-to-Text and Translation APIs have free tiers
- Monitor usage in the Google Cloud Console
- Set up billing alerts to avoid unexpected charges

## Troubleshooting

### Authentication Errors
- Verify the service account key path is correct
- Check that the service account has the required roles
- Ensure the APIs are enabled in your project

### Permission Errors
- Verify the service account has the necessary IAM roles
- Check that the project ID is correct in your environment variables

For more detailed information, refer to the official Google Cloud documentation.