import type { ApiError } from '../hooks/useErrorHandler';

export interface UserFriendlyError {
  title: string;
  message: string;
  action?: string;
  severity: 'error' | 'warning' | 'info';
}

export const getUserFriendlyError = (error: ApiError | Error | any): UserFriendlyError => {
  // Handle ApiError objects
  if (error && typeof error === 'object' && 'timestamp' in error) {
    const apiError = error as ApiError;
    
    // Network errors
    if (apiError.message.includes('fetch') || 
        apiError.message.includes('network') ||
        apiError.message.includes('NetworkError')) {
      return {
        title: 'Connection Problem',
        message: 'Unable to connect to the server. Please check your internet connection.',
        action: 'Try again when your connection is restored.',
        severity: 'warning',
      };
    }

    // HTTP status code specific errors
    if (apiError.status) {
      switch (apiError.status) {
        case 400:
          return {
            title: 'Invalid Request',
            message: 'The request contains invalid data. Please check your input and try again.',
            action: 'Verify your input and retry.',
            severity: 'error',
          };
        
        case 401:
          return {
            title: 'Authentication Required',
            message: 'You need to sign in to access this feature.',
            action: 'Please sign in and try again.',
            severity: 'warning',
          };
        
        case 403:
          return {
            title: 'Access Denied',
            message: 'You don\'t have permission to perform this action.',
            action: 'Contact support if you believe this is an error.',
            severity: 'error',
          };
        
        case 404:
          return {
            title: 'Not Found',
            message: 'The requested resource could not be found.',
            action: 'Please check the URL or try again later.',
            severity: 'warning',
          };
        
        case 408:
          return {
            title: 'Request Timeout',
            message: 'The request took too long to complete.',
            action: 'Please try again.',
            severity: 'warning',
          };
        
        case 429:
          return {
            title: 'Too Many Requests',
            message: 'You\'re making requests too quickly. Please slow down.',
            action: 'Wait a moment and try again.',
            severity: 'warning',
          };
        
        case 500:
          return {
            title: 'Server Error',
            message: 'Something went wrong on our end. We\'re working to fix it.',
            action: 'Please try again in a few minutes.',
            severity: 'error',
          };
        
        case 502:
          return {
            title: 'Service Unavailable',
            message: 'The service is temporarily unavailable.',
            action: 'Please try again in a few minutes.',
            severity: 'warning',
          };
        
        case 503:
          return {
            title: 'Service Unavailable',
            message: 'The service is currently under maintenance.',
            action: 'Please try again later.',
            severity: 'warning',
          };
        
        default:
          if (apiError.status >= 500) {
            return {
              title: 'Server Error',
              message: 'A server error occurred. Our team has been notified.',
              action: 'Please try again later.',
              severity: 'error',
            };
          } else if (apiError.status >= 400) {
            return {
              title: 'Request Error',
              message: apiError.message || 'There was a problem with your request.',
              action: 'Please check your input and try again.',
              severity: 'error',
            };
          }
      }
    }

    // Google API specific errors
    if (apiError.code) {
      switch (apiError.code) {
        case 'PERMISSION_DENIED':
          return {
            title: 'Microphone Access Denied',
            message: 'Voice input requires microphone access.',
            action: 'Please allow microphone access and try again.',
            severity: 'warning',
          };
        
        case 'NOT_SUPPORTED':
          return {
            title: 'Feature Not Supported',
            message: 'This feature is not supported in your browser.',
            action: 'Try using a different browser or device.',
            severity: 'error',
          };
        
        case 'QUOTA_EXCEEDED':
          return {
            title: 'Service Limit Reached',
            message: 'The daily usage limit has been reached.',
            action: 'Please try again tomorrow.',
            severity: 'warning',
          };
        
        case 'INVALID_LANGUAGE':
          return {
            title: 'Language Not Supported',
            message: 'The selected language is not supported for this feature.',
            action: 'Please select a different language.',
            severity: 'warning',
          };
      }
    }

    // Generic API error
    return {
      title: 'Something Went Wrong',
      message: apiError.message || 'An unexpected error occurred.',
      action: 'Please try again.',
      severity: 'error',
    };
  }

  // Handle regular Error objects
  if (error instanceof Error) {
    // Translation specific errors
    if (error.message.includes('translation')) {
      return {
        title: 'Translation Error',
        message: 'Unable to translate the text. Please try again.',
        action: 'Check your input and try again.',
        severity: 'warning',
      };
    }

    // Speech recognition errors
    if (error.message.includes('speech') || error.message.includes('audio')) {
      return {
        title: 'Voice Input Error',
        message: 'Unable to process voice input. Please try again.',
        action: 'Make sure your microphone is working and try again.',
        severity: 'warning',
      };
    }

    // Cache errors
    if (error.message.includes('cache') || error.message.includes('storage')) {
      return {
        title: 'Storage Error',
        message: 'Unable to save data locally. Some features may not work offline.',
        action: 'Clear your browser cache and try again.',
        severity: 'info',
      };
    }

    return {
      title: 'Error',
      message: error.message,
      action: 'Please try again.',
      severity: 'error',
    };
  }

  // Handle string errors
  if (typeof error === 'string') {
    return {
      title: 'Error',
      message: error,
      action: 'Please try again.',
      severity: 'error',
    };
  }

  // Fallback for unknown error types
  return {
    title: 'Unknown Error',
    message: 'An unexpected error occurred.',
    action: 'Please refresh the page and try again.',
    severity: 'error',
  };
};

export const logError = (error: any, context?: string) => {
  const timestamp = new Date().toISOString();
  const errorInfo = {
    timestamp,
    context,
    error: error instanceof Error ? {
      name: error.name,
      message: error.message,
      stack: error.stack,
    } : error,
    userAgent: navigator.userAgent,
    url: window.location.href,
    online: navigator.onLine,
  };

  console.error('Error logged:', errorInfo);

  // In production, send to error reporting service
  if (import.meta.env.PROD) {
    // Example: Send to Sentry, LogRocket, etc.
    // errorReportingService.captureException(error, { extra: errorInfo });
  }

  return errorInfo;
};

export const isRetryableError = (error: any): boolean => {
  if (error && typeof error === 'object') {
    // Network errors are retryable
    if (error.message?.includes('fetch') || 
        error.message?.includes('network') ||
        error.message?.includes('NetworkError')) {
      return true;
    }

    // HTTP status codes that are retryable
    if (error.status) {
      return error.status >= 500 || // Server errors
             error.status === 408 || // Request timeout
             error.status === 429;   // Too many requests
    }

    // Google API specific retryable errors
    if (error.code) {
      return error.code === 'QUOTA_EXCEEDED' ||
             error.code === 'RATE_LIMIT_EXCEEDED' ||
             error.code === 'INTERNAL_ERROR';
    }
  }

  return false;
};

export const shouldShowErrorToUser = (error: any): boolean => {
  // Don't show certain technical errors to users
  if (error && typeof error === 'object') {
    // Hide development/debugging errors
    if (error.message?.includes('React') ||
        error.message?.includes('hydration') ||
        error.message?.includes('chunk')) {
      return false;
    }

    // Hide certain HTTP errors that are handled elsewhere
    if (error.status === 401 || error.status === 403) {
      return false; // These should trigger auth flows
    }
  }

  return true;
};