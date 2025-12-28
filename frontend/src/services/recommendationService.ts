import axios from 'axios';
import type { RecommendationItem, RecommendationSearchParams, RecommendationResponse } from '../types/recommendations';
import { API_ENDPOINTS } from '../types/api';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

export const recommendationService = {
  /**
   * Get recommendations by category
   */
  async getRecommendations(params: RecommendationSearchParams): Promise<RecommendationItem[]> {
    const { category = 'all', query, location, limit = 10 } = params;
    
    try {
      let url = `${API_ENDPOINTS.RECOMMENDATIONS}`;
      
      if (category !== 'all') {
        url += `/${category}`;
      }
      
      const response = await api.get<RecommendationResponse>(url, {
        params: {
          ...(query && { query }),
          ...(location && { location }),
          limit,
        },
      });
      
      return response.data.items;
    } catch (error) {
      console.error('Error fetching recommendations:', error);
      throw new Error('Failed to fetch recommendations');
    }
  },

  /**
   * Search recommendations by query
   */
  async searchRecommendations(query: string, category?: string): Promise<RecommendationItem[]> {
    try {
      const response = await api.get<RecommendationResponse>(`${API_ENDPOINTS.RECOMMENDATIONS}/search`, {
        params: {
          query,
          ...(category && { category }),
        },
      });
      
      return response.data.items;
    } catch (error) {
      console.error('Error searching recommendations:', error);
      throw new Error('Failed to search recommendations');
    }
  },
};