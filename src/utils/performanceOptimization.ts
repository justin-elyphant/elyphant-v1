/**
 * Performance optimization utilities for React components and data operations
 */

import { debounce } from 'lodash';

// Image lazy loading and optimization
export const optimizeImageLoading = () => {
  // Implement intersection observer for lazy loading
  const imageObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target as HTMLImageElement;
        const src = img.dataset.src;
        if (src) {
          img.src = src;
          img.removeAttribute('data-src');
          observer.unobserve(img);
        }
      }
    });
  });

  // Observe all images with data-src attribute
  document.querySelectorAll('img[data-src]').forEach(img => {
    imageObserver.observe(img);
  });

  return imageObserver;
};

// Debounced search function
export const createDebouncedSearch = (searchFn: (term: string) => void, delay = 300) => {
  return debounce(searchFn, delay);
};

// Memoization utility for expensive calculations
export const memoizeFunction = <T extends (...args: any[]) => any>(fn: T): T => {
  const cache = new Map();
  
  return ((...args: Parameters<T>) => {
    const key = JSON.stringify(args);
    if (cache.has(key)) {
      return cache.get(key);
    }
    
    const result = fn(...args);
    cache.set(key, result);
    return result;
  }) as T;
};

// Batch DOM updates
export const batchUpdates = (updates: (() => void)[]) => {
  requestAnimationFrame(() => {
    updates.forEach(update => update());
  });
};

// Virtual scrolling helper
export const calculateVisibleRange = (
  scrollTop: number,
  containerHeight: number,
  itemHeight: number,
  totalItems: number
) => {
  const startIndex = Math.floor(scrollTop / itemHeight);
  const endIndex = Math.min(
    startIndex + Math.ceil(containerHeight / itemHeight) + 1,
    totalItems - 1
  );
  
  return { startIndex, endIndex };
};

// Memory-efficient array operations
export const chunkArray = <T>(array: T[], chunkSize: number): T[][] => {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += chunkSize) {
    chunks.push(array.slice(i, i + chunkSize));
  }
  return chunks;
};

// Performance monitoring
export class PerformanceMonitor {
  private static measurements = new Map<string, number>();

  static startMeasure(name: string) {
    this.measurements.set(name, performance.now());
  }

  static endMeasure(name: string): number {
    const start = this.measurements.get(name);
    if (!start) return 0;
    
    const duration = performance.now() - start;
    console.log(`Performance [${name}]: ${duration.toFixed(2)}ms`);
    this.measurements.delete(name);
    return duration;
  }

  static measureFunction<T extends (...args: any[]) => any>(name: string, fn: T): T {
    return ((...args: Parameters<T>) => {
      this.startMeasure(name);
      const result = fn(...args);
      this.endMeasure(name);
      return result;
    }) as T;
  }
}

// Component cleanup utilities
export const createCleanupTracker = () => {
  const cleanupFunctions: (() => void)[] = [];

  const addCleanup = (fn: () => void) => {
    cleanupFunctions.push(fn);
  };

  const cleanup = () => {
    cleanupFunctions.forEach(fn => {
      try {
        fn();
      } catch (error) {
        console.error('Cleanup error:', error);
      }
    });
    cleanupFunctions.length = 0;
  };

  return { addCleanup, cleanup };
};

// Memory leak prevention
export const preventMemoryLeaks = {
  clearTimeouts: (timeouts: NodeJS.Timeout[]) => {
    timeouts.forEach(timeout => clearTimeout(timeout));
    timeouts.length = 0;
  },

  clearIntervals: (intervals: NodeJS.Timeout[]) => {
    intervals.forEach(interval => clearInterval(interval));
    intervals.length = 0;
  },

  removeEventListeners: (element: Element, listeners: { event: string; handler: EventListener }[]) => {
    listeners.forEach(({ event, handler }) => {
      element.removeEventListener(event, handler);
    });
  }
};