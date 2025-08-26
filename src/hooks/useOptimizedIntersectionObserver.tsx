import { useEffect, useRef, useCallback, useState } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';

interface IntersectionObserverConfig {
  threshold?: number | number[];
  rootMargin?: string;
  triggerOnce?: boolean;
}

interface VisibilityState {
  isVisible: boolean;
  isIntersecting: boolean;
  intersectionRatio: number;
  entry?: IntersectionObserverEntry;
}

const DEFAULT_CONFIG: IntersectionObserverConfig = {
  threshold: [0, 0.25, 0.5, 0.75, 1],
  rootMargin: '50px',
  triggerOnce: false
};

export const useOptimizedIntersectionObserver = (
  config: IntersectionObserverConfig = {}
) => {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  const isMobile = useIsMobile();
  
  const [visibilityState, setVisibilityState] = useState<VisibilityState>({
    isVisible: false,
    isIntersecting: false,
    intersectionRatio: 0
  });
  
  const elementRef = useRef<HTMLElement | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const hasTriggeredRef = useRef(false);
  
  // Optimized intersection callback with debouncing
  const handleIntersection = useCallback((entries: IntersectionObserverEntry[]) => {
    const entry = entries[0];
    
    // Skip if triggerOnce and already triggered
    if (finalConfig.triggerOnce && hasTriggeredRef.current && !entry.isIntersecting) {
      return;
    }
    
    const newState: VisibilityState = {
      isVisible: entry.intersectionRatio > 0,
      isIntersecting: entry.isIntersecting,
      intersectionRatio: entry.intersectionRatio,
      entry
    };
    
    setVisibilityState(newState);
    
    // Mark as triggered for triggerOnce behavior
    if (entry.isIntersecting && finalConfig.triggerOnce) {
      hasTriggeredRef.current = true;
    }
  }, [finalConfig.triggerOnce]);

  // Create observer with mobile-optimized settings
  const createObserver = useCallback(() => {
    if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
      return null;
    }
    
    // Adjust thresholds for mobile performance
    const mobileConfig = isMobile ? {
      ...finalConfig,
      threshold: typeof finalConfig.threshold === 'number' 
        ? finalConfig.threshold 
        : [0, 0.5, 1], // Fewer thresholds on mobile
      rootMargin: '100px' // Larger margin on mobile for better UX
    } : finalConfig;
    
    return new IntersectionObserver(handleIntersection, {
      threshold: mobileConfig.threshold,
      rootMargin: mobileConfig.rootMargin
    });
  }, [finalConfig, isMobile, handleIntersection]);

  // Observe element
  const observe = useCallback((element: HTMLElement | null) => {
    // Clean up previous observer
    if (observerRef.current) {
      observerRef.current.disconnect();
    }
    
    if (!element) {
      elementRef.current = null;
      return;
    }
    
    elementRef.current = element;
    observerRef.current = createObserver();
    
    if (observerRef.current) {
      observerRef.current.observe(element);
    }
  }, [createObserver]);

  // Unobserve element
  const unobserve = useCallback(() => {
    if (observerRef.current && elementRef.current) {
      observerRef.current.unobserve(elementRef.current);
    }
  }, []);

  // Disconnect observer
  const disconnect = useCallback(() => {
    if (observerRef.current) {
      observerRef.current.disconnect();
      observerRef.current = null;
    }
    elementRef.current = null;
    hasTriggeredRef.current = false;
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  // Re-create observer when config changes
  useEffect(() => {
    if (elementRef.current) {
      const element = elementRef.current;
      disconnect();
      observe(element);
    }
  }, [finalConfig, isMobile, observe, disconnect]);

  return {
    ...visibilityState,
    observe,
    unobserve,
    disconnect,
    // Convenience methods
    ref: observe, // Can be used directly as ref callback
    isFullyVisible: visibilityState.intersectionRatio === 1,
    isPartiallyVisible: visibilityState.intersectionRatio > 0 && visibilityState.intersectionRatio < 1,
    visibilityPercentage: Math.round(visibilityState.intersectionRatio * 100)
  };
};