import React, { useState, useCallback } from 'react';
import { Box } from '@mui/material';
import RecommendationEngine from './RecommendationEngine';
import RecommendationGrid from './RecommendationGrid';
import type { RecommendationItem, RecommendationCategory } from '../types/recommendations';

interface RecommendationDisplayProps {
  initialCategory?: RecommendationCategory | 'all';
  location?: string;
}

const RecommendationDisplay: React.FC<RecommendationDisplayProps> = ({
  initialCategory = 'all',
  location,
}) => {
  const [recommendations, setRecommendations] = useState<RecommendationItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleRecommendations = useCallback((items: RecommendationItem[]) => {
    // Ensure items is always an array
    const safeItems = Array.isArray(items) ? items : [];
    setRecommendations(safeItems);
    setIsLoading(false);
  }, []);



  return (
    <Box>
      <RecommendationEngine
        category={initialCategory}
        location={location}
        onRecommendations={handleRecommendations}
      />
      
      <Box sx={{ mt: 4 }}>
        <RecommendationGrid
          items={recommendations}
          loading={isLoading}
        />
      </Box>
    </Box>
  );
};

export default RecommendationDisplay;