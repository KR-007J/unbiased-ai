import { useEffect, useRef, useCallback } from 'react';
import { trackPerformance, trackEvent, trackError } from '../utils/analytics';

// Performance monitoring hook
export const usePerformanceMonitoring = (componentName: string) => {
  const startTimeRef = useRef<number>();
  const renderCountRef = useRef(0);

  useEffect(() => {
    startTimeRef.current = performance.now();
    renderCountRef.current += 1;

    return () => {
      if (startTimeRef.current) {
        const duration = performance.now() - startTimeRef.current;
        trackPerformance(`${componentName}_render_time`, duration, {
          renderCount: renderCountRef.current,
        });
      }
    };
  });

  const trackInteraction = useCallback((action: string, details?: any) => {
    trackEvent('component_interaction', {
      component: componentName,
      action,
      ...details,
    });
  }, [componentName]);

  const trackError = useCallback((error: Error, context?: any) => {
    trackError(error, {
      component: componentName,
      ...context,
    });
  }, [componentName]);

  return {
    trackInteraction,
    trackError,
  };
};

// API call monitoring hook
export const useApiMonitoring = () => {
  const trackApiCall = useCallback(async (
    endpoint: string,
    method: string,
    statusCode: number,
    duration: number,
    metadata?: any
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

  return { trackApiCall };
};

// User behavior tracking hook
export const useUserTracking = (pageName?: string) => {
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

  const trackUserAction = useCallback((action: string, details?: any) => {
    trackEvent('user_action', {
      action,
      page: pageName,
      ...details,
    });
  }, [pageName]);

  const trackFeatureUsage = useCallback((feature: string, context?: any) => {
    trackEvent('feature_used', {
      feature,
      page: pageName,
      ...context,
    });
  }, [pageName]);

  return {
    trackUserAction,
    trackFeatureUsage,
  };
};

// Error boundary monitoring hook
export const useErrorMonitoring = (componentName: string) => {
  const trackError = useCallback((error: Error, errorInfo?: any) => {
    trackError(error, {
      component: componentName,
      errorBoundary: true,
      errorInfo,
    });
  }, [componentName]);

  return { trackError };
};

// Performance observer hook for Web Vitals
export const useWebVitals = () => {
  useEffect(() => {
    // CLS (Cumulative Layout Shift)
    let clsValue = 0;
    const clsObserver = new PerformanceObserver((entryList) => {
      for (const entry of entryList.getEntries()) {
        if (!(entry as any).hadRecentInput) {
          clsValue += (entry as any).value;
        }
      }
      trackPerformance('cls', clsValue);
    });
    clsObserver.observe({ entryTypes: ['layout-shift'] });

    // FID (First Input Delay)
    const fidObserver = new PerformanceObserver((entryList) => {
      for (const entry of entryList.getEntries()) {
        trackPerformance('fid', (entry as any).processingStart - entry.startTime, {
          eventType: (entry as any).name,
        });
      }
    });
    fidObserver.observe({ entryTypes: ['first-input'] });

    // LCP (Largest Contentful Paint)
    const lcpObserver = new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries();
      const lastEntry = entries[entries.length - 1];
      trackPerformance('lcp', lastEntry.startTime);
    });
    lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });

    return () => {
      clsObserver.disconnect();
      fidObserver.disconnect();
      lcpObserver.disconnect();
    };
  }, []);
};

// Resource loading monitoring hook
export const useResourceMonitoring = () => {
  useEffect(() => {
    const resourceObserver = new PerformanceObserver((entryList) => {
      for (const entry of entryList.getEntries()) {
        const resourceEntry = entry as PerformanceResourceTiming;

        // Track slow resources
        if (resourceEntry.duration > 2000) {
          trackPerformance('slow_resource', resourceEntry.duration, {
            resource: resourceEntry.name,
            type: resourceEntry.initiatorType,
            size: resourceEntry.transferSize,
          });
        }

        // Track failed resources
        if (resourceEntry.transferSize === 0 && resourceEntry.decodedBodySize === 0) {
          trackEvent('resource_load_failed', {
            resource: resourceEntry.name,
            type: resourceEntry.initiatorType,
          });
        }
      }
    });

    resourceObserver.observe({ entryTypes: ['resource'] });

    return () => {
      resourceObserver.disconnect();
    };
  }, []);
};

// Memory usage monitoring hook
export const useMemoryMonitoring = () => {
  useEffect(() => {
    const checkMemoryUsage = () => {
      if ('memory' in performance) {
        const memory = (performance as any).memory;
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

    // Check memory usage every 30 seconds
    const interval = setInterval(checkMemoryUsage, 30000);

    return () => {
      clearInterval(interval);
    };
  }, []);
};

// Network monitoring hook
export const useNetworkMonitoring = () => {
  useEffect(() => {
    const updateNetworkStatus = () => {
      const connection = (navigator as any).connection ||
                        (navigator as any).mozConnection ||
                        (navigator as any).webkitConnection;

      if (connection) {
        trackEvent('network_change', {
          effectiveType: connection.effectiveType,
          downlink: connection.downlink,
          rtt: connection.rtt,
          saveData: connection.saveData,
        });
      }
    };

    // Monitor online/offline status
    const handleOnline = () => trackEvent('network_online');
    const handleOffline = () => trackEvent('network_offline');

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Monitor connection changes if supported
    if ('connection' in navigator) {
      (navigator as any).connection.addEventListener('change', updateNetworkStatus);
      updateNetworkStatus(); // Initial check
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if ('connection' in navigator) {
        (navigator as any).connection.removeEventListener('change', updateNetworkStatus);
      }
    };
  }, []);
};

// Comprehensive monitoring hook that combines multiple monitoring types
export const useMonitoring = (componentName: string, options: {
  trackPerformance?: boolean;
  trackInteractions?: boolean;
  trackErrors?: boolean;
  pageName?: string;
} = {}) => {
  const {
    trackPerformance: enablePerformance = true,
    trackInteractions = true,
    trackErrors = true,
    pageName,
  } = options;

  // Performance monitoring
  const performanceMonitor = enablePerformance ? usePerformanceMonitoring(componentName) : null;

  // User tracking
  const userTracker = useUserTracking(pageName);

  // Error monitoring
  const errorMonitor = trackErrors ? useErrorMonitoring(componentName) : null;

  // Web vitals
  useWebVitals();

  // Resource monitoring
  useResourceMonitoring();

  // Memory monitoring
  useMemoryMonitoring();

  // Network monitoring
  useNetworkMonitoring();

  const trackInteraction = useCallback((action: string, details?: any) => {
    if (trackInteractions && performanceMonitor) {
      performanceMonitor.trackInteraction(action, details);
    }
    userTracker.trackUserAction(action, details);
  }, [trackInteractions, performanceMonitor, userTracker]);

  const trackComponentError = useCallback((error: Error, context?: any) => {
    if (trackErrors && errorMonitor) {
      errorMonitor.trackError(error);
    }
    if (performanceMonitor) {
      performanceMonitor.trackError(error, context);
    }
  }, [trackErrors, errorMonitor, performanceMonitor]);

  const trackFeature = useCallback((feature: string, context?: any) => {
    userTracker.trackFeatureUsage(feature, context);
  }, [userTracker]);

  return {
    trackInteraction,
    trackComponentError,
    trackFeature,
  };
};