import React, { useState, useRef, useEffect, memo } from "react";
import { cn } from "@/lib/utils";
import { useIntersectionObserver } from "@/hooks/useIntersectionObserver";
import { createOptimizedImageSrc } from "@/utils/lazyLoading";

interface OptimizedImageProps {
  src: string;
  alt: string;
  className?: string;
  aspectRatio?: "square" | "portrait" | "wide";
  priority?: boolean;
  sizes?: string;
  quality?: number;
  onLoad?: () => void;
  onError?: () => void;
}

const OptimizedImage: React.FC<OptimizedImageProps> = memo(({
  src,
  alt,
  className,
  aspectRatio = "square",
  priority = false,
  sizes = "300px",
  quality = 75,
  onLoad,
  onError
}) => {
  const [imageState, setImageState] = useState<'loading' | 'loaded' | 'error'>('loading');
  const [currentSrc, setCurrentSrc] = useState<string>('');
  const imgRef = useRef<HTMLImageElement>(null);
  
  const { ref: intersectionRef, isIntersecting } = useIntersectionObserver({
    threshold: 0.1,
    rootMargin: '100px', // Increased for better preloading
    freezeOnceVisible: true,
    initialIsIntersecting: priority
  });

  // Optimize image src
  const optimizedSrc = createOptimizedImageSrc(src, {
    width: 300,
    height: aspectRatio === "portrait" ? 400 : aspectRatio === "wide" ? 200 : 300,
    quality,
    format: 'webp'
  });

  useEffect(() => {
    if ((isIntersecting || priority) && !currentSrc && src) {
      // Create image preloader for better performance
      const img = new Image();
      
      img.onload = () => {
        setCurrentSrc(optimizedSrc);
        setImageState('loaded');
        onLoad?.();
      };
      
      img.onerror = () => {
        // Fallback to original src if optimized fails
        const fallbackImg = new Image();
        fallbackImg.onload = () => {
          setCurrentSrc(src);
          setImageState('loaded');
          onLoad?.();
        };
        fallbackImg.onerror = () => {
          setImageState('error');
          onError?.();
        };
        fallbackImg.src = src;
      };
      
      img.src = optimizedSrc;
    }
  }, [isIntersecting, priority, src, optimizedSrc, currentSrc, onLoad, onError]);

  const getAspectRatioClass = () => {
    switch (aspectRatio) {
      case "portrait": return "aspect-[3/4]";
      case "wide": return "aspect-[16/9]";
      case "square":
      default: return "aspect-square";
    }
  };

  // Combine refs efficiently
  const setRefs = (element: HTMLImageElement | null) => {
    imgRef.current = element;
    intersectionRef.current = element;
  };

  return (
    <div className={cn(
      "relative overflow-hidden bg-muted/40 rounded-lg",
      getAspectRatioClass(),
      className
    )}>
      {/* Optimized loading skeleton */}
      {imageState === 'loading' && (
        <div className="absolute inset-0 bg-gradient-to-br from-muted/60 via-muted/40 to-muted/60 animate-pulse" />
      )}

      {/* Main image with optimizations */}
      {currentSrc && imageState === 'loaded' && (
        <img
          ref={setRefs}
          src={currentSrc}
          alt={alt}
          className="w-full h-full object-cover transition-opacity duration-300"
          loading={priority ? 'eager' : 'lazy'}
          sizes={sizes}
          style={{ imageRendering: 'crisp-edges' }}
        />
      )}

      {/* Error state */}
      {imageState === 'error' && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-muted/20 text-muted-foreground">
          <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span className="text-xs">No image</span>
        </div>
      )}
    </div>
  );
});

OptimizedImage.displayName = "OptimizedImage";

export default OptimizedImage;