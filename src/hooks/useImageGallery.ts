import { useState, useEffect, useCallback } from 'react';

interface UseImageGalleryProps {
  images: string[];
  initialIndex?: number;
  isOpen?: boolean;
}

export const useImageGallery = ({ 
  images, 
  initialIndex = 0, 
  isOpen = false 
}: UseImageGalleryProps) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  // Reset index when images change or modal opens
  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(Math.max(0, Math.min(initialIndex, images.length - 1)));
    }
  }, [initialIndex, images.length, isOpen]);

  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % images.length);
  }, [images.length]);

  const goToPrevious = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  }, [images.length]);

  const goToIndex = useCallback((index: number) => {
    if (index >= 0 && index < images.length) {
      setCurrentIndex(index);
    }
  }, [images.length]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          goToPrevious();
          break;
        case 'ArrowRight':
          e.preventDefault();
          goToNext();
          break;
        case 'Escape':
          e.preventDefault();
          // The escape handling will be managed by the modal component
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, goToNext, goToPrevious]);

  return {
    currentIndex,
    currentImage: images[currentIndex],
    goToNext,
    goToPrevious,
    goToIndex,
    hasNext: currentIndex < images.length - 1,
    hasPrevious: currentIndex > 0,
    totalImages: images.length
  };
};