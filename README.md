# The Local Guide

A local guide application for tourists visiting Varanasi, featuring slang translation and local recommendations.

## Features

- **Slang Translator**: Convert local Varanasi slang to English, Hindi, or Telugu
- **Voice Input**: Use speech-to-text for real-time translation
- **Street Food Recommendations**: Discover popular local cuisine with cultural insights
- **Shop Guide**: Find local markets, crafts, and souvenirs

## Project Structure

```
├── frontend/          # React + Vite + TypeScript frontend
├── backend/           # FastAPI Python backend
├── .kiro/            # Kiro specification files
└── README.md
```

## Development Setup

### Prerequisites

- Node.js 18+ and npm
- Python 3.9+
- Google Cloud Project with Speech-to-Text and Translation APIs enabled

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

### Backend Setup

```bash
cd backend
pip install -r requirements.txt
cp .env.example .env
# Configure your Google Cloud credentials in .env
python main.py
```

### Google Cloud Setup

1. Create a Google Cloud Project
2. Enable the following APIs:
   - Cloud Speech-to-Text API
   - Cloud Translation API
3. Create a service account and download the JSON key
4. Set the `GOOGLE_APPLICATION_CREDENTIALS` environment variable

## API Documentation

Once the backend is running, visit `http://localhost:8000/docs` for interactive API documentation.

## Testing

### Frontend Tests
```bash
cd frontend
npm run test
```

### Backend Tests
```bash
cd backend
pytest
```

## Deployment

The application is designed to deploy on Google Cloud Functions for the backend and any static hosting service for the frontend.

## License

This project is for educational and demonstration purposes.