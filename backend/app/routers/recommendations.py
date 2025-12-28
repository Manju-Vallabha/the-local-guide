from fastapi import APIRouter, HTTPException, Query, Path
from typing import Optional, List
import logging

from app.models.recommendations import (
    RecommendationItem,
    RecommendationResponse,
    RecommendationSearchParams,
    RecommendationStats,
    RecommendationCategory,
    RecommendationError,
    CATEGORY_LABELS,
    CATEGORY_DESCRIPTIONS
)
from app.services.recommendation_service import recommendation_service

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/api/recommendations",
    tags=["recommendations"],
    responses={
        404: {"description": "Not found"},
        422: {"description": "Validation error"},
        500: {"description": "Internal server error"}
    }
)

@router.get("/", response_model=RecommendationResponse)
async def get_all_recommendations(
    limit: int = Query(10, ge=1, le=100, description="Maximum number of results"),
    offset: int = Query(0, ge=0, description="Pagination offset")
):
    """Get all recommendations across all categories"""
    try:
        # Use search with no filters to get all recommendations
        params = RecommendationSearchParams(
            limit=limit,
            offset=offset
        )
        return await recommendation_service.search_recommendations(params)
    except Exception as e:
        logger.error(f"Error getting all recommendations: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to retrieve recommendations")

@router.get("/categories", response_model=List[dict])
async def get_categories():
    """Get all available recommendation categories with descriptions"""
    try:
        categories = await recommendation_service.get_categories()
        return [
            {
                "value": category.value,
                "label": CATEGORY_LABELS.get(category, category.value.replace('_', ' ').title()),
                "description": CATEGORY_DESCRIPTIONS.get(category, "")
            }
            for category in categories
        ]
    except Exception as e:
        logger.error(f"Error getting categories: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to retrieve categories")

@router.get("/stats", response_model=RecommendationStats)
async def get_recommendation_stats():
    """Get statistics about recommendations"""
    try:
        return await recommendation_service.get_stats()
    except Exception as e:
        logger.error(f"Error getting recommendation stats: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to retrieve statistics")

@router.get("/search", response_model=RecommendationResponse)
async def search_recommendations(
    query: Optional[str] = Query(None, max_length=200, description="Search query"),
    category: Optional[str] = Query(None, description="Category filter"),
    location: Optional[str] = Query(None, max_length=100, description="Location filter"),
    min_rating: Optional[float] = Query(None, ge=0.0, le=5.0, description="Minimum rating filter"),
    limit: int = Query(10, ge=1, le=100, description="Maximum number of results"),
    offset: int = Query(0, ge=0, description="Pagination offset")
):
    """Search recommendations based on various criteria"""
    try:
        params = RecommendationSearchParams(
            query=query,
            category=category,
            location=location,
            min_rating=min_rating,
            limit=limit,
            offset=offset
        )
        return await recommendation_service.search_recommendations(params)
    except ValueError as e:
        logger.warning(f"Invalid search parameters: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error searching recommendations: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to search recommendations")

@router.get("/{category}", response_model=RecommendationResponse)
async def get_recommendations_by_category(
    category: str = Path(..., description="Category of recommendations to retrieve"),
    limit: int = Query(10, ge=1, le=100, description="Maximum number of results"),
    offset: int = Query(0, ge=0, description="Pagination offset")
):
    """Get recommendations filtered by category"""
    try:
        return await recommendation_service.get_recommendations_by_category(
            category=category,
            limit=limit,
            offset=offset
        )
    except ValueError as e:
        logger.warning(f"Invalid category requested: {category}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error getting recommendations for category {category}: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to retrieve recommendations")

@router.get("/item/{item_id}", response_model=RecommendationItem)
async def get_recommendation_by_id(
    item_id: str = Path(..., description="Unique identifier of the recommendation")
):
    """Get a specific recommendation by ID"""
    try:
        item = await recommendation_service.get_recommendation_by_id(item_id)
        if not item:
            raise HTTPException(status_code=404, detail=f"Recommendation with ID '{item_id}' not found")
        return item
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting recommendation by ID {item_id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to retrieve recommendation")

@router.get("/validate", response_model=dict)
async def validate_recommendation_data():
    """Validate all recommendation data (admin endpoint)"""
    try:
        errors = await recommendation_service.validate_data()
        return {
            "valid": len(errors) == 0,
            "error_count": len(errors),
            "errors": errors
        }
    except Exception as e:
        logger.error(f"Error validating recommendation data: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to validate data")