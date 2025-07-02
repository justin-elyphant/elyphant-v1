
import React, { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useIntersectionObserver } from "@/hooks/useIntersectionObserver";

interface SimpleMobileImageProps {
  src: string;
  alt: string;
  className?: string;
  aspectRatio?: "square" | "portrait" | "wide";
  priority?: boolean;
  onLoad?: () => void;
  onError?: () => void;
}

const SimpleMobileImage: React.FC<SimpleMobileImageProps> = ({
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
  const imgRef = useRef<HTMLImageElement>(null);
  
  const { ref: intersectionRef, isIntersecting } = useIntersectionObserver({
    threshold: 0.1,
    rootMargin: '50px',
    freezeOnceVisible: true,
    initialIsIntersecting: priority
  });

  // Load image when in viewport or priority
  useEffect(() => {
    if ((isIntersecting || priority) && !imageSrc && src) {
      const img = new Image();
      
      img.onload = () => {
        setImageSrc(src);
        setImageState('loaded');
        onLoad?.();
      };
      
      img.onerror = () => {
        setImageState('error');
        onError?.();
      };
      
      img.src = src;
    }
  }, [isIntersecting, priority, src, imageSrc, onLoad, onError]);

  const getAspectRatioClass = () => {
    switch (aspectRatio) {
      case "portrait": return "aspect-[3/4]";
      case "wide": return "aspect-[16/9]";
      case "square":
      default: return "aspect-square";
    }
  };

  // Combine refs
  const setRefs = (element: HTMLImageElement | null) => {
    imgRef.current = element;
    intersectionRef.current = element;
  };

  return (
    <div className={cn("relative overflow-hidden bg-gray-100", getAspectRatioClass(), className)}>
      {/* Loading skeleton */}
      {imageState === 'loading' && (
        <div className="absolute inset-0 bg-gradient-to-br from-gray-200 via-gray-100 to-gray-200 animate-pulse" />
      )}

      {/* Main image */}
      {imageSrc && imageState === 'loaded' && (
        <img
          ref={setRefs}
          src={imageSrc}
          alt={alt}
          className="w-full h-full object-cover"
          loading={priority ? 'eager' : 'lazy'}
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

export default SimpleMobileImage;
