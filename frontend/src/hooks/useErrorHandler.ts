import { useState, useCallback } from 'react';

export interface ApiError {
  message: string;
  status?: number;
  code?: string;
  details?: any;
  timestamp: Date;
}

export interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  backoffFactor: number;
}

export interface ErrorHandlerState {
  error: ApiError | null;
  isRetrying: boolean;
  retryCount: number;
  canRetry: boolean;
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 10000,
  backoffFactor: 2,
};

export const useErrorHandler = (retryConfig: Partial<RetryConfig> = {}) => {
  const config = { ...DEFAULT_RETRY_CONFIG, ...retryConfig };
  
  const [state, setState] = useState<ErrorHandlerState>({
    error: null,
    isRetrying: false,
    retryCount: 0,
    canRetry: true,
  });

  const createApiError = useCallback((error: any): ApiError => {
    if (error instanceof Error) {
      return {
        message: error.message,
        timestamp: new Date(),
      };
    }

    if (typeof error === 'object' && error !== null) {
      return {
        message: error.message || 'An unknown error occurred',
        status: error.status || error.statusCode,
        code: error.code,
        details: error.details || error.data,
        timestamp: new Date(),
      };
    }

    return {
      message: String(error) || 'An unknown error occurred',
      timestamp: new Date(),
    };
  }, []);

  const isRetryableError = useCallback((error: ApiError): boolean => {
    // Network errors are retryable
    if (error.message.includes('fetch') || 
        error.message.includes('network') ||
        error.message.includes('NetworkError')) {
      return true;
    }

    // HTTP status codes that are retryable
    if (error.status) {
      return error.status >= 500 || // Server errors
             error.status === 408 || // Request timeout
             error.status === 429;   // Too many requests
    }

    return false;
  }, []);

  const calculateDelay = useCallback((retryCount: number): number => {
    const delay = config.baseDelay * Math.pow(config.backoffFactor, retryCount);
    return Math.min(delay, config.maxDelay);
  }, [config]);

  const handleError = useCallback((error: any) => {
    const apiError = createApiError(error);
    const canRetry = isRetryableError(apiError) && state.retryCount < config.maxRetries;

    setState(prevState => ({
      error: apiError,
      isRetrying: false,
      retryCount: prevState.retryCount,
      canRetry,
    }));

    // Log error for debugging
    console.error('API Error:', {
      message: apiError.message,
      status: apiError.status,
      code: apiError.code,
      timestamp: apiError.timestamp,
      retryCount: state.retryCount,
      canRetry,
    });

    return apiError;
  }, [createApiError, isRetryableError, state.retryCount, config.maxRetries]);

  const retry = useCallback(async <T>(
    operation: () => Promise<T>
  ): Promise<T> => {
    if (!state.canRetry) {
      throw state.error || new Error('Cannot retry operation');
    }

    setState(prevState => ({
      ...prevState,
      isRetrying: true,
      retryCount: prevState.retryCount + 1,
    }));

    try {
      const delay = calculateDelay(state.retryCount);
      
      // Add jitter to prevent thundering herd
      const jitter = Math.random() * 0.1 * delay;
      await new Promise(resolve => setTimeout(resolve, delay + jitter));

      const result = await operation();
      
      // Success - reset error state
      setState({
        error: null,
        isRetrying: false,
        retryCount: 0,
        canRetry: true,
      });

      return result;
    } catch (error) {
      const apiError = handleError(error);
      setState(prevState => ({
        error: apiError,
        isRetrying: false,
        retryCount: prevState.retryCount,
        canRetry: isRetryableError(apiError) && prevState.retryCount < config.maxRetries,
      }));
      throw apiError;
    }
  }, [state, calculateDelay, handleError, isRetryableError, config.maxRetries]);

  const executeWithRetry = useCallback(async <T>(
    operation: () => Promise<T>
  ): Promise<T> => {
    try {
      const result = await operation();
      
      // Success - reset error state
      setState({
        error: null,
        isRetrying: false,
        retryCount: 0,
        canRetry: true,
      });

      return result;
    } catch (error) {
      const apiError = handleError(error);
      
      // If retryable, attempt retry
      if (isRetryableError(apiError) && state.retryCount < config.maxRetries) {
        return retry(operation);
      }
      
      throw apiError;
    }
  }, [handleError, isRetryableError, retry, state.retryCount, config.maxRetries]);

  const clearError = useCallback(() => {
    setState({
      error: null,
      isRetrying: false,
      retryCount: 0,
      canRetry: true,
    });
  }, []);

  const reset = useCallback(() => {
    setState({
      error: null,
      isRetrying: false,
      retryCount: 0,
      canRetry: true,
    });
  }, []);

  return {
    ...state,
    handleError,
    retry,
    executeWithRetry,
    clearError,
    reset,
    isNetworkError: state.error?.message.includes('fetch') || 
                   state.error?.message.includes('network') ||
                   state.error?.message.includes('NetworkError'),
    isServerError: state.error?.status ? state.error.status >= 500 : false,
    isClientError: state.error?.status ? state.error.status >= 400 && state.error.status < 500 : false,
  };
};