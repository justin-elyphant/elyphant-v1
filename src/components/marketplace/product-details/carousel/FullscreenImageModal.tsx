import React, { useEffect, useState, useRef } from 'react';
import { X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useImageGallery } from '@/hooks/useImageGallery';
import { useIsMobile } from '@/hooks/use-mobile';
import { getHighResAmazonImage } from '@/utils/amazonImageOptimizer';

interface FullscreenImageModalProps {
  images: string[];
  initialIndex: number;
  isOpen: boolean;
  onClose: () => void;
  productName?: string;
}

const FullscreenImageModal = ({
  images,
  initialIndex,
  isOpen,
  onClose,
  productName = "Product"
}: FullscreenImageModalProps) => {
  const isMobile = useIsMobile();
  const [isZoomed, setIsZoomed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const {
    currentIndex,
    currentImage,
    goToNext,
    goToPrevious,
    goToIndex,
    hasNext,
    hasPrevious,
    totalImages
  } = useImageGallery({ images, initialIndex, isOpen });

  // Handle escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Reset zoom and loading when image changes
  useEffect(() => {
    setIsZoomed(false);
    setIsLoading(true);
  }, [currentIndex]);

  // Center scroll container when zoomed
  useEffect(() => {
    if (isZoomed && scrollContainerRef.current) {
      const container = scrollContainerRef.current;
      container.scrollLeft = (container.scrollWidth - container.clientWidth) / 2;
      container.scrollTop = (container.scrollHeight - container.clientHeight) / 2;
    }
  }, [isZoomed]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = 'unset';
      };
    }
  }, [isOpen]);

  // Touch handlers for swipe navigation
  const handleTouchStart = (e: React.TouchEvent) => {
    if (isZoomed) return; // Don't swipe when zoomed
    const touch = e.touches[0];
    setTouchStart({ x: touch.clientX, y: touch.clientY });
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStart || isZoomed) return;

    const touch = e.changedTouches[0];
    const deltaX = touchStart.x - touch.clientX;
    const deltaY = Math.abs(touchStart.y - touch.clientY);
    
    // Only handle horizontal swipes (not vertical scrolls)
    if (Math.abs(deltaX) > 50 && deltaY < 100) {
      if (deltaX > 0 && hasNext) {
        goToNext();
      } else if (deltaX < 0 && hasPrevious) {
        goToPrevious();
      }
    }
    
    setTouchStart(null);
  };

  const handleImageClick = () => {
    setIsZoomed(!isZoomed);
  };

  const handleImageLoad = () => {
    setIsLoading(false);
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/95 backdrop-blur-sm flex flex-col"
      style={{ 
        paddingTop: 'env(safe-area-inset-top)', 
        paddingBottom: 'env(safe-area-inset-bottom)' 
      }}
      onClick={onClose}
    >
      {/* Header - Always visible with strong contrast */}
      <div className="relative z-20 flex items-center justify-between p-4 bg-gradient-to-b from-black/70 via-black/40 to-transparent">
        <div className="text-white min-w-0 flex-1">
          <h3 className="text-heading-4 truncate max-w-[70vw]">{productName}</h3>
          {totalImages > 1 && (
            <p className="text-body-sm text-white/70">
              {currentIndex + 1} of {totalImages}
            </p>
          )}
        </div>
        
        <div className="flex items-center gap-2 flex-shrink-0">
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.stopPropagation();
              setIsZoomed(!isZoomed);
            }}
            className="text-white hover:bg-white/20 h-11 w-11"
          >
            {isZoomed ? <ZoomOut className="h-5 w-5" /> : <ZoomIn className="h-5 w-5" />}
          </Button>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="text-white hover:bg-white/20 h-11 w-11"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Main Image Container - Viewport constrained */}
      <div 
        className="flex-1 relative flex items-center justify-center px-4 md:px-16"
        onClick={(e) => e.stopPropagation()}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* Loading State */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center z-10">
            <div className="animate-pulse bg-white/10 rounded-lg w-64 h-64 md:w-96 md:h-96" />
          </div>
        )}

        {/* Scrollable container for zoom */}
        <div 
          ref={scrollContainerRef}
          className={`relative ${
            isZoomed 
              ? 'overflow-auto w-full h-full cursor-grab active:cursor-grabbing' 
              : 'overflow-hidden flex items-center justify-center'
          }`}
          style={{ maxHeight: 'calc(100vh - 12rem)' }}
        >
          <img
            src={getHighResAmazonImage(currentImage, 'fullscreen')}
            alt={`${productName} - Image ${currentIndex + 1}`}
            className={`transition-all duration-300 ${
              isLoading ? 'opacity-0' : 'opacity-100'
            } ${
              isZoomed 
                ? 'w-[200%] max-w-none' 
                : 'max-w-full max-h-[calc(100vh-12rem)] object-contain cursor-zoom-in'
            }`}
            onClick={handleImageClick}
            onLoad={handleImageLoad}
            onError={(e) => {
              console.error(`Fullscreen image failed to load:`, currentImage);
              e.currentTarget.src = "/placeholder.svg";
              setIsLoading(false);
            }}
          />
        </div>

        {/* Navigation Arrows - 44px+ touch targets */}
        {totalImages > 1 && (
          <>
            {hasPrevious && (
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => {
                  e.stopPropagation();
                  goToPrevious();
                }}
                className="absolute left-2 md:left-4 top-1/2 -translate-y-1/2 text-white bg-black/40 hover:bg-black/60 h-12 w-12 md:h-14 md:w-14 rounded-full"
              >
                <ChevronLeft className="h-6 w-6 md:h-8 md:w-8" />
              </Button>
            )}
            
            {hasNext && (
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => {
                  e.stopPropagation();
                  goToNext();
                }}
                className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 text-white bg-black/40 hover:bg-black/60 h-12 w-12 md:h-14 md:w-14 rounded-full"
              >
                <ChevronRight className="h-6 w-6 md:h-8 md:w-8" />
              </Button>
            )}
          </>
        )}
      </div>

      {/* Bottom Thumbnail Strip - Monochromatic styling */}
      {totalImages > 1 && (
        <div className="relative z-20 bg-gradient-to-t from-black/70 via-black/40 to-transparent">
          <div className="flex justify-center gap-2 p-4 overflow-x-auto">
            {images.map((img, index) => (
              <button
                key={index}
                onClick={(e) => {
                  e.stopPropagation();
                  goToIndex(index);
                }}
                className={`flex-shrink-0 w-14 h-14 md:w-16 md:h-16 rounded border-2 transition-all ${
                  index === currentIndex
                    ? 'border-white'
                    : 'border-white/30 hover:border-white/60'
                }`}
              >
                <img
                  src={getHighResAmazonImage(img, 'thumbnail')}
                  alt={`${productName} thumbnail ${index + 1}`}
                  className="w-full h-full object-cover rounded"
                  onError={(e) => {
                    e.currentTarget.src = "/placeholder.svg";
                  }}
                />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default FullscreenImageModal;
