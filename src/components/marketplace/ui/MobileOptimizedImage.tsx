
import React, { useState, useRef, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import { useIntersectionObserver } from "@/hooks/useIntersectionObserver";
import { useIsMobile } from "@/hooks/use-mobile";

interface MobileOptimizedImageProps {
  src: string;
  alt: string;
  className?: string;
  aspectRatio?: "square" | "portrait" | "wide";
  priority?: boolean;
  onLoad?: () => void;
  onError?: () => void;
}

const MobileOptimizedImage: React.FC<MobileOptimizedImageProps> = ({
  src,
  alt,
  className,
  aspectRatio = "square",
  priority = false,
  onLoad,
  onError
}) => {
  const [imageState, setImageState] = useState<'loading' | 'loaded' | 'error'>('loading');
  const [imageSrc, setImageSrc] = useState<string>('');
  const [retryCount, setRetryCount] = useState(0);
  const isMobile = useIsMobile();
  const imgRef = useRef<HTMLImageElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout>();
  
  const { ref: intersectionRef, isIntersecting } = useIntersectionObserver({
    threshold: 0.1,
    rootMargin: isMobile ? '100px' : '50px', // Larger margin for mobile
    freezeOnceVisible: true,
    initialIsIntersecting: priority
  });

  // Optimize image URL for mobile
  const optimizeImageForMobile = useCallback((originalSrc: string): string => {
    if (!originalSrc) return '';
    
    // For Unsplash images, add mobile optimizations
    if (originalSrc.includes('unsplash.com')) {
      const url = new URL(originalSrc);
      
      if (isMobile) {
        // Mobile optimizations
        url.searchParams.set('w', '400'); // Smaller width for mobile
        url.searchParams.set('h', '400');
        url.searchParams.set('q', '75'); // Slightly lower quality for faster loading
        url.searchParams.set('auto', 'format'); // Auto format selection
        url.searchParams.set('fit', 'crop');
      }
      
      return url.toString();
    }
    
    return originalSrc;
  }, [isMobile]);

  // Handle image loading with timeout
  const loadImage = useCallback(async () => {
    if (!src || imageState === 'loaded') return;

    const optimizedSrc = optimizeImageForMobile(src);
    
    // Set timeout for slow connections (shorter for mobile)
    const timeoutDuration = isMobile ? 8000 : 12000;
    
    timeoutRef.current = setTimeout(() => {
      if (imageState === 'loading') {
        console.warn(`Image loading timeout: ${src}`);
        setImageState('error');
        onError?.();
      }
    }, timeoutDuration);

    try {
      const img = new Image();
      
      img.onload = () => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        setImageSrc(optimizedSrc);
        setImageState('loaded');
        onLoad?.();
      };
      
      img.onerror = () => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        
        // Retry logic for mobile
        if (retryCount < 2 && isMobile) {
          console.log(`Retrying image load (${retryCount + 1}/2): ${src}`);
          setRetryCount(prev => prev + 1);
          setTimeout(() => loadImage(), 1000 * (retryCount + 1));
          return;
        }
        
        setImageState('error');
        onError?.();
      };
      
      img.src = optimizedSrc;
    } catch (error) {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      setImageState('error');
      onError?.();
    }
  }, [src, imageState, optimizeImageForMobile, isMobile, retryCount, onLoad, onError]);

  // Load image when in viewport or priority
  useEffect(() => {
    if ((isIntersecting || priority) && imageState === 'loading') {
      loadImage();
    }
  }, [isIntersecting, priority, loadImage, imageState]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const getAspectRatioClass = () => {
    switch (aspectRatio) {
      case "portrait": return "aspect-[3/4]";
      case "wide": return "aspect-[16/9]";
      case "square":
      default: return "aspect-square";
    }
  };

  // Set refs for intersection observer
  const setRefs = useCallback((element: HTMLImageElement | null) => {
    imgRef.current = element;
    intersectionRef.current = element;
  }, [intersectionRef]);

  return (
    <div className={cn("relative overflow-hidden bg-gray-100", getAspectRatioClass(), className)}>
      {/* Progressive loading skeleton */}
      {imageState === 'loading' && (
        <div className="absolute inset-0 animate-pulse">
          <div className="w-full h-full bg-gradient-to-br from-gray-200 via-gray-100 to-gray-200 bg-[length:200%_200%] animate-[shimmer_2s_infinite]" />
          
          {/* Loading indicator for mobile */}
          {isMobile && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-6 h-6 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
            </div>
          )}
        </div>
      )}

      {/* Main image */}
      {imageSrc && imageState === 'loaded' && (
        <img
          ref={setRefs}
          src={imageSrc}
          alt={alt}
          className={cn(
            "w-full h-full object-cover transition-opacity duration-300",
            imageState === 'loaded' ? 'opacity-100' : 'opacity-0'
          )}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
        />
      )}

      {/* Error state */}
      {imageState === 'error' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-50 text-gray-400">
          <svg className="w-8 h-8 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span className="text-xs">Image unavailable</span>
        </div>
      )}
    </div>
  );
};

export default MobileOptimizedImage;
