import { useState, useEffect, useCallback, useRef } from 'react';
import { usePerformanceMonitoring } from '@/hooks/usePerformanceMonitoring';

interface ProgressiveLoadingOptions {
  immediateLoadCount?: number;
  batchSize?: number;
  loadDelay?: number;
  enablePerformanceTracking?: boolean;
}

interface LoadingState {
  loadedItems: Set<string>;
  loadingItems: Set<string>;
  erroredItems: Set<string>;
  totalLoadTime: number;
  averageLoadTime: number;
}

export const useProgressiveLoading = (
  items: string[],
  loadFunction: (item: string) => Promise<any>,
  options: ProgressiveLoadingOptions = {}
) => {
  const {
    immediateLoadCount = 2,
    batchSize = 1,
    loadDelay = 100,
    enablePerformanceTracking = true
  } = options;

  const [loadingState, setLoadingState] = useState<LoadingState>({
    loadedItems: new Set(),
    loadingItems: new Set(),
    erroredItems: new Set(),
    totalLoadTime: 0,
    averageLoadTime: 0
  });

  const { startTimer, endTimer } = usePerformanceMonitoring();
  const loadTimesRef = useRef<number[]>([]);

  // Load item with performance tracking
  const loadItem = useCallback(async (item: string) => {
    if (loadingState.loadedItems.has(item) || loadingState.loadingItems.has(item)) {
      return;
    }

    setLoadingState(prev => ({
      ...prev,
      loadingItems: new Set([...prev.loadingItems, item])
    }));

    try {
      const startTime = performance.now();
      if (enablePerformanceTracking) {
        startTimer(`progressive-load-${item}`);
      }

      await loadFunction(item);
      
      const endTime = performance.now();
      const loadTime = endTime - startTime;
      loadTimesRef.current.push(loadTime);

      if (enablePerformanceTracking) {
        endTimer(`progressive-load-${item}`, 'searchTime');
      }

      setLoadingState(prev => {
        const newLoadedItems = new Set([...prev.loadedItems, item]);
        const newLoadingItems = new Set(prev.loadingItems);
        newLoadingItems.delete(item);

        const totalTime = loadTimesRef.current.reduce((sum, time) => sum + time, 0);
        const averageTime = totalTime / loadTimesRef.current.length;

        return {
          ...prev,
          loadedItems: newLoadedItems,
          loadingItems: newLoadingItems,
          totalLoadTime: totalTime,
          averageLoadTime: averageTime
        };
      });

    } catch (error) {
      console.error(`Failed to load item: ${item}`, error);
      
      setLoadingState(prev => {
        const newErroredItems = new Set([...prev.erroredItems, item]);
        const newLoadingItems = new Set(prev.loadingItems);
        newLoadingItems.delete(item);

        return {
          ...prev,
          loadingItems: newLoadingItems,
          erroredItems: newErroredItems
        };
      });
    }
  }, [loadFunction, enablePerformanceTracking, startTimer, endTimer, loadingState.loadedItems, loadingState.loadingItems]);

  // Load immediate items on mount
  useEffect(() => {
    const immediateItems = items.slice(0, immediateLoadCount);
    immediateItems.forEach(item => {
      loadItem(item);
    });
  }, [items, immediateLoadCount, loadItem]);

  // Progressive loading stats
  const getProgressiveStats = useCallback(() => {
    const totalItems = items.length;
    const loadedCount = loadingState.loadedItems.size;
    const loadingCount = loadingState.loadingItems.size;
    const erroredCount = loadingState.erroredItems.size;
    const pendingCount = totalItems - loadedCount - loadingCount - erroredCount;

    return {
      totalItems,
      loadedCount,
      loadingCount,
      erroredCount,
      pendingCount,
      progressPercentage: (loadedCount / totalItems) * 100,
      averageLoadTime: loadingState.averageLoadTime,
      totalLoadTime: loadingState.totalLoadTime
    };
  }, [items.length, loadingState]);

  return {
    loadingState,
    loadItem,
    getProgressiveStats,
    isItemLoaded: (item: string) => loadingState.loadedItems.has(item),
    isItemLoading: (item: string) => loadingState.loadingItems.has(item),
    isItemErrored: (item: string) => loadingState.erroredItems.has(item)
  };
};