import { useEffect, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { IndianApp } from './components';
import ErrorBoundary from './components/ErrorBoundary';
import { dataPreloader } from './services/dataPreloader';
import { cacheManager } from './services/cacheManager';
import { logError } from './utils/errorUtils';

// Create a client for React Query with enhanced caching configuration
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 30 * 60 * 1000, // 30 minutes (formerly cacheTime)
      retry: (failureCount) => {
        // Don't retry if offline
        if (!navigator.onLine) return false;
        // Retry up to 2 times for network errors
        return failureCount < 2;
      },
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
      // Enable background refetching
      refetchOnMount: true,
    },
    mutations: {
      retry: (failureCount) => {
        if (!navigator.onLine) return false;
        return failureCount < 1; // Only retry mutations once
      },
    },
  },
});

function App() {
  const [isPreloading, setIsPreloading] = useState(true);
  const [preloadError, setPreloadError] = useState<string | null>(null);

  useEffect(() => {
    // Initialize cache manager and preload essential data on app startup
    const initializeApp = async () => {
      try {
        console.log('Initializing app with cache management and data preload...');
        
        // Initialize cache manager first
        cacheManager.initialize(queryClient);
        
        const result = await dataPreloader.preloadEssentialData({
          queryClient,
          forceRefresh: false,
        });

        if (!result.success && result.errors.length > 0) {
          console.warn('Some preload tasks failed:', result.errors);
          // Don't block app loading for non-critical failures
          if (result.preloadedItems.length === 0) {
            setPreloadError('Failed to load essential data. Some features may not work offline.');
          }
        }

        console.log('App initialization completed:', {
          success: result.success,
          preloadedItems: result.preloadedItems,
          errors: result.errors,
        });

      } catch (error) {
        console.error('App initialization failed:', error);
        setPreloadError('Failed to initialize app. Please check your connection.');
      } finally {
        setIsPreloading(false);
      }
    };

    initializeApp();

    // Set up online/offline event listeners
    const handleOnline = () => {
      console.log('App came online, refreshing stale queries...');
      queryClient.refetchQueries({
        stale: true,
      });
    };

    const handleOffline = () => {
      console.log('App went offline, using cached data...');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Cleanup event listeners and cache manager on unmount
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      cacheManager.destroy();
    };
  }, []);

  // Show loading screen during preload
  if (isPreloading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        flexDirection: 'column',
        gap: '1rem',
      }}>
        <div>Loading The Local Guide...</div>
        <div style={{ fontSize: '0.8rem', color: '#666' }}>
          Preparing offline features...
        </div>
      </div>
    );
  }

  // Show error if preload completely failed
  if (preloadError) {
    return (
      <QueryClientProvider client={queryClient}>
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          flexDirection: 'column',
          gap: '1rem',
          padding: '2rem',
          textAlign: 'center',
        }}>
          <div style={{ color: '#d32f2f', marginBottom: '1rem' }}>
            {preloadError}
          </div>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#1976d2',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            Retry
          </button>
          <div style={{ fontSize: '0.8rem', color: '#666' }}>
            Or continue with limited functionality:
          </div>
          <button
            onClick={() => setPreloadError(null)}
            style={{
              padding: '0.5rem 1rem',
              backgroundColor: '#666',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            Continue Anyway
          </button>
        </div>
      </QueryClientProvider>
    );
  }

  return (
    <ErrorBoundary
      onError={(error, errorInfo) => {
        logError(error, 'App ErrorBoundary');
        console.error('App-level error:', error, errorInfo);
      }}
    >
      <QueryClientProvider client={queryClient}>
        <IndianApp />
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App
