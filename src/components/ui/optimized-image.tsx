
import React, { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver';

interface OptimizedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  quality?: number;
  blur?: boolean;
  priority?: boolean;
  className?: string;
  fallbackSrc?: string;
  webpSupport?: boolean;
  compressionLevel?: 'low' | 'medium' | 'high';
}

export const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  width,
  height,
  quality = 80,
  blur = true,
  priority = false,
  className,
  fallbackSrc = '/placeholder.svg',
  webpSupport = true,
  compressionLevel = 'medium',
  ...props
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState(false);
  const [currentSrc, setCurrentSrc] = useState<string>('');
  const [retryCount, setRetryCount] = useState(0);
  const imgRef = useRef<HTMLImageElement>(null);
  const maxRetries = 2;
  
  const { ref: intersectionRef, isIntersecting } = useIntersectionObserver({
    threshold: 0.1,
    freezeOnceVisible: true,
    initialIsIntersecting: priority,
    rootMargin: '50px' // Start loading 50px before entering viewport
  });

  // WebP support detection
  const [supportsWebP, setSupportsWebP] = useState<boolean | null>(null);

  useEffect(() => {
    if (!webpSupport) {
      setSupportsWebP(false);
      return;
    }

    // Check WebP support
    const webp = new Image();
    webp.onload = webp.onerror = () => {
      setSupportsWebP(webp.height === 2);
    };
    webp.src = 'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA';
  }, [webpSupport]);

  // Generate optimized image URLs
  const generateOptimizedSrc = (baseSrc: string, useWebP: boolean) => {
    // If it's already a data URL or placeholder, return as-is
    if (baseSrc.startsWith('data:') || baseSrc.includes('placeholder')) {
      return baseSrc;
    }

    // For external image services (like Unsplash, Cloudinary, etc.)
    if (baseSrc.includes('unsplash.com')) {
      const params = new URLSearchParams();
      if (width) params.set('w', width.toString());
      if (height) params.set('h', height.toString());
      if (quality) params.set('q', quality.toString());
      params.set('auto', 'format');
      
      // Set compression based on level
      const compressionMap = { low: 90, medium: 80, high: 60 };
      params.set('q', (compressionMap[compressionLevel] || 80).toString());
      
      if (useWebP && supportsWebP) {
        params.set('fm', 'webp');
      }
      
      return `${baseSrc}?${params.toString()}`;
    }
    
    // For other images, return as-is (could be enhanced with image processing service)
    return baseSrc;
  };

  const generateSizes = () => {
    if (width) {
      return `${width}px`;
    }
    // Responsive sizes based on screen width
    return '(max-width: 480px) 100vw, (max-width: 768px) 80vw, (max-width: 1200px) 50vw, 33vw';
  };

  // Load image when it enters viewport
  useEffect(() => {
    if ((isIntersecting || priority) && supportsWebP !== null) {
      const optimizedSrc = generateOptimizedSrc(src, supportsWebP);
      setCurrentSrc(optimizedSrc);
    }
  }, [isIntersecting, priority, src, supportsWebP, width, height, quality, compressionLevel]);

  const handleLoad = () => {
    setIsLoaded(true);
    setError(false);
    setRetryCount(0);
  };

  const handleError = () => {
    console.warn(`Failed to load image: ${currentSrc}`);
    
    if (retryCount < maxRetries) {
      // Retry with fallback formats
      setRetryCount(prev => prev + 1);
      
      if (retryCount === 0 && supportsWebP) {
        // First retry: try without WebP
        const fallbackSrc = generateOptimizedSrc(src, false);
        setCurrentSrc(fallbackSrc);
        return;
      } else if (retryCount === 1) {
        // Second retry: try original src
        setCurrentSrc(src);
        return;
      }
    }
    
    // Final fallback
    setError(true);
    setCurrentSrc(fallbackSrc);
  };

  // Combine refs for intersection observer and image element
  const setRefs = (element: HTMLImageElement | null) => {
    imgRef.current = element;
    intersectionRef.current = element;
  };

  // Blur placeholder while loading
  const blurDataURL = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAiIGhlaWdodD0iMTAiIHZpZXdCb3g9IjAgMCAxMCAxMCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjEwIiBoZWlnaHQ9IjEwIiBmaWxsPSIjZjNmNGY2Ii8+Cjwvc3ZnPgo=';

  return (
    <div className={cn('relative overflow-hidden', className)}>
      {/* Blur placeholder */}
      {!isLoaded && blur && (
        <img
          src={blurDataURL}
          alt=""
          className="absolute inset-0 w-full h-full object-cover blur-sm scale-110"
          aria-hidden="true"
        />
      )}
      
      {/* Main image */}
      {currentSrc && (
        <img
          ref={setRefs}
          src={currentSrc}
          alt={alt}
          width={width}
          height={height}
          sizes={generateSizes()}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
          onLoad={handleLoad}
          onError={handleError}
          className={cn(
            'transition-opacity duration-300 ease-out w-full h-full object-cover',
            isLoaded ? 'opacity-100' : 'opacity-0',
            !isLoaded && !blur && 'bg-gray-100'
          )}
          style={{
            contentVisibility: 'auto',
            containIntrinsicSize: width && height ? `${width}px ${height}px` : '200px 200px'
          }}
          {...props}
        />
      )}
      
      {/* Loading skeleton */}
      {!isLoaded && !error && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" 
               role="status" 
               aria-label="Loading image">
            <span className="sr-only">Loading...</span>
          </div>
        </div>
      )}
      
      {/* Error state */}
      {error && currentSrc === fallbackSrc && (
        <div className="absolute inset-0 bg-gray-100 flex flex-col items-center justify-center text-gray-400 p-4">
          <svg className="w-8 h-8 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <span className="text-sm text-center">Failed to load image</span>
        </div>
      )}
      
      {/* Screen reader support */}
      <span className="sr-only">
        {isLoaded ? `Image loaded: ${alt}` : error ? `Failed to load image: ${alt}` : `Loading image: ${alt}`}
      </span>
    </div>
  );
};

export default OptimizedImage;
