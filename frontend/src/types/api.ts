// API-related types and interfaces

export interface ApiResponse<T = any> {
  data: T;
  success: boolean;
  message?: string;
  timestamp: string;
}

export interface ApiError {
  message: string;
  code: string;
  details?: Record<string, any>;
  timestamp: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export interface HealthCheckResponse {
  status: 'healthy' | 'unhealthy';
  service: string;
  timestamp: string;
  version?: string;
}

// HTTP Status codes we handle
export const HttpStatus = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503
} as const;

// API endpoint paths
export const API_ENDPOINTS = {
  HEALTH: '/health',
  TRANSLATE: '/api/translate',
  SPEECH_TO_TEXT: '/api/speech-to-text',
  RECOMMENDATIONS: '/api/recommendations',
  PREFERENCES: '/api/preferences'
} as const;