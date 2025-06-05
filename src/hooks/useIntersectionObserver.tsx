
import { useEffect, useRef, useState } from 'react';

interface UseIntersectionObserverOptions {
  threshold?: number | number[];
  root?: Element | null;
  rootMargin?: string;
  freezeOnceVisible?: boolean;
  initialIsIntersecting?: boolean;
}

export function useIntersectionObserver(
  options: UseIntersectionObserverOptions = {}
) {
  const {
    threshold = 0.1,
    root = null,
    rootMargin = '0px',
    freezeOnceVisible = false,
    initialIsIntersecting = false
  } = options;

  const [isIntersecting, setIsIntersecting] = useState(initialIsIntersecting);
  const [entry, setEntry] = useState<IntersectionObserverEntry | null>(null);
  const elementRef = useRef<Element | null>(null);

  const frozen = freezeOnceVisible && isIntersecting;

  useEffect(() => {
    const element = elementRef.current;
    const hasIOSupport = !!window.IntersectionObserver;

    if (!hasIOSupport || frozen || !element) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const thresholdArray = Array.isArray(threshold) ? threshold : [threshold];
        
        entries.forEach((entry) => {
          const isIntersecting = thresholdArray.some(
            (t) => entry.intersectionRatio >= t
          );
          
          setIsIntersecting(isIntersecting);
          setEntry(entry);
        });
      },
      {
        threshold,
        root,
        rootMargin
      }
    );

    observer.observe(element);

    return () => {
      observer.unobserve(element);
    };
  }, [elementRef.current, threshold, root, rootMargin, frozen]);

  return {
    ref: elementRef,
    isIntersecting,
    entry
  };
}

// Hook for lazy loading components
export function useLazyLoad<T>(
  loadFn: () => Promise<T>,
  dependencies: any[] = []
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const { ref, isIntersecting } = useIntersectionObserver({
    freezeOnceVisible: true,
    threshold: 0.1
  });

  useEffect(() => {
    if (isIntersecting && !data && !loading) {
      setLoading(true);
      setError(null);
      
      loadFn()
        .then(setData)
        .catch(setError)
        .finally(() => setLoading(false));
    }
  }, [isIntersecting, data, loading, ...dependencies]);

  return {
    ref,
    data,
    loading,
    error,
    isVisible: isIntersecting
  };
}
