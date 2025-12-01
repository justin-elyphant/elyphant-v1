import React, { useEffect, useState } from 'react';
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
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null);

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

  // Reset zoom when image changes
  useEffect(() => {
    setIsZoomed(false);
  }, [currentIndex]);

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
    const touch = e.touches[0];
    setTouchStart({ x: touch.clientX, y: touch.clientY });
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStart) return;

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
    if (isMobile) {
      setIsZoomed(!isZoomed);
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/95 backdrop-blur-sm"
      onClick={onClose}
    >
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between p-4 bg-gradient-to-b from-black/50 to-transparent">
        <div className="text-white">
          <h3 className="text-heading-4 truncate max-w-64">{productName}</h3>
          {totalImages > 1 && (
            <p className="text-body-sm text-white/70">
              {currentIndex + 1} of {totalImages}
            </p>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {!isMobile && (
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                setIsZoomed(!isZoomed);
              }}
              className="text-white hover:bg-white/20"
            >
              {isZoomed ? <ZoomOut className="h-5 w-5" /> : <ZoomIn className="h-5 w-5" />}
            </Button>
          )}
          
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="text-white hover:bg-white/20"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Main Image Container */}
      <div 
        className="absolute inset-0 flex items-center justify-center p-4 pt-20 pb-20"
        onClick={(e) => e.stopPropagation()}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <div className="relative max-w-full max-h-full">
          <img
            src={getHighResAmazonImage(currentImage, 'fullscreen')}
            alt={`${productName} - Image ${currentIndex + 1}`}
            className={`max-w-full max-h-full object-contain transition-transform duration-300 ${
              isZoomed ? 'scale-150 cursor-grab' : 'cursor-pointer'
            }`}
            onClick={handleImageClick}
            onError={(e) => {
              console.error(`Fullscreen image failed to load:`, currentImage);
              e.currentTarget.src = "/placeholder.svg";
            }}
          />
        </div>

        {/* Navigation Arrows - Desktop only */}
        {!isMobile && totalImages > 1 && (
          <>
            {hasPrevious && (
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => {
                  e.stopPropagation();
                  goToPrevious();
                }}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20 h-12 w-12"
              >
                <ChevronLeft className="h-8 w-8" />
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
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20 h-12 w-12"
              >
                <ChevronRight className="h-8 w-8" />
              </Button>
            )}
          </>
        )}
      </div>

      {/* Bottom Thumbnail Strip - for multiple images */}
      {totalImages > 1 && (
        <div className="absolute bottom-0 left-0 right-0 z-10 bg-gradient-to-t from-black/50 to-transparent">
          <div className="flex justify-center gap-2 p-4 overflow-x-auto">
            {images.map((img, index) => (
              <button
                key={index}
                onClick={(e) => {
                  e.stopPropagation();
                  goToIndex(index);
                }}
                className={`flex-shrink-0 w-16 h-16 rounded border-2 transition-all ${
                  index === currentIndex
                    ? 'border-primary'
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