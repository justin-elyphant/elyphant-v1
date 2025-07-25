/**
 * Image optimization utilities for better performance
 */

// Image cache for better memory management
const imageCache = new Map<string, HTMLImageElement>();
const maxCacheSize = 50;

// Preload critical images
export const preloadCriticalImages = (urls: string[]) => {
  urls.slice(0, 3).forEach(url => {
    if (!imageCache.has(url)) {
      const img = new Image();
      img.src = url;
      img.onload = () => {
        if (imageCache.size >= maxCacheSize) {
          const firstKey = imageCache.keys().next().value;
          imageCache.delete(firstKey);
        }
        imageCache.set(url, img);
      };
    }
  });
};

// Optimize image source for better loading
export const getOptimizedImageSrc = (src: string, options: {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'webp' | 'jpg' | 'png';
} = {}) => {
  const { width = 300, height = 300, quality = 75, format = 'webp' } = options;
  
  // If it's an Unsplash image, optimize it
  if (src.includes('unsplash.com')) {
    const params = new URLSearchParams();
    params.set('w', width.toString());
    params.set('h', height.toString());
    params.set('fm', format);
    params.set('q', quality.toString());
    params.set('fit', 'crop');
    params.set('auto', 'format');
    
    return `${src}?${params.toString()}`;
  }
  
  return src;
};

// Create responsive image sizes
export const getResponsiveImageSizes = (baseWidth: number) => {
  return [
    `(max-width: 640px) ${baseWidth}px`,
    `(max-width: 768px) ${Math.floor(baseWidth * 1.2)}px`,
    `(max-width: 1024px) ${Math.floor(baseWidth * 1.4)}px`,
    `${Math.floor(baseWidth * 1.6)}px`
  ].join(', ');
};

// Clear image cache periodically
export const clearImageCache = () => {
  imageCache.clear();
};

// Get cached image if available
export const getCachedImage = (src: string): HTMLImageElement | null => {
  return imageCache.get(src) || null;
};