from pydantic import BaseModel, Field, validator
from typing import Optional, List, Dict, Any
from enum import Enum

class RecommendationCategory(str, Enum):
    STREET_FOOD = "street_food"
    SHOPS = "shops"
    MARKETS = "markets"
    SOUVENIRS = "souvenirs"
    CLOTHING = "clothing"
    CRAFTS = "crafts"

class RecommendationItem(BaseModel):
    id: str = Field(..., description="Unique identifier for the recommendation")
    name: str = Field(..., min_length=1, max_length=200, description="Name of the place/item")
    category: RecommendationCategory = Field(..., description="Category of the recommendation")
    description: str = Field(..., min_length=10, max_length=1000, description="Detailed description")
    location: str = Field(..., min_length=5, max_length=300, description="Location information")
    cultural_insight: str = Field(..., min_length=10, max_length=500, description="Cultural context and insights")
    image_url: Optional[str] = Field(None, description="URL to image")
    rating: Optional[float] = Field(None, ge=0.0, le=5.0, description="Rating out of 5")
    tags: List[str] = Field(default_factory=list, description="Search tags")
    price_range: Optional[str] = Field(None, description="Price range indicator")
    opening_hours: Optional[str] = Field(None, description="Operating hours")
    contact_info: Optional[str] = Field(None, description="Contact information")
    
    @validator('name', 'description', 'location', 'cultural_insight')
    def validate_text_fields(cls, v):
        if not v or v.isspace():
            raise ValueError('Text fields cannot be empty or only whitespace')
        return v.strip()
    
    @validator('tags')
    def validate_tags(cls, v):
        # Remove empty tags and duplicates
        return list(set(tag.strip().lower() for tag in v if tag and not tag.isspace()))

class RecommendationSearchParams(BaseModel):
    category: Optional[str] = Field(None, description="Category filter")
    query: Optional[str] = Field(None, max_length=200, description="Search query")
    location: Optional[str] = Field(None, max_length=100, description="Location filter")
    limit: int = Field(10, ge=1, le=100, description="Maximum number of results")
    offset: int = Field(0, ge=0, description="Pagination offset")
    min_rating: Optional[float] = Field(None, ge=0.0, le=5.0, description="Minimum rating filter")
    
    @validator('query', 'location')
    def validate_optional_text(cls, v):
        if v is not None:
            v = v.strip()
            if not v:
                return None
        return v

class RecommendationResponse(BaseModel):
    items: List[RecommendationItem] = Field(..., description="List of recommendations")
    total: int = Field(..., ge=0, description="Total number of matching items")
    category: Optional[str] = Field(None, description="Applied category filter")
    query: Optional[str] = Field(None, description="Applied search query")
    page: int = Field(1, ge=1, description="Current page number")
    page_size: int = Field(10, ge=1, description="Items per page")
    has_next: bool = Field(False, description="Whether there are more results")

class CategoryStats(BaseModel):
    category: RecommendationCategory = Field(..., description="Category name")
    count: int = Field(..., ge=0, description="Number of items in category")
    average_rating: Optional[float] = Field(None, ge=0.0, le=5.0, description="Average rating for category")

class RecommendationStats(BaseModel):
    total_items: int = Field(..., ge=0, description="Total number of recommendations")
    categories: List[CategoryStats] = Field(..., description="Statistics by category")
    last_updated: str = Field(..., description="Last update timestamp")

class RecommendationError(BaseModel):
    error_code: str = Field(..., description="Error code")
    message: str = Field(..., description="Human-readable error message")
    category: Optional[str] = Field(None, description="Category that caused the error")
    details: Optional[Dict[str, Any]] = Field(None, description="Additional error details")

# Category display information
CATEGORY_LABELS = {
    RecommendationCategory.STREET_FOOD: "Street Food",
    RecommendationCategory.SHOPS: "Shops",
    RecommendationCategory.MARKETS: "Markets", 
    RecommendationCategory.SOUVENIRS: "Souvenirs",
    RecommendationCategory.CLOTHING: "Clothing",
    RecommendationCategory.CRAFTS: "Local Crafts"
}

CATEGORY_DESCRIPTIONS = {
    RecommendationCategory.STREET_FOOD: "Authentic local street food and traditional dishes",
    RecommendationCategory.SHOPS: "Local shops and retail establishments",
    RecommendationCategory.MARKETS: "Traditional markets and bazaars",
    RecommendationCategory.SOUVENIRS: "Souvenirs and gifts to remember your visit",
    RecommendationCategory.CLOTHING: "Traditional and local clothing stores",
    RecommendationCategory.CRAFTS: "Local handicrafts and artisan products"
}