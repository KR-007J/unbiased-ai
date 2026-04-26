import * as Sentry from '@sentry/react';
import { BrowserTracing } from '@sentry/tracing';
import mixpanel from 'mixpanel-browser';

// Initialize Sentry
export const initSentry = () => {
  if (import.meta.env.REACT_APP_SENTRY_DSN) {
    Sentry.init({
      dsn: import.meta.env.REACT_APP_SENTRY_DSN,
      integrations: [new BrowserTracing()],
      tracesSampleRate: 1.0,
      environment: import.meta.env.MODE || 'development',
      beforeSend: (event) => {
        // Filter out development errors in production
        if (import.meta.env.MODE === 'production' && event.exception) {
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
  if (import.meta.env.REACT_APP_MIXPANEL_TOKEN) {
    mixpanel.init(import.meta.env.REACT_APP_MIXPANEL_TOKEN, {
      debug: import.meta.env.MODE === 'development',
      track_pageview: true,
      persistence: 'localStorage',
    });
  }
};

// Error tracking
export const trackError = (error, context) => {
  console.error('Tracked error:', error, context);

  // Sentry
  if (import.meta.env.REACT_APP_SENTRY_DSN) {
    Sentry.captureException(error, {
      tags: {
        component: context?.component || 'unknown',
        userAction: context?.action || 'unknown',
      },
      extra: context,
    });
  }

  // Mixpanel
  if (import.meta.env.REACT_APP_MIXPANEL_TOKEN) {
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
export const identifyUser = (userId, traits) => {
  // Sentry
  Sentry.setUser({
    id: userId,
    ...traits,
  });

  // Mixpanel
  if (import.meta.env.REACT_APP_MIXPANEL_TOKEN) {
    mixpanel.identify(userId);
    if (traits) {
      mixpanel.people.set(traits);
    }
  }
};

// Event tracking
export const trackEvent = (eventName, properties) => {
  // Console logging is disabled in production to optimize performance
  if (import.meta.env.MODE === 'development') {
    console.log('Tracked event:', eventName, properties);
  }

  // Mixpanel
  if (import.meta.env.REACT_APP_MIXPANEL_TOKEN) {
    mixpanel.track(eventName, {
      ...properties,
      timestamp: new Date().toISOString(),
    });
  }
};

// Performance tracking
export const trackPerformance = (metricName, value, tags) => {
  // Sentry
  if (import.meta.env.REACT_APP_SENTRY_DSN) {
    // Sentry.metrics might not be available in all versions, using basic tracking for now
  }

  // Mixpanel
  if (import.meta.env.REACT_APP_MIXPANEL_TOKEN) {
    mixpanel.track('Performance Metric', {
      metric: metricName,
      value,
      ...tags,
      timestamp: new Date().toISOString(),
    });
  }
};

// Page view tracking
export const trackPageView = (pageName, properties) => {
  trackEvent('Page View', {
    page: pageName,
    ...properties,
  });
};

// Feature usage tracking
export const trackFeatureUsage = (featureName, action, properties) => {
  trackEvent('Feature Used', {
    feature: featureName,
    action,
    ...properties,
  });
};

// API call tracking
export const trackApiCall = (endpoint, method, status, duration) => {
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
export const logErrorBoundary = (error, errorInfo, componentName) => {
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
export const trackFeedback = (type, message, context) => {
  trackEvent('User Feedback', {
    type,
    message,
    ...context,
  });
};

// A/B testing support
export const trackExperiment = (experimentName, variant, userId) => {
  trackEvent('Experiment Viewed', {
    experiment: experimentName,
    variant,
    userId,
  });
};

// Custom metrics
export const incrementMetric = (metricName, value = 1, tags) => {
  trackPerformance(metricName, value, tags);
};

// Health check
export const trackHealthCheck = (service, status, details) => {
  trackEvent('Health Check', {
    service,
    status,
    ...details,
  });
};