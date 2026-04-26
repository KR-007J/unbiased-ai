import { useEffect, useRef, useCallback, useMemo } from 'react';
import { trackPerformance, trackEvent, trackError } from '../utils/analytics';

// Performance monitoring hook
export const usePerformanceMonitoring = (componentName) => {
  const startTimeRef = useRef();
  const renderCountRef = useRef(0);

  useEffect(() => {
    startTimeRef.current = performance.now();
    renderCountRef.current += 1;

    return () => {
      if (startTimeRef.current) {
        const duration = performance.now() - startTimeRef.current;
        // Only track performance for 10% of renders to avoid overloading
        if (Math.random() < 0.1) {
          trackPerformance(`${componentName}_render_time`, duration, {
            renderCount: renderCountRef.current,
          });
        }
      }
    };
  }, [componentName]);

  const trackInteraction = useCallback((action, details) => {
    trackEvent('component_interaction', {
      component: componentName,
      action,
      ...details,
    });
  }, [componentName]);

  const trackCompError = useCallback((error, context) => {
    trackError(error, {
      component: componentName,
      ...context,
    });
  }, [componentName]);

  return useMemo(() => ({
    trackInteraction,
    trackError: trackCompError,
  }), [trackInteraction, trackCompError]);
};

// API call monitoring hook
export const useApiMonitoring = () => {
  const trackApiCall = useCallback(async (
    endpoint,
    method,
    statusCode,
    duration,
    metadata
  ) => {
    trackEvent('api_call', {
      endpoint,
      method,
      status: statusCode,
      duration,
      success: statusCode >= 200 && statusCode < 300,
      ...metadata,
    });

    // Track performance metrics
    trackPerformance('api_response_time', duration, {
      endpoint,
      method,
      status: statusCode,
    });

    // Alert on slow requests
    if (duration > 5000) {
      trackEvent('slow_api_call', {
        endpoint,
        method,
        duration,
        threshold: 5000,
      });
    }
  }, []);

  return useMemo(() => ({ trackApiCall }), [trackApiCall]);
};

// User behavior tracking hook
export const useUserTracking = (pageName) => {
  useEffect(() => {
    if (pageName) {
      trackEvent('page_view', {
        page: pageName,
        timestamp: new Date().toISOString(),
      });
    }

    // Track session time
    const sessionStart = Date.now();
    const handleBeforeUnload = () => {
      const sessionDuration = Date.now() - sessionStart;
      trackEvent('session_end', {
        duration: sessionDuration,
        page: pageName,
      });
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [pageName]);

  const trackUserAction = useCallback((action, details) => {
    trackEvent('user_action', {
      action,
      page: pageName,
      ...details,
    });
  }, [pageName]);

  const trackFeatureUsage = useCallback((feature, context) => {
    trackEvent('feature_used', {
      feature,
      page: pageName,
      ...context,
    });
  }, [pageName]);

  return useMemo(() => ({
    trackUserAction,
    trackFeatureUsage,
  }), [trackUserAction, trackFeatureUsage]);
};

// Error boundary monitoring hook
export const useErrorMonitoring = (componentName) => {
  const trackCompError = useCallback((error, errorInfo) => {
    trackError(error, {
      component: componentName,
      errorBoundary: true,
      errorInfo,
    });
  }, [componentName]);

  return useMemo(() => ({ trackError: trackCompError }), [trackCompError]);
};

// Performance observer hook for Web Vitals
export const useWebVitals = () => {
  useEffect(() => {
    // CLS (Cumulative Layout Shift)
    let clsValue = 0;
    try {
      const clsObserver = new PerformanceObserver((entryList) => {
        for (const entry of entryList.getEntries()) {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
          }
        }
        trackPerformance('cls', clsValue);
      });
      clsObserver.observe({ entryTypes: ['layout-shift'] });
      return () => clsObserver.disconnect();
    } catch(e) {}
  }, []);
};

// Resource loading monitoring hook
export const useResourceMonitoring = () => {
  useEffect(() => {
    try {
      const resourceObserver = new PerformanceObserver((entryList) => {
        for (const entry of entryList.getEntries()) {
          // Track slow resources
          if (entry.duration > 2000) {
            trackPerformance('slow_resource', entry.duration, {
              resource: entry.name,
              type: entry.initiatorType,
              size: entry.transferSize,
            });
          }

          // Track failed resources
          if (entry.transferSize === 0 && entry.decodedBodySize === 0 && entry.initiatorType !== 'xmlhttprequest' && entry.initiatorType !== 'fetch') {
            trackEvent('resource_load_failed', {
              resource: entry.name,
              type: entry.initiatorType,
            });
          }
        }
      });

      resourceObserver.observe({ entryTypes: ['resource'] });
      return () => resourceObserver.disconnect();
    } catch(e) {}
  }, []);
};

// Memory usage monitoring hook
export const useMemoryMonitoring = () => {
  useEffect(() => {
    const checkMemoryUsage = () => {
      if ('memory' in performance) {
        const memory = performance.memory;
        const memoryUsagePercent = (memory.usedJSHeapSize / memory.totalJSHeapSize) * 100;

        trackPerformance('memory_usage_percent', memoryUsagePercent);
        trackPerformance('memory_used_mb', memory.usedJSHeapSize / 1024 / 1024);

        // Alert on high memory usage
        if (memoryUsagePercent > 80) {
          trackEvent('high_memory_usage', {
            usagePercent: memoryUsagePercent,
            usedMB: memory.usedJSHeapSize / 1024 / 1024,
            totalMB: memory.totalJSHeapSize / 1024 / 1024,
          });
        }
      }
    };

    const interval = setInterval(checkMemoryUsage, 30000);
    return () => clearInterval(interval);
  }, []);
};

// Network monitoring hook
export const useNetworkMonitoring = () => {
  useEffect(() => {
    const updateNetworkStatus = () => {
      const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;

      if (connection) {
        trackEvent('network_change', {
          effectiveType: connection.effectiveType,
          downlink: connection.downlink,
          rtt: connection.rtt,
          saveData: connection.saveData,
        });
      }
    };

    const handleOnline = () => trackEvent('network_online');
    const handleOffline = () => trackEvent('network_offline');

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    if ('connection' in navigator) {
      navigator.connection.addEventListener('change', updateNetworkStatus);
      updateNetworkStatus();
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if ('connection' in navigator) {
        navigator.connection.removeEventListener('change', updateNetworkStatus);
      }
    };
  }, []);
};

// Comprehensive monitoring hook
export const useMonitoring = (componentName, options = {}) => {
  const {
    trackInteractions = true,
    trackErrors = true,
    pageName,
  } = options;

  // Call hooks unconditionally
  const performanceMonitor = usePerformanceMonitoring(componentName);
  const userTracker = useUserTracking(pageName);
  const errorMonitor = useErrorMonitoring(componentName);

  useWebVitals();
  useResourceMonitoring();
  useMemoryMonitoring();
  useNetworkMonitoring();

  const trackInteraction = useCallback((action, details) => {
    if (trackInteractions) {
      performanceMonitor.trackInteraction(action, details);
    }
    userTracker.trackUserAction(action, details);
  }, [trackInteractions, performanceMonitor, userTracker]);

  const trackComponentError = useCallback((error, context) => {
    if (trackErrors) {
      errorMonitor.trackError(error);
    }
    performanceMonitor.trackError(error, context);
  }, [trackErrors, errorMonitor, performanceMonitor]);

  const trackFeature = useCallback((feature, context) => {
    userTracker.trackFeatureUsage(feature, context);
  }, [userTracker]);

  return useMemo(() => ({
    trackInteraction,
    trackComponentError,
    trackFeature,
  }), [trackInteraction, trackComponentError, trackFeature]);
};