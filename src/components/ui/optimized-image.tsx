
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
  ...props
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState(false);
  const [currentSrc, setCurrentSrc] = useState<string>('');
  const imgRef = useRef<HTMLImageElement>(null);
  
  const { ref: intersectionRef, isIntersecting } = useIntersectionObserver({
    threshold: 0.1,
    freezeOnceVisible: true,
    initialIsIntersecting: priority
  });

  // Generate optimized image URLs with WebP support
  const generateSrcSet = (baseSrc: string) => {
    if (!baseSrc.includes('unsplash.com')) {
      return baseSrc;
    }

    const params = new URLSearchParams();
    if (quality) params.set('q', quality.toString());
    params.set('auto', 'format');
    
    const webpUrl = `${baseSrc}?${params.toString()}&fm=webp`;
    const jpgUrl = `${baseSrc}?${params.toString()}&fm=jpg`;
    
    return `${webpUrl} 1x, ${jpgUrl} 1x`;
  };

  const generateSizes = () => {
    if (width) {
      return `${width}px`;
    }
    return '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw';
  };

  useEffect(() => {
    if (isIntersecting || priority) {
      setCurrentSrc(src);
    }
  }, [isIntersecting, priority, src]);

  const handleLoad = () => {
    setIsLoaded(true);
    setError(false);
  };

  const handleError = () => {
    setError(true);
    setCurrentSrc('/placeholder.svg');
  };

  // Combine refs for intersection observer and image element
  const setRefs = (element: HTMLImageElement | null) => {
    imgRef.current = element;
    intersectionRef.current = element;
  };

  return (
    <div className={cn('relative overflow-hidden', className)}>
      {currentSrc && (
        <img
          ref={setRefs}
          src={currentSrc}
          srcSet={generateSrcSet(currentSrc)}
          sizes={generateSizes()}
          alt={alt}
          width={width}
          height={height}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
          onLoad={handleLoad}
          onError={handleError}
          className={cn(
            'transition-opacity duration-300',
            isLoaded ? 'opacity-100' : 'opacity-0',
            blur && !isLoaded && 'blur-sm',
            'w-full h-full object-cover'
          )}
          {...props}
        />
      )}
      
      {/* Loading placeholder */}
      {!isLoaded && !error && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
        </div>
      )}
      
      {/* Error state */}
      {error && (
        <div className="absolute inset-0 bg-gray-100 flex items-center justify-center text-gray-400">
          <span className="text-sm">Failed to load image</span>
        </div>
      )}
    </div>
  );
};

export default OptimizedImage;
