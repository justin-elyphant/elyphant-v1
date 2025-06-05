
// Performance monitoring and optimization utilities
export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  private metrics: Map<string, number> = new Map();

  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  // Track component render times
  trackComponentRender(componentName: string, renderTime: number) {
    this.metrics.set(`${componentName}_render`, renderTime);
  }

  // Track API response times
  trackApiCall(endpoint: string, duration: number) {
    this.metrics.set(`api_${endpoint}`, duration);
  }

  // Track bundle load times
  trackBundleLoad(bundleName: string, loadTime: number) {
    this.metrics.set(`bundle_${bundleName}`, loadTime);
  }

  // Get performance report
  getPerformanceReport() {
    const report: Record<string, any> = {};
    
    // Web Vitals
    if (typeof window !== 'undefined' && 'performance' in window) {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      
      report.pageLoad = {
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
        loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
        firstByte: navigation.responseStart - navigation.requestStart,
      };

      // Paint metrics
      const paintMetrics = performance.getEntriesByType('paint');
      report.paint = paintMetrics.reduce((acc, metric) => {
        acc[metric.name] = metric.startTime;
        return acc;
      }, {} as Record<string, number>);
    }

    // Custom metrics
    report.customMetrics = Object.fromEntries(this.metrics);

    return report;
  }

  // Check if performance budget is exceeded
  checkPerformanceBudget() {
    const budgets = {
      initialBundle: 150000, // 150KB
      apiResponse: 1000, // 1 second
      componentRender: 16, // 16ms for 60fps
    };

    const violations: string[] = [];
    
    this.metrics.forEach((value, key) => {
      if (key.includes('bundle') && value > budgets.initialBundle) {
        violations.push(`Bundle size exceeded: ${key} (${value / 1000}KB)`);
      }
      if (key.includes('api') && value > budgets.apiResponse) {
        violations.push(`API response slow: ${key} (${value}ms)`);
      }
      if (key.includes('render') && value > budgets.componentRender) {
        violations.push(`Component render slow: ${key} (${value}ms)`);
      }
    });

    return violations;
  }
}

// React hook for performance monitoring
export const usePerformanceMonitor = () => {
  const monitor = PerformanceMonitor.getInstance();
  
  const trackRender = (componentName: string, startTime: number) => {
    const endTime = performance.now();
    monitor.trackComponentRender(componentName, endTime - startTime);
  };

  const trackAsyncOperation = async <T>(
    operationName: string,
    operation: () => Promise<T>
  ): Promise<T> => {
    const startTime = performance.now();
    try {
      const result = await operation();
      const endTime = performance.now();
      monitor.trackApiCall(operationName, endTime - startTime);
      return result;
    } catch (error) {
      const endTime = performance.now();
      monitor.trackApiCall(`${operationName}_error`, endTime - startTime);
      throw error;
    }
  };

  return {
    trackRender,
    trackAsyncOperation,
    getReport: () => monitor.getPerformanceReport(),
    checkBudget: () => monitor.checkPerformanceBudget(),
  };
};

// Service Worker registration for caching
export const registerServiceWorker = async () => {
  if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      console.log('Service Worker registered successfully:', registration);
      return registration;
    } catch (error) {
      console.error('Service Worker registration failed:', error);
    }
  }
};
