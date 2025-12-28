import axios from 'axios';
import type { UserPreferences } from '../types/user';
import { API_ENDPOINTS } from '../types/api';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  withCredentials: true, // Include cookies for session management
});

// Add session ID to requests if available
api.interceptors.request.use((config) => {
  const sessionId = localStorage.getItem('sessionId');
  if (sessionId) {
    config.headers['X-Session-ID'] = sessionId;
  }
  return config;
});

// Handle session ID from responses
api.interceptors.response.use((response) => {
  const sessionId = response.headers['x-session-id'];
  if (sessionId) {
    localStorage.setItem('sessionId', sessionId);
  }
  return response;
});

export interface ApiResponse {
  message: string;
  success: boolean;
}

export interface SessionInfo {
  session_id: string;
  created_at: string;
  last_active: string;
  preferences_set: boolean;
}

export const preferencesService = {
  /**
   * Get user preferences
   */
  async getPreferences(): Promise<UserPreferences> {
    try {
      const response = await api.get<UserPreferences>(`${API_ENDPOINTS.PREFERENCES}`);
      
      // Store preferences in localStorage for offline access
      localStorage.setItem('userPreferences', JSON.stringify(response.data));
      
      return response.data;
    } catch (error) {
      console.error('Error fetching preferences:', error);
      
      // Fallback to localStorage if API fails
      const cachedPrefs = localStorage.getItem('userPreferences');
      if (cachedPrefs) {
        return JSON.parse(cachedPrefs);
      }
      
      throw new Error('Failed to fetch preferences');
    }
  },

  /**
   * Save user preferences
   */
  async savePreferences(preferences: UserPreferences): Promise<ApiResponse> {
    try {
      const response = await api.post<ApiResponse>(`${API_ENDPOINTS.PREFERENCES}`, preferences);
      
      // Update localStorage cache
      localStorage.setItem('userPreferences', JSON.stringify(preferences));
      
      return response.data;
    } catch (error) {
      console.error('Error saving preferences:', error);
      throw new Error('Failed to save preferences');
    }
  },

  /**
   * Update specific preference fields
   */
  async updatePreferences(updates: Partial<UserPreferences>): Promise<ApiResponse> {
    try {
      const response = await api.patch<ApiResponse>(`${API_ENDPOINTS.PREFERENCES}`, updates);
      
      // Update localStorage cache
      const cachedPrefs = localStorage.getItem('userPreferences');
      if (cachedPrefs) {
        const currentPrefs = JSON.parse(cachedPrefs);
        const updatedPrefs = { ...currentPrefs, ...updates };
        localStorage.setItem('userPreferences', JSON.stringify(updatedPrefs));
      }
      
      return response.data;
    } catch (error) {
      console.error('Error updating preferences:', error);
      throw new Error('Failed to update preferences');
    }
  },

  /**
   * Reset preferences to default
   */
  async resetPreferences(): Promise<ApiResponse> {
    try {
      const response = await api.delete<ApiResponse>(`${API_ENDPOINTS.PREFERENCES}`);
      
      // Clear localStorage cache
      localStorage.removeItem('userPreferences');
      
      return response.data;
    } catch (error) {
      console.error('Error resetting preferences:', error);
      throw new Error('Failed to reset preferences');
    }
  },

  /**
   * Get session information
   */
  async getSessionInfo(): Promise<SessionInfo> {
    try {
      const response = await api.get<SessionInfo>(`${API_ENDPOINTS.PREFERENCES}/session`);
      return response.data;
    } catch (error) {
      console.error('Error fetching session info:', error);
      throw new Error('Failed to fetch session info');
    }
  },

  /**
   * Get preferences from localStorage (offline)
   */
  getCachedPreferences(): UserPreferences | null {
    try {
      const cachedPrefs = localStorage.getItem('userPreferences');
      return cachedPrefs ? JSON.parse(cachedPrefs) : null;
    } catch (error) {
      console.error('Error reading cached preferences:', error);
      return null;
    }
  },

  /**
   * Check if this is a first-time user
   */
  async isFirstTimeUser(): Promise<boolean> {
    try {
      const sessionInfo = await this.getSessionInfo();
      console.log('Session info:', sessionInfo);
      const isFirstTime = !sessionInfo.preferences_set;
      console.log('isFirstTimeUser result:', isFirstTime);
      return isFirstTime;
    } catch (error) {
      console.error('Error getting session info:', error);
      // If we can't get session info, check localStorage
      const cachedPrefs = this.getCachedPreferences();
      const fallbackResult = !cachedPrefs;
      console.log('isFirstTimeUser fallback result:', fallbackResult);
      return fallbackResult;
    }
  },

  /**
   * Reset session (for testing)
   */
  async resetSession(): Promise<void> {
    try {
      // Clear localStorage
      localStorage.removeItem('sessionId');
      localStorage.removeItem('userPreferences');
      
      // Force a new session by removing the session ID header
      delete api.defaults.headers['X-Session-ID'];
      
      console.log('Session reset completed');
    } catch (error) {
      console.error('Error resetting session:', error);
    }
  }
};