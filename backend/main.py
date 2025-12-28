"""
Main entry point for The Local Guide API.
This file serves as the primary FastAPI application.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os
import logging
from dotenv import load_dotenv
from app.routers import health, translation, recommendations, preferences

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI(
    title="The Local Guide API",
    description="API for local slang translation and recommendations in Varanasi",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Configure CORS for local development
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",  # Vite dev server (default)
        "http://localhost:5174",  # Vite dev server (alternate port)
        "http://localhost:3000",  # React dev server
        "http://127.0.0.1:5173",  # Alternative localhost
        "http://127.0.0.1:3000",  # Alternative localhost
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["X-Session-ID"]
)

# Include routers
app.include_router(health.router)
app.include_router(translation.router)
app.include_router(recommendations.router)
app.include_router(preferences.router)

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "The Local Guide API is running",
        "version": "1.0.0",
        "environment": os.getenv("DEBUG", "True"),
        "docs": "/docs",
        "status": "healthy"
    }

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "local-guide-api",
        "version": "1.0.0",
        "environment": "local"
    }

if __name__ == "__main__":
    import uvicorn
    
    # Get configuration from environment
    host = os.getenv("API_HOST", "0.0.0.0")
    port = int(os.getenv("API_PORT", "8000"))
    debug = os.getenv("DEBUG", "True").lower() == "true"
    
    logger.info(f"Starting The Local Guide API on {host}:{port}")
    logger.info(f"Debug mode: {debug}")
    logger.info(f"API docs available at: http://{host}:{port}/docs")
    
    uvicorn.run(
        app, 
        host=host, 
        port=port,
        reload=debug,
        log_level="info" if debug else "warning"
    )