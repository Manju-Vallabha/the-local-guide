# Firebase Deployment Setup for The Local Guide

## Prerequisites

1. **Firebase CLI installed** ✅ (Already done - version 14.26.0)
2. **Firebase project initialized** ✅ (Already done)
3. **Google Cloud credentials configured** ✅ (Already done)

## Project Structure

```
The Local Guide/
├── frontend/           # React app (deploys to Firebase Hosting)
├── backend/           # FastAPI app (deploys to Firebase Functions)
├── firebase.json      # Firebase configuration
├── deploy.sh         # Linux/Mac deployment script
└── deploy.bat        # Windows deployment script
```

## Deployment Commands

### Option 1: Use deployment script (Recommended)
```bash
# Windows
deploy.bat

# Linux/Mac
./deploy.sh
```

### Option 2: Manual deployment
```bash
# Build frontend
cd frontend
npm run build
cd ..

# Deploy everything
firebase deploy
```

### Option 3: Deploy specific services
```bash
# Deploy only hosting (frontend)
firebase deploy --only hosting

# Deploy only functions (backend)
firebase deploy --only functions

# Deploy specific function
firebase deploy --only functions:api
```

## Configuration Details

### Firebase Hosting
- **Source**: `frontend/dist` (built React app)
- **Rewrites**: `/api/**` routes to Cloud Function
- **CORS**: Configured for API access

### Firebase Functions
- **Source**: `backend/` (FastAPI app)
- **Runtime**: Python 3.11
- **Entry point**: `main.py` → `api` function
- **Environment**: Google Cloud credentials auto-configured

## Environment Variables

The backend uses these environment variables (already configured):
- `GOOGLE_APPLICATION_CREDENTIALS`: Path to service account key
- `GOOGLE_CLOUD_PROJECT`: Your Firebase project ID

## URLs After Deployment

- **Frontend**: `https://the-local-guide-482605.web.app`
- **API**: `https://the-local-guide-482605.web.app/api/`

## Troubleshooting

### Common Issues

1. **Build fails**: Check Node.js version and run `npm install` in frontend
2. **Function deployment fails**: Check Python dependencies in `backend/requirements.txt`
3. **API not accessible**: Check CORS configuration in `firebase.json`

### Logs and Debugging

```bash
# View function logs
firebase functions:log

# View hosting logs
firebase hosting:channel:list

# Local testing
firebase emulators:start
```

## Next Steps

1. Run deployment: `deploy.bat` (Windows) or `./deploy.sh` (Linux/Mac)
2. Test the deployed app at your Firebase hosting URL
3. Monitor function performance in Firebase Console