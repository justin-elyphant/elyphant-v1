import { useState, useEffect, useRef, useCallback } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';

interface TouchInteractionConfig {
  tapDelay: number;
  swipeThreshold: number;
  scrollThreshold: number;
  preventDefaultScroll: boolean;
}

interface TouchGesture {
  type: 'tap' | 'swipe' | 'scroll';
  direction?: 'up' | 'down' | 'left' | 'right';
  deltaX: number;
  deltaY: number;
  duration: number;
}

const DEFAULT_CONFIG: TouchInteractionConfig = {
  tapDelay: 300,
  swipeThreshold: 50,
  scrollThreshold: 10,
  preventDefaultScroll: false
};

export const useOptimizedTouchInteractions = (
  elementRef: React.RefObject<HTMLElement>,
  config: Partial<TouchInteractionConfig> = {}
) => {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  const isMobile = useIsMobile();
  
  const [gesture, setGesture] = useState<TouchGesture | null>(null);
  const [isInteracting, setIsInteracting] = useState(false);
  
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const touchMoveRef = useRef<{ x: number; y: number } | null>(null);
  const tapTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastTapRef = useRef<number>(0);
  const scrollVelocityRef = useRef<number>(0);
  const rafRef = useRef<number | null>(null);

  // Optimized touch start handler
  const handleTouchStart = useCallback((event: TouchEvent) => {
    if (!isMobile) return;
    
    const touch = event.touches[0];
    touchStartRef.current = {
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now()
    };
    
    setIsInteracting(true);
    
    // Clear any pending tap timeout
    if (tapTimeoutRef.current) {
      clearTimeout(tapTimeoutRef.current);
      tapTimeoutRef.current = null;
    }
    
    // Prevent zoom on double tap
    const now = Date.now();
    if (now - lastTapRef.current < 300) {
      event.preventDefault();
    }
    lastTapRef.current = now;
  }, [isMobile]);

  // Optimized touch move handler with velocity tracking
  const handleTouchMove = useCallback((event: TouchEvent) => {
    if (!touchStartRef.current || !isMobile) return;
    
    const touch = event.touches[0];
    const deltaX = touch.clientX - touchStartRef.current.x;
    const deltaY = touch.clientY - touchStartRef.current.y;
    
    touchMoveRef.current = { x: touch.clientX, y: touch.clientY };
    
    // Calculate scroll velocity for momentum
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    const time = Date.now() - touchStartRef.current.time;
    scrollVelocityRef.current = distance / Math.max(time, 1);
    
    // Prevent scroll bounce if configured
    if (finalConfig.preventDefaultScroll && Math.abs(deltaY) > finalConfig.scrollThreshold) {
      event.preventDefault();
    }
    
    // Update gesture in real-time for smooth interactions
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
    }
    
    rafRef.current = requestAnimationFrame(() => {
      if (Math.abs(deltaX) > finalConfig.swipeThreshold || Math.abs(deltaY) > finalConfig.swipeThreshold) {
        const direction = Math.abs(deltaX) > Math.abs(deltaY)
          ? deltaX > 0 ? 'right' : 'left'
          : deltaY > 0 ? 'down' : 'up';
        
        setGesture({
          type: 'swipe',
          direction,
          deltaX,
          deltaY,
          duration: time
        });
      } else if (Math.abs(deltaY) > finalConfig.scrollThreshold) {
        setGesture({
          type: 'scroll',
          deltaX,
          deltaY,
          duration: time
        });
      }
    });
  }, [isMobile, finalConfig]);

  // Optimized touch end handler
  const handleTouchEnd = useCallback((event: TouchEvent) => {
    if (!touchStartRef.current || !isMobile) return;
    
    const endTime = Date.now();
    const duration = endTime - touchStartRef.current.time;
    
    // Clean up animation frame
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    
    // Determine final gesture
    if (touchMoveRef.current) {
      const deltaX = touchMoveRef.current.x - touchStartRef.current.x;
      const deltaY = touchMoveRef.current.y - touchStartRef.current.y;
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
      
      if (distance < finalConfig.swipeThreshold && duration < finalConfig.tapDelay) {
        // It's a tap
        setGesture({
          type: 'tap',
          deltaX: 0,
          deltaY: 0,
          duration
        });
      }
    } else if (duration < finalConfig.tapDelay) {
      // Quick tap without movement
      setGesture({
        type: 'tap',
        deltaX: 0,
        deltaY: 0,
        duration
      });
    }
    
    // Reset state
    touchStartRef.current = null;
    touchMoveRef.current = null;
    setIsInteracting(false);
    
    // Clear gesture after a short delay
    setTimeout(() => setGesture(null), 100);
  }, [isMobile, finalConfig]);

  // Passive event listeners for better performance
  useEffect(() => {
    const element = elementRef.current;
    if (!element || !isMobile) return;
    
    const options: AddEventListenerOptions = { 
      passive: !finalConfig.preventDefaultScroll,
      capture: false
    };
    
    element.addEventListener('touchstart', handleTouchStart, options);
    element.addEventListener('touchmove', handleTouchMove, options);
    element.addEventListener('touchend', handleTouchEnd, options);
    
    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
      
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
      
      if (tapTimeoutRef.current) {
        clearTimeout(tapTimeoutRef.current);
      }
    };
  }, [elementRef, isMobile, handleTouchStart, handleTouchMove, handleTouchEnd, finalConfig]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
      if (tapTimeoutRef.current) {
        clearTimeout(tapTimeoutRef.current);
      }
    };
  }, []);

  return {
    gesture,
    isInteracting,
    scrollVelocity: scrollVelocityRef.current,
    // Helper methods
    isTap: gesture?.type === 'tap',
    isSwipe: gesture?.type === 'swipe',
    isScroll: gesture?.type === 'scroll',
    swipeDirection: gesture?.direction,
  };
};