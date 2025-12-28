import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  retryCount: number;
}

class ErrorBoundary extends Component<Props, State> {
  private maxRetries = 3;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    this.setState({
      error,
      errorInfo,
    });

    // Call the optional error handler
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Log to external service in production
    if (import.meta.env.PROD) {
      // Here you would typically send to an error reporting service
      // like Sentry, LogRocket, etc.
      console.error('Production error:', {
        error: error.toString(),
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href,
      });
    }
  }

  handleRetry = () => {
    if (this.state.retryCount < this.maxRetries) {
      this.setState(prevState => ({
        hasError: false,
        error: null,
        errorInfo: null,
        retryCount: prevState.retryCount + 1,
      }));
    }
  };

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const canRetry = this.state.retryCount < this.maxRetries;
      const isNetworkError = this.state.error?.message.includes('fetch') || 
                            this.state.error?.message.includes('network') ||
                            this.state.error?.message.includes('NetworkError');

      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '400px',
          padding: '2rem',
          textAlign: 'center',
          background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
          borderRadius: '1rem',
          border: '2px solid #dee2e6',
          margin: '1rem',
        }}>
          <div style={{
            background: 'linear-gradient(135deg, #dc3545 0%, #c82333 100%)',
            borderRadius: '50%',
            padding: '1.5rem',
            marginBottom: '1.5rem',
            boxShadow: '0 4px 15px rgba(220, 53, 69, 0.3)',
          }}>
            <AlertTriangle size={48} color="white" />
          </div>

          <h2 style={{
            fontSize: '1.5rem',
            fontWeight: 'bold',
            color: '#495057',
            marginBottom: '1rem',
          }}>
            Something went wrong
          </h2>

          <p style={{
            fontSize: '1rem',
            color: '#6c757d',
            marginBottom: '1.5rem',
            maxWidth: '500px',
            lineHeight: '1.5',
          }}>
            {isNetworkError 
              ? 'There seems to be a network issue. Please check your connection and try again.'
              : 'An unexpected error occurred. Our team has been notified and is working on a fix.'
            }
          </p>

          {import.meta.env.DEV && this.state.error && (
            <details style={{
              marginBottom: '1.5rem',
              padding: '1rem',
              background: '#f8f9fa',
              border: '1px solid #dee2e6',
              borderRadius: '0.5rem',
              textAlign: 'left',
              maxWidth: '600px',
              width: '100%',
            }}>
              <summary style={{
                cursor: 'pointer',
                fontWeight: 'bold',
                marginBottom: '0.5rem',
                color: '#495057',
              }}>
                Error Details (Development)
              </summary>
              <pre style={{
                fontSize: '0.8rem',
                color: '#dc3545',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                margin: 0,
              }}>
                {this.state.error.toString()}
                {this.state.error.stack && (
                  <>
                    {'\n\nStack Trace:\n'}
                    {this.state.error.stack}
                  </>
                )}
                {this.state.errorInfo?.componentStack && (
                  <>
                    {'\n\nComponent Stack:\n'}
                    {this.state.errorInfo.componentStack}
                  </>
                )}
              </pre>
            </details>
          )}

          <div style={{
            display: 'flex',
            gap: '1rem',
            flexWrap: 'wrap',
            justifyContent: 'center',
          }}>
            {canRetry && (
              <button
                onClick={this.handleRetry}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.75rem 1.5rem',
                  backgroundColor: '#007bff',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.5rem',
                  cursor: 'pointer',
                  fontSize: '1rem',
                  fontWeight: '500',
                  transition: 'all 0.2s ease',
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.backgroundColor = '#0056b3';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.backgroundColor = '#007bff';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <RefreshCw size={16} />
                Try Again ({this.maxRetries - this.state.retryCount} left)
              </button>
            )}

            <button
              onClick={this.handleReload}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.75rem 1.5rem',
                backgroundColor: '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '0.5rem',
                cursor: 'pointer',
                fontSize: '1rem',
                fontWeight: '500',
                transition: 'all 0.2s ease',
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = '#1e7e34';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = '#28a745';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <RefreshCw size={16} />
              Reload Page
            </button>

            <button
              onClick={this.handleGoHome}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.75rem 1.5rem',
                backgroundColor: '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: '0.5rem',
                cursor: 'pointer',
                fontSize: '1rem',
                fontWeight: '500',
                transition: 'all 0.2s ease',
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = '#545b62';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = '#6c757d';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <Home size={16} />
              Go Home
            </button>
          </div>

          {!canRetry && (
            <p style={{
              fontSize: '0.9rem',
              color: '#dc3545',
              marginTop: '1rem',
              fontStyle: 'italic',
            }}>
              Maximum retry attempts reached. Please reload the page or contact support.
            </p>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;