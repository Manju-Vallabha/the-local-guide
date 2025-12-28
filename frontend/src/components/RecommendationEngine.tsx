import React, { useState, useCallback, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  InputAdornment,
  Chip,
  Alert,
  CircularProgress,
  Container,
} from '@mui/material';
import { Search as SearchIcon } from '@mui/icons-material';
import { Star } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { recommendationService } from '../services/recommendationService';
import type { 
  RecommendationItem, 
  RecommendationCategory, 
  RecommendationSearchParams 
} from '../types/recommendations';
import { CATEGORY_LABELS, CATEGORY_ICONS, RecommendationCategory as Categories } from '../types/recommendations';

interface RecommendationEngineProps {
  category?: RecommendationCategory | 'all';
  location?: string;
  onRecommendations?: (items: RecommendationItem[]) => void;
}

const RecommendationEngine: React.FC<RecommendationEngineProps> = ({
  category = 'all',
  location,
  onRecommendations,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<RecommendationCategory | 'all'>(category);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Query parameters for recommendations
  const queryParams: RecommendationSearchParams = {
    category: selectedCategory,
    query: debouncedQuery || undefined,
    location,
    limit: 20,
  };

  // Fetch recommendations using React Query
  const {
    data: recommendations = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['recommendations', queryParams],
    queryFn: () => recommendationService.getRecommendations(queryParams),
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
  });

  // Notify parent component of recommendations
  useEffect(() => {
    if (onRecommendations) {
      // Ensure recommendations is always an array
      const safeRecommendations = Array.isArray(recommendations) ? recommendations : [];
      onRecommendations(safeRecommendations);
    }
  }, [recommendations, onRecommendations]);

  const handleCategoryChange = useCallback((newCategory: RecommendationCategory | 'all') => {
    setSelectedCategory(newCategory);
  }, []);

  const handleSearchChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
  }, []);

  const categories: Array<{ 
    key: RecommendationCategory | 'all'; 
    label: string; 
    icon: React.ComponentType<any> | null;
  }> = [
    { key: 'all', label: 'All', icon: Star },
    ...Object.entries(Categories).map(([, value]) => ({
      key: value,
      label: CATEGORY_LABELS[value],
      icon: CATEGORY_ICONS[value],
    })),
  ];

  return (
    <Container maxWidth="lg">
      <Box sx={{ mb: 4 }}>
        {/* Search Bar */}
        <Box sx={{ mb: 3 }}>
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Search for food, shops, or experiences..."
            value={searchQuery}
            onChange={handleSearchChange}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
            sx={{ maxWidth: 600, mx: 'auto', display: 'block' }}
          />
        </Box>

        {/* Category Filters */}
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, justifyContent: 'center', mb: 3 }}>
          {categories.map(({ key, label, icon }) => (
            <Chip
              key={key}
              icon={icon ? React.createElement(icon, { 
                size: 16,
                strokeWidth: 2 
              }) : undefined}
              label={label}
              variant={selectedCategory === key ? 'filled' : 'outlined'}
              color={selectedCategory === key ? 'primary' : 'default'}
              onClick={() => handleCategoryChange(key)}
              sx={{ 
                cursor: 'pointer',
                '&:hover': {
                  backgroundColor: selectedCategory === key ? undefined : 'action.hover',
                },
              }}
            />
          ))}
        </Box>

        {/* Loading State */}
        {isLoading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        )}

        {/* Error State */}
        {error && (
          <Alert 
            severity="error" 
            sx={{ mb: 3 }}
            action={
              <Chip 
                label="Retry" 
                size="small" 
                onClick={() => refetch()}
                sx={{ cursor: 'pointer' }}
              />
            }
          >
            Failed to load recommendations. Please try again.
          </Alert>
        )}

        {/* Results Summary */}
        {!isLoading && !error && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" color="text.secondary" align="center">
              {recommendations.length > 0 
                ? `Found ${recommendations.length} recommendation${recommendations.length === 1 ? '' : 's'}`
                : 'No recommendations found'
              }
              {selectedCategory !== 'all' && ` in ${CATEGORY_LABELS[selectedCategory as RecommendationCategory]}`}
              {searchQuery && ` for "${searchQuery}"`}
            </Typography>
          </Box>
        )}

        {/* No Results Message */}
        {!isLoading && !error && recommendations.length === 0 && (
          <Alert severity="info" sx={{ mt: 2 }}>
            <Typography variant="body2">
              No recommendations found. Try adjusting your search or selecting a different category.
            </Typography>
          </Alert>
        )}
      </Box>
    </Container>
  );
};

export default RecommendationEngine;