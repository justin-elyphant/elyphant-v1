/**
 * Production-ready performance optimizations
 */

// Console log elimination for production
export const devLog = (message: string, ...args: any[]) => {
  if (process.env.NODE_ENV === 'development') {
    console.log(message, ...args);
  }
};

export const devWarn = (message: string, ...args: any[]) => {
  if (process.env.NODE_ENV === 'development') {
    console.warn(message, ...args);
  }
};

export const devError = (message: string, ...args: any[]) => {
  if (process.env.NODE_ENV === 'development') {
    console.error(message, ...args);
  }
};

// Enhanced memoization with size limits
export const createBoundedMemoization = <T extends (...args: any[]) => any>(
  fn: T,
  maxSize = 100
): T => {
  const cache = new Map();
  
  return ((...args: Parameters<T>) => {
    const key = JSON.stringify(args);
    
    if (cache.has(key)) {
      return cache.get(key);
    }
    
    if (cache.size >= maxSize) {
      const firstKey = cache.keys().next().value;
      cache.delete(firstKey);
    }
    
    const result = fn(...args);
    cache.set(key, result);
    return result;
  }) as T;
};

// Intelligent preloading with priority
export const preloadWithPriority = (resources: Array<{
  url: string;
  type: 'script' | 'style' | 'image' | 'fetch';
  priority: 'high' | 'low';
}>) => {
  resources
    .sort((a, b) => a.priority === 'high' ? -1 : 1)
    .forEach(({ url, type, priority }) => {
      const link = document.createElement('link');
      
      switch (type) {
        case 'script':
          link.rel = 'preload';
          link.as = 'script';
          link.href = url;
          break;
        case 'style':
          link.rel = 'preload';
          link.as = 'style';
          link.href = url;
          break;
        case 'image':
          link.rel = 'preload';
          link.as = 'image';
          link.href = url;
          break;
        case 'fetch':
          link.rel = 'prefetch';
          link.href = url;
          break;
      }
      
      if (priority === 'high') {
        link.setAttribute('importance', 'high');
      }
      
      document.head.appendChild(link);
    });
};

// Component-level performance tracking  
import React from 'react';

// Batch DOM updates for better performance
export const batchDOMUpdates = (updates: (() => void)[]) => {
  requestAnimationFrame(() => {
    updates.forEach(update => {
      try {
        update();
      } catch (error) {
        devError('DOM update error:', error);
      }
    });
  });
};

// Memory efficient event cleanup
export const createEventCleanupManager = () => {
  const cleanupTasks: (() => void)[] = [];
  
  const addEventListenerWithCleanup = (
    element: EventTarget,
    event: string,
    handler: EventListener,
    options?: AddEventListenerOptions
  ) => {
    element.addEventListener(event, handler, options);
    cleanupTasks.push(() => element.removeEventListener(event, handler));
  };
  
  const cleanup = () => {
    cleanupTasks.forEach(task => {
      try {
        task();
      } catch (error) {
        devError('Event cleanup error:', error);
      }
    });
    cleanupTasks.length = 0;
  };
  
  return { addEventListenerWithCleanup, cleanup };
};

// Performance budget monitoring for e-commerce
export const createPerformanceBudget = () => {
  const budgets = {
    headerHeight: 80,
    maxZIndex: 100,
    maxScrollHandlers: 5,
    maxTransitionDuration: 500
  };

  const violations: string[] = [];

  return {
    checkHeaderHeight: (height: number) => {
      if (height > budgets.headerHeight) {
        violations.push(`Header height ${height}px exceeds budget of ${budgets.headerHeight}px`);
      }
    },
    checkZIndex: (zIndex: number) => {
      if (zIndex > budgets.maxZIndex) {
        violations.push(`Z-index ${zIndex} exceeds budget of ${budgets.maxZIndex}`);
      }
    },
    getViolations: () => violations,
    reset: () => violations.length = 0
  };
};