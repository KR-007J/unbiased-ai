import * as Sentry from '@sentry/react';
import { BrowserTracing } from '@sentry/tracing';
import mixpanel from 'mixpanel';

// Initialize Sentry
export const initSentry = () => {
  if (process.env.REACT_APP_SENTRY_DSN) {
    Sentry.init({
      dsn: process.env.REACT_APP_SENTRY_DSN,
      integrations: [new BrowserTracing()],
      tracesSampleRate: 1.0,
      environment: process.env.NODE_ENV || 'development',
      beforeSend: (event) => {
        // Filter out development errors in production
        if (process.env.NODE_ENV === 'production' && event.exception) {
          const error = event.exception.values?.[0];
          if (error?.value?.includes('development') || error?.value?.includes('localhost')) {
            return null;
          }
        }
        return event;
      },
    });
  }
};

// Initialize Mixpanel
export const initAnalytics = () => {
  if (process.env.REACT_APP_MIXPANEL_TOKEN) {
    mixpanel.init(process.env.REACT_APP_MIXPANEL_TOKEN, {
      debug: process.env.NODE_ENV === 'development',
      track_pageview: true,
      persistence: 'localStorage',
    });
  }
};

// Error tracking
export const trackError = (error: Error, context?: any) => {
  console.error('Tracked error:', error, context);

  // Sentry
  if (process.env.REACT_APP_SENTRY_DSN) {
    Sentry.captureException(error, {
      tags: {
        component: context?.component || 'unknown',
        userAction: context?.action || 'unknown',
      },
      extra: context,
    });
  }

  // Mixpanel
  if (process.env.REACT_APP_MIXPANEL_TOKEN) {
    mixpanel.track('Error Occurred', {
      error: error.message,
      component: context?.component,
      action: context?.action,
      userId: context?.userId,
      timestamp: new Date().toISOString(),
    });
  }
};

// User tracking
export const identifyUser = (userId: string, traits?: any) => {
  // Sentry
  Sentry.setUser({
    id: userId,
    ...traits,
  });

  // Mixpanel
  if (process.env.REACT_APP_MIXPANEL_TOKEN) {
    mixpanel.identify(userId);
    if (traits) {
      mixpanel.people.set(traits);
    }
  }
};

// Event tracking
export const trackEvent = (eventName: string, properties?: any) => {
  console.log('Tracked event:', eventName, properties);

  // Mixpanel
  if (process.env.REACT_APP_MIXPANEL_TOKEN) {
    mixpanel.track(eventName, {
      ...properties,
      timestamp: new Date().toISOString(),
    });
  }
};

// Performance tracking
export const trackPerformance = (metricName: string, value: number, tags?: any) => {
  // Sentry
  if (process.env.REACT_APP_SENTRY_DSN) {
    Sentry.metrics.increment(metricName, value, {
      tags,
    });
  }

  // Mixpanel
  if (process.env.REACT_APP_MIXPANEL_TOKEN) {
    mixpanel.track('Performance Metric', {
      metric: metricName,
      value,
      ...tags,
      timestamp: new Date().toISOString(),
    });
  }
};

// Page view tracking
export const trackPageView = (pageName: string, properties?: any) => {
  trackEvent('Page View', {
    page: pageName,
    ...properties,
  });
};

// Feature usage tracking
export const trackFeatureUsage = (featureName: string, action: string, properties?: any) => {
  trackEvent('Feature Used', {
    feature: featureName,
    action,
    ...properties,
  });
};

// API call tracking
export const trackApiCall = (endpoint: string, method: string, status: number, duration: number) => {
  trackEvent('API Call', {
    endpoint,
    method,
    status,
    duration,
    success: status >= 200 && status < 300,
  });

  // Track performance for slow requests
  if (duration > 3000) {
    trackPerformance('Slow API Call', duration, {
      endpoint,
      method,
      status,
    });
  }
};

// Error boundary for React components
export const logErrorBoundary = (error: Error, errorInfo: any, componentName: string) => {
  trackError(error, {
    component: componentName,
    errorInfo,
    boundary: true,
  });
};

// Session tracking
export const startSession = () => {
  trackEvent('Session Start');
};

export const endSession = () => {
  trackEvent('Session End');
};

// User feedback
export const trackFeedback = (type: 'positive' | 'negative' | 'suggestion', message: string, context?: any) => {
  trackEvent('User Feedback', {
    type,
    message,
    ...context,
  });
};

// A/B testing support
export const trackExperiment = (experimentName: string, variant: string, userId?: string) => {
  trackEvent('Experiment Viewed', {
    experiment: experimentName,
    variant,
    userId,
  });
};

// Custom metrics
export const incrementMetric = (metricName: string, value: number = 1, tags?: any) => {
  trackPerformance(metricName, value, tags);
};

// Health check
export const trackHealthCheck = (service: string, status: 'healthy' | 'degraded' | 'unhealthy', details?: any) => {
  trackEvent('Health Check', {
    service,
    status,
    ...details,
  });
};