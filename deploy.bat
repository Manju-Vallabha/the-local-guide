@echo off
REM The Local Guide - Firebase Deployment Script for Windows

echo 🚀 Starting Firebase deployment for The Local Guide...

REM Build frontend
echo 📦 Building frontend...
cd frontend
call npm run build
if %errorlevel% neq 0 (
    echo ❌ Frontend build failed!
    exit /b 1
)
cd ..

REM Deploy to Firebase
echo 🔥 Deploying to Firebase...
call firebase deploy

if %errorlevel% equ 0 (
    echo ✅ Deployment successful!
    echo 🌐 Your app should be available at: https://the-local-guide-482605.web.app
) else (
    echo ❌ Deployment failed!
    exit /b 1
)