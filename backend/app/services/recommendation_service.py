import json
import os
from typing import List, Optional, Dict, Any
from datetime import datetime
import asyncio
from pathlib import Path

from app.models.recommendations import (
    RecommendationItem, 
    RecommendationCategory, 
    RecommendationSearchParams,
    RecommendationResponse,
    CategoryStats,
    RecommendationStats,
    RecommendationError
)

class RecommendationService:
    """Service for managing recommendation data and business logic"""
    
    def __init__(self):
        self._data: Dict[str, List[Dict[str, Any]]] = {}
        self._loaded = False
        self._data_file_path = Path(__file__).parent.parent / "data" / "varanasi_recommendations.json"
        
    async def _load_data(self) -> None:
        """Load recommendation data from JSON file"""
        if self._loaded:
            return
            
        try:
            if not self._data_file_path.exists():
                raise FileNotFoundError(f"Recommendations data file not found: {self._data_file_path}")
                
            with open(self._data_file_path, 'r', encoding='utf-8') as f:
                self._data = json.load(f)
            self._loaded = True
        except Exception as e:
            raise Exception(f"Failed to load recommendations data: {str(e)}")
    
    async def get_all_recommendations(self) -> List[RecommendationItem]:
        """Get all recommendations across all categories"""
        await self._load_data()
        
        all_items = []
        for category_items in self._data.values():
            for item_data in category_items:
                try:
                    item = RecommendationItem(**item_data)
                    all_items.append(item)
                except Exception as e:
                    # Log validation error but continue processing
                    print(f"Warning: Invalid recommendation item: {e}")
                    continue
        
        return all_items
    
    async def get_recommendations_by_category(
        self, 
        category: str, 
        limit: int = 10, 
        offset: int = 0
    ) -> RecommendationResponse:
        """Get recommendations filtered by category"""
        await self._load_data()
        
        # Validate category
        try:
            category_enum = RecommendationCategory(category)
        except ValueError:
            raise ValueError(f"Invalid category: {category}")
        
        # Get items for the category
        category_data = self._data.get(category, [])
        
        # Convert to RecommendationItem objects
        items = []
        for item_data in category_data:
            try:
                item = RecommendationItem(**item_data)
                items.append(item)
            except Exception as e:
                print(f"Warning: Invalid recommendation item: {e}")
                continue
        
        # Apply pagination
        total = len(items)
        paginated_items = items[offset:offset + limit]
        
        # Calculate pagination info
        page = (offset // limit) + 1
        has_next = offset + limit < total
        
        return RecommendationResponse(
            items=paginated_items,
            total=total,
            category=category,
            query=None,
            page=page,
            page_size=limit,
            has_next=has_next
        )
    
    async def search_recommendations(
        self, 
        params: RecommendationSearchParams
    ) -> RecommendationResponse:
        """Search recommendations based on various criteria"""
        await self._load_data()
        
        all_items = await self.get_all_recommendations()
        filtered_items = all_items
        
        # Apply category filter
        if params.category:
            try:
                category_enum = RecommendationCategory(params.category)
                filtered_items = [item for item in filtered_items if item.category == category_enum]
            except ValueError:
                raise ValueError(f"Invalid category: {params.category}")
        
        # Apply text search
        if params.query:
            query_lower = params.query.lower()
            filtered_items = [
                item for item in filtered_items
                if (query_lower in item.name.lower() or 
                    query_lower in item.description.lower() or
                    query_lower in item.cultural_insight.lower() or
                    any(query_lower in tag.lower() for tag in item.tags))
            ]
        
        # Apply location filter
        if params.location:
            location_lower = params.location.lower()
            filtered_items = [
                item for item in filtered_items
                if location_lower in item.location.lower()
            ]
        
        # Apply rating filter
        if params.min_rating is not None:
            filtered_items = [
                item for item in filtered_items
                if item.rating is not None and item.rating >= params.min_rating
            ]
        
        # Sort by rating (highest first), then by name
        filtered_items.sort(key=lambda x: (-x.rating if x.rating else 0, x.name))
        
        # Apply pagination
        total = len(filtered_items)
        paginated_items = filtered_items[params.offset:params.offset + params.limit]
        
        # Calculate pagination info
        page = (params.offset // params.limit) + 1
        has_next = params.offset + params.limit < total
        
        return RecommendationResponse(
            items=paginated_items,
            total=total,
            category=params.category,
            query=params.query,
            page=page,
            page_size=params.limit,
            has_next=has_next
        )
    
    async def get_recommendation_by_id(self, item_id: str) -> Optional[RecommendationItem]:
        """Get a specific recommendation by ID"""
        await self._load_data()
        
        for category_items in self._data.values():
            for item_data in category_items:
                if item_data.get('id') == item_id:
                    try:
                        return RecommendationItem(**item_data)
                    except Exception as e:
                        print(f"Warning: Invalid recommendation item: {e}")
                        return None
        
        return None
    
    async def get_categories(self) -> List[RecommendationCategory]:
        """Get all available categories"""
        await self._load_data()
        return [RecommendationCategory(cat) for cat in self._data.keys()]
    
    async def get_stats(self) -> RecommendationStats:
        """Get statistics about recommendations"""
        await self._load_data()
        
        category_stats = []
        total_items = 0
        
        for category_key, items in self._data.items():
            try:
                category = RecommendationCategory(category_key)
                count = len(items)
                total_items += count
                
                # Calculate average rating
                ratings = [item.get('rating') for item in items if item.get('rating') is not None]
                avg_rating = sum(ratings) / len(ratings) if ratings else None
                
                category_stats.append(CategoryStats(
                    category=category,
                    count=count,
                    average_rating=avg_rating
                ))
            except ValueError:
                continue
        
        return RecommendationStats(
            total_items=total_items,
            categories=category_stats,
            last_updated=datetime.now().isoformat()
        )
    
    async def validate_data(self) -> List[str]:
        """Validate all recommendation data and return list of errors"""
        await self._load_data()
        
        errors = []
        
        for category_key, items in self._data.items():
            # Validate category
            try:
                RecommendationCategory(category_key)
            except ValueError:
                errors.append(f"Invalid category: {category_key}")
                continue
            
            # Validate each item
            for i, item_data in enumerate(items):
                try:
                    RecommendationItem(**item_data)
                except Exception as e:
                    errors.append(f"Invalid item in {category_key}[{i}]: {str(e)}")
        
        return errors

# Global service instance
recommendation_service = RecommendationService()