
import { useState, useEffect, useCallback, useMemo } from 'react';

interface UseVirtualScrollOptions {
  itemHeight: number;
  containerHeight: number;
  overscan?: number;
  scrollElement?: HTMLElement | null;
}

interface VirtualScrollReturn<T> {
  virtualItems: Array<{
    index: number;
    start: number;
    end: number;
    item: T;
  }>;
  totalHeight: number;
  scrollElementProps: {
    onScroll: (e: React.UIEvent<HTMLElement>) => void;
    style: React.CSSProperties;
  };
  scrollToIndex: (index: number) => void;
}

export function useVirtualScroll<T>(
  items: T[],
  options: UseVirtualScrollOptions
): VirtualScrollReturn<T> {
  const { itemHeight, containerHeight, overscan = 5, scrollElement } = options;
  const [scrollTop, setScrollTop] = useState(0);
  
  // Calculate visible range
  const visibleRange = useMemo(() => {
    const start = Math.floor(scrollTop / itemHeight);
    const end = Math.min(
      start + Math.ceil(containerHeight / itemHeight),
      items.length
    );
    
    return {
      start: Math.max(0, start - overscan),
      end: Math.min(items.length, end + overscan)
    };
  }, [scrollTop, itemHeight, containerHeight, overscan, items.length]);
  
  // Generate virtual items
  const virtualItems = useMemo(() => {
    const result = [];
    for (let i = visibleRange.start; i < visibleRange.end; i++) {
      result.push({
        index: i,
        start: i * itemHeight,
        end: (i + 1) * itemHeight,
        item: items[i]
      });
    }
    return result;
  }, [visibleRange, itemHeight, items]);
  
  // Total height for scrollbar
  const totalHeight = items.length * itemHeight;
  
  // Scroll handler
  const handleScroll = useCallback((e: React.UIEvent<HTMLElement>) => {
    const target = e.currentTarget;
    setScrollTop(target.scrollTop);
  }, []);
  
  // Scroll to specific index
  const scrollToIndex = useCallback((index: number) => {
    const targetScrollTop = index * itemHeight;
    if (scrollElement) {
      scrollElement.scrollTop = targetScrollTop;
    }
    setScrollTop(targetScrollTop);
  }, [itemHeight, scrollElement]);
  
  // Handle external scroll element
  useEffect(() => {
    if (!scrollElement) return;
    
    const handleExternalScroll = () => {
      setScrollTop(scrollElement.scrollTop);
    };
    
    scrollElement.addEventListener('scroll', handleExternalScroll, { passive: true });
    return () => {
      scrollElement.removeEventListener('scroll', handleExternalScroll);
    };
  }, [scrollElement]);
  
  return {
    virtualItems,
    totalHeight,
    scrollElementProps: {
      onScroll: handleScroll,
      style: {
        height: containerHeight,
        overflow: 'auto',
        position: 'relative'
      }
    },
    scrollToIndex
  };
}

// Hook for infinite scroll with virtual scrolling
export function useVirtualInfiniteScroll<T>(
  items: T[],
  options: UseVirtualScrollOptions & {
    hasNextPage?: boolean;
    isLoading?: boolean;
    onLoadMore?: () => void;
    threshold?: number;
  }
) {
  const { hasNextPage = false, isLoading = false, onLoadMore, threshold = 3 } = options;
  const virtualScroll = useVirtualScroll(items, options);
  
  // Check if we need to load more items
  useEffect(() => {
    if (!hasNextPage || isLoading || !onLoadMore) return;
    
    const { virtualItems } = virtualScroll;
    if (virtualItems.length === 0) return;
    
    // Check if we're near the end
    const lastVisibleIndex = virtualItems[virtualItems.length - 1]?.index ?? 0;
    const shouldLoadMore = items.length - lastVisibleIndex <= threshold;
    
    if (shouldLoadMore) {
      onLoadMore();
    }
  }, [virtualScroll.virtualItems, items.length, hasNextPage, isLoading, onLoadMore, threshold]);
  
  return virtualScroll;
}

// Memory-efficient item cache for complex items
export function useItemCache<T, R>(
  items: T[],
  transformer: (item: T, index: number) => R,
  dependencies: any[] = []
) {
  const [cache] = useState(new Map<string, R>());
  
  // Clear cache when dependencies change
  useEffect(() => {
    cache.clear();
  }, dependencies);
  
  const getCachedItem = useCallback((item: T, index: number): R => {
    const key = `${index}-${JSON.stringify(item)}`;
    
    if (!cache.has(key)) {
      cache.set(key, transformer(item, index));
      
      // Limit cache size to prevent memory leaks
      if (cache.size > 1000) {
        const firstKey = cache.keys().next().value;
        cache.delete(firstKey);
      }
    }
    
    return cache.get(key)!;
  }, [cache, transformer]);
  
  return getCachedItem;
}
