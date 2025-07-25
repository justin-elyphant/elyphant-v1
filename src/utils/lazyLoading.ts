/**
 * Enhanced lazy loading utilities for better performance
 */

// Intersection Observer with enhanced options for better performance
export const createOptimizedImageObserver = () => {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target as HTMLImageElement;
        const src = img.dataset.src;
        if (src) {
          // Use requestIdleCallback for better performance
          if ('requestIdleCallback' in window) {
            requestIdleCallback(() => {
              img.src = src;
              img.removeAttribute('data-src');
              observer.unobserve(img);
            });
          } else {
            img.src = src;
            img.removeAttribute('data-src');
            observer.unobserve(img);
          }
        }
      }
    });
  }, {
    // More aggressive loading for better perceived performance
    rootMargin: '50px 0px',
    threshold: 0.1
  });

  return observer;
};

// Preload images that are likely to be viewed soon
export const preloadCriticalImages = (imageSrcs: string[]) => {
  imageSrcs.forEach(src => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'image';
    link.href = src;
    document.head.appendChild(link);
  });
};

// Component preloading for better navigation performance
export const preloadRoutes = () => {
  // Preload likely next pages
  const criticalRoutes = ['/marketplace', '/auth'];
  
  criticalRoutes.forEach(route => {
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = route;
    document.head.appendChild(link);
  });
};

// Re-export from React for convenience
import React from 'react';

// Lazy component creator for code splitting
export const createLazyComponent = <T extends React.ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  fallback?: boolean
) => {
  return React.lazy(importFn);
};

// Optimized image source helper
export const createOptimizedImageSrc = (src: string, options?: { 
  width?: number; 
  height?: number; 
  quality?: number;
  format?: string;
}) => {
  // For now, return the original source
  // In the future, this could integrate with image optimization services
  return src;
};