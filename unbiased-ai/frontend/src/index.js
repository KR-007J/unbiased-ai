import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from 'react-query';
import { ErrorBoundary } from 'react-error-boundary';
import App from './App';
import { initSentry, initAnalytics, startSession, logErrorBoundary } from './utils/analytics';

// Initialize monitoring and analytics
initSentry();
initAnalytics();
startSession();

// Create React Query client with enterprise settings
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        // Don't retry on 4xx errors
        if (error?.status >= 400 && error?.status < 500) {
          return false;
        }
        // Retry up to 3 times for other errors
        return failureCount < 3;
      },
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 1,
    },
  },
});

// Error boundary component
const ErrorFallback = ({ error, resetErrorBoundary }) => {
  logErrorBoundary(error, null, 'App');
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
      <div className="text-center p-8">
        <h2 className="text-2xl font-bold mb-4">Something went wrong</h2>
        <p className="text-gray-400 mb-6">
          We apologize for the inconvenience. Our team has been notified.
        </p>
        <button
          onClick={resetErrorBoundary}
          className="bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded-lg transition-colors"
        >
          Try Again
        </button>
      </div>
    </div>
  );
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </ErrorBoundary>
  </React.StrictMode>
);

// Service Worker registration with Workbox
if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
  window.addEventListener('load', () => {
    // Import Workbox modules dynamically
    import('workbox-window').then(({ Workbox }) => {
      const wb = new Workbox('/sw.js');

      wb.addEventListener('installed', (event) => {
        if (event.isUpdate) {
          console.log('New app version available! Refresh to update.');
        }
      });

      wb.addEventListener('activated', (event) => {
        if (!event.isExternal) {
          console.log('Service worker activated');
        }
      });

      wb.register().catch((error) => {
        console.error('Service worker registration failed:', error);
      });
    }).catch((error) => {
      console.error('Failed to load Workbox:', error);
    });
  });
}
