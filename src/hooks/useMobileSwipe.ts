import { useState, useRef, useCallback } from 'react';

interface SwipeOptions {
  threshold?: number;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  preventDefaultTouch?: boolean;
}

export const useMobileSwipe = (options: SwipeOptions = {}) => {
  const {
    threshold = 50,
    onSwipeLeft,
    onSwipeRight,
    onSwipeUp,
    onSwipeDown,
    preventDefaultTouch = false,
  } = options;

  const [startPosition, setStartPosition] = useState<{ x: number; y: number } | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const elementRef = useRef<HTMLElement>(null);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    const touch = e.touches[0];
    setStartPosition({ x: touch.clientX, y: touch.clientY });
    setIsTracking(true);
  }, []);

  const handleTouchMove = useCallback((_e: TouchEvent) => {
    // NOTE: We no longer call e.preventDefault() here as it blocks native scrolling
    // and causes screen freezes on iOS Safari. Passive listeners are now used.
  }, []);

  const handleTouchEnd = useCallback((e: TouchEvent) => {
    if (!startPosition || !isTracking) return;

    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - startPosition.x;
    const deltaY = touch.clientY - startPosition.y;
    
    const absDeltaX = Math.abs(deltaX);
    const absDeltaY = Math.abs(deltaY);
    
    // Determine if this is a swipe gesture
    if (Math.max(absDeltaX, absDeltaY) < threshold) {
      setStartPosition(null);
      setIsTracking(false);
      return;
    }
    
    // Determine swipe direction
    if (absDeltaX > absDeltaY) {
      // Horizontal swipe
      if (deltaX > 0 && onSwipeRight) {
        onSwipeRight();
      } else if (deltaX < 0 && onSwipeLeft) {
        onSwipeLeft();
      }
    } else {
      // Vertical swipe
      if (deltaY > 0 && onSwipeDown) {
        onSwipeDown();
      } else if (deltaY < 0 && onSwipeUp) {
        onSwipeUp();
      }
    }
    
    setStartPosition(null);
    setIsTracking(false);
  }, [startPosition, isTracking, threshold, onSwipeLeft, onSwipeRight, onSwipeUp, onSwipeDown]);

  const bindSwipeEvents = useCallback(() => {
    const element = elementRef.current;
    if (!element) return;

    // Use passive listeners to prevent blocking the browser's scroll thread
    element.addEventListener('touchstart', handleTouchStart, { passive: true });
    element.addEventListener('touchmove', handleTouchMove, { passive: true });
    element.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);

  return {
    elementRef,
    bindSwipeEvents,
    isTracking,
  };
};