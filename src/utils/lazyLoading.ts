
import { lazy, ComponentType } from 'react';

// Enhanced lazy loading with better error handling and preloading
export const createLazyComponent = <T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  preload: boolean = false
) => {
  const LazyComponent = lazy(importFn);
  
  // Preload the component if requested
  if (preload) {
    importFn().catch(err => 
      console.warn('Failed to preload component:', err)
    );
  }
  
  return LazyComponent;
};

// Intersection Observer for lazy loading with performance optimizations
export const createIntersectionObserver = (
  callback: (entries: IntersectionObserverEntry[]) => void,
  options: IntersectionObserverInit = {}
) => {
  const defaultOptions: IntersectionObserverInit = {
    root: null,
    rootMargin: '50px',
    threshold: 0.1,
    ...options
  };
  
  return new IntersectionObserver(callback, defaultOptions);
};

// Image lazy loading with WebP support and blur placeholder
export const createOptimizedImageSrc = (
  src: string,
  options: {
    width?: number;
    height?: number;
    format?: 'webp' | 'jpg' | 'png';
    quality?: number;
  } = {}
) => {
  const { width, height, format = 'webp', quality = 80 } = options;
  
  // If it's an Unsplash image, optimize it
  if (src.includes('unsplash.com')) {
    const params = new URLSearchParams();
    if (width) params.set('w', width.toString());
    if (height) params.set('h', height.toString());
    if (format) params.set('fm', format);
    params.set('q', quality.toString());
    params.set('auto', 'format');
    
    return `${src}?${params.toString()}`;
  }
  
  return src;
};

// Preload critical images
export const preloadImage = (src: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = reject;
    img.src = src;
  });
};

// Bundle size monitoring utility
export const trackBundlePerformance = () => {
  if (typeof window !== 'undefined' && 'performance' in window) {
    window.addEventListener('load', () => {
      const perfData = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      
      console.log('Performance Metrics:', {
        domContentLoaded: perfData.domContentLoadedEventEnd - perfData.domContentLoadedEventStart,
        loadComplete: perfData.loadEventEnd - perfData.loadEventStart,
        firstContentfulPaint: performance.getEntriesByType('paint')
          .find(entry => entry.name === 'first-contentful-paint')?.startTime
      });
    });
  }
};
