import { useState, useEffect, useCallback, useRef } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';

interface PerformanceMetrics {
  searchTime: number;
  renderTime: number;
  bundleSize: number;
  memoryUsage: number;
  cacheHitRate: number;
}

interface PerformanceBudget {
  maxSearchTime: number;
  maxRenderTime: number;
  maxBundleSize: number;
  maxMemoryUsage: number;
  minCacheHitRate: number;
}

// Performance budgets
const DEFAULT_BUDGETS: PerformanceBudget = {
  maxSearchTime: 2000, // 2 seconds
  maxRenderTime: 100, // 100ms
  maxBundleSize: 500 * 1024, // 500KB
  maxMemoryUsage: 50 * 1024 * 1024, // 50MB
  minCacheHitRate: 0.7 // 70%
};

const MOBILE_BUDGETS: PerformanceBudget = {
  maxSearchTime: 3000, // 3 seconds on mobile
  maxRenderTime: 150, // 150ms on mobile
  maxBundleSize: 300 * 1024, // 300KB on mobile
  maxMemoryUsage: 30 * 1024 * 1024, // 30MB on mobile
  minCacheHitRate: 0.6 // 60% on mobile
};

export const usePerformanceMonitoring = () => {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    searchTime: 0,
    renderTime: 0,
    bundleSize: 0,
    memoryUsage: 0,
    cacheHitRate: 0
  });
  
  const [budgetViolations, setBudgetViolations] = useState<string[]>([]);
  const isMobile = useIsMobile();
  const startTimesRef = useRef<Map<string, number>>(new Map());
  const cacheStatsRef = useRef({ hits: 0, misses: 0 });
  
  const budget = isMobile ? MOBILE_BUDGETS : DEFAULT_BUDGETS;

  // Start timing an operation
  const startTimer = useCallback((operationId: string) => {
    startTimesRef.current.set(operationId, performance.now());
  }, []);

  // End timing an operation and update metrics
  const endTimer = useCallback((operationId: string, metricType: keyof PerformanceMetrics) => {
    const startTime = startTimesRef.current.get(operationId);
    if (startTime) {
      const duration = performance.now() - startTime;
      setMetrics(prev => ({
        ...prev,
        [metricType]: duration
      }));
      startTimesRef.current.delete(operationId);
      return duration;
    }
    return 0;
  }, []);

  // Track cache hit/miss
  const trackCacheEvent = useCallback((isHit: boolean) => {
    if (isHit) {
      cacheStatsRef.current.hits++;
    } else {
      cacheStatsRef.current.misses++;
    }
    
    const { hits, misses } = cacheStatsRef.current;
    const total = hits + misses;
    const hitRate = total > 0 ? hits / total : 0;
    
    setMetrics(prev => ({
      ...prev,
      cacheHitRate: hitRate
    }));
  }, []);

  // Monitor memory usage
  const updateMemoryUsage = useCallback(() => {
    if ('memory' in performance) {
      const memInfo = (performance as any).memory;
      setMetrics(prev => ({
        ...prev,
        memoryUsage: memInfo.usedJSHeapSize
      }));
    }
  }, []);

  // Check performance budgets
  const checkBudgets = useCallback(() => {
    const violations: string[] = [];
    
    if (metrics.searchTime > budget.maxSearchTime) {
      violations.push(`Search time (${metrics.searchTime.toFixed(0)}ms) exceeds budget (${budget.maxSearchTime}ms)`);
    }
    
    if (metrics.renderTime > budget.maxRenderTime) {
      violations.push(`Render time (${metrics.renderTime.toFixed(0)}ms) exceeds budget (${budget.maxRenderTime}ms)`);
    }
    
    if (metrics.bundleSize > budget.maxBundleSize) {
      violations.push(`Bundle size (${(metrics.bundleSize / 1024).toFixed(0)}KB) exceeds budget (${(budget.maxBundleSize / 1024).toFixed(0)}KB)`);
    }
    
    if (metrics.memoryUsage > budget.maxMemoryUsage) {
      violations.push(`Memory usage (${(metrics.memoryUsage / 1024 / 1024).toFixed(0)}MB) exceeds budget (${(budget.maxMemoryUsage / 1024 / 1024).toFixed(0)}MB)`);
    }
    
    if (metrics.cacheHitRate < budget.minCacheHitRate) {
      violations.push(`Cache hit rate (${(metrics.cacheHitRate * 100).toFixed(0)}%) below budget (${(budget.minCacheHitRate * 100).toFixed(0)}%)`);
    }
    
    setBudgetViolations(violations);
    
    // Log violations in development
    if (process.env.NODE_ENV === 'development' && violations.length > 0) {
      console.warn('Performance Budget Violations:', violations);
    }
    
    return violations.length === 0;
  }, [metrics, budget]);

  // Get performance report
  const getPerformanceReport = useCallback(() => {
    return {
      metrics,
      budget,
      violations: budgetViolations,
      isBudgetMet: budgetViolations.length === 0,
      recommendations: generateRecommendations()
    };
  }, [metrics, budget, budgetViolations]);

  // Generate performance recommendations
  const generateRecommendations = useCallback(() => {
    const recommendations: string[] = [];
    
    if (metrics.searchTime > budget.maxSearchTime) {
      recommendations.push('Consider implementing search result caching or reducing API payload size');
    }
    
    if (metrics.renderTime > budget.maxRenderTime) {
      recommendations.push('Optimize component rendering with React.memo and useMemo');
    }
    
    if (metrics.cacheHitRate < budget.minCacheHitRate) {
      recommendations.push('Improve cache strategy or increase cache duration');
    }
    
    if (metrics.memoryUsage > budget.maxMemoryUsage) {
      recommendations.push('Review memory leaks and implement cleanup in useEffect');
    }
    
    return recommendations;
  }, [metrics, budget]);

  // Monitor performance metrics periodically
  useEffect(() => {
    const interval = setInterval(() => {
      updateMemoryUsage();
      checkBudgets();
    }, 5000); // Check every 5 seconds
    
    return () => clearInterval(interval);
  }, [updateMemoryUsage, checkBudgets]);

  // Initial memory check
  useEffect(() => {
    updateMemoryUsage();
  }, [updateMemoryUsage]);

  return {
    metrics,
    budget,
    budgetViolations,
    startTimer,
    endTimer,
    trackCacheEvent,
    updateMemoryUsage,
    checkBudgets,
    getPerformanceReport,
    isBudgetMet: budgetViolations.length === 0
  };
};