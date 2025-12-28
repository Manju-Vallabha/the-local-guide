#!/bin/bash

# The Local Guide - Firebase Deployment Script

echo "🚀 Starting Firebase deployment for The Local Guide..."

# Build frontend
echo "📦 Building frontend..."
cd frontend
npm run build
if [ $? -ne 0 ]; then
    echo "❌ Frontend build failed!"
    exit 1
fi
cd ..

# Deploy to Firebase
echo "🔥 Deploying to Firebase..."
firebase deploy

if [ $? -eq 0 ]; then
    echo "✅ Deployment successful!"
    echo "🌐 Your app should be available at: https://the-local-guide-482605.web.app"
else
    echo "❌ Deployment failed!"
    exit 1
fi