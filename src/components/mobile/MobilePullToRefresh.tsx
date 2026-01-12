import React, { useState, useRef, useCallback } from "react";
import { RefreshCw } from "lucide-react";
import { triggerHapticFeedback } from "@/utils/haptics";

interface MobilePullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: React.ReactNode;
  threshold?: number;
  className?: string;
}

export const MobilePullToRefresh: React.FC<MobilePullToRefreshProps> = ({
  onRefresh,
  children,
  threshold = 80,
  className = ""
}) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [startY, setStartY] = useState(0);
  const [isPulling, setIsPulling] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (containerRef.current && containerRef.current.scrollTop === 0) {
      setStartY(e.touches[0].clientY);
      setIsPulling(true);
    }
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isPulling || isRefreshing) return;

    const currentY = e.touches[0].clientY;
    const distance = Math.max(0, currentY - startY);
    
    if (distance > 0) {
      // Only prevent default when we're actively pulling down with significant distance
      // and the container is at scroll top. This prevents blocking normal scroll.
      const isAtScrollTop = containerRef.current?.scrollTop === 0;
      const isPullGesture = distance > 10 && isAtScrollTop;
      
      if (isPullGesture && e.cancelable) {
        e.preventDefault();
      }
      
      setPullDistance(Math.min(distance * 0.5, threshold * 1.5));
      
      // Haptic feedback when reaching threshold
      if (distance > threshold && pullDistance <= threshold) {
        triggerHapticFeedback('impact');
      }
    }
  }, [isPulling, isRefreshing, startY, threshold, pullDistance]);

  const handleTouchEnd = useCallback(async () => {
    if (!isPulling) return;

    setIsPulling(false);

    if (pullDistance >= threshold && !isRefreshing) {
      setIsRefreshing(true);
      triggerHapticFeedback('success');
      
      try {
        await onRefresh();
      } finally {
        setIsRefreshing(false);
      }
    }
    
    setPullDistance(0);
  }, [isPulling, pullDistance, threshold, isRefreshing, onRefresh]);

  const indicatorOpacity = Math.min(pullDistance / threshold, 1);
  const indicatorRotation = isRefreshing ? 360 : pullDistance * 2;

  return (
    <div 
      ref={containerRef}
      className={`pull-to-refresh relative overflow-auto ${className}`}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{
        transform: `translateY(${Math.min(pullDistance * 0.3, 30)}px)`,
        transition: isPulling ? 'none' : 'transform 0.3s ease-out'
      }}
    >
      {/* Pull to refresh indicator */}
      <div 
        className={`pull-to-refresh-indicator ${
          (pullDistance > 0 || isRefreshing) ? 'active' : ''
        }`}
        style={{
          opacity: Math.max(indicatorOpacity, isRefreshing ? 1 : 0),
          transform: `translateX(-50%) translateY(${isRefreshing ? '20px' : '-60px'})`,
        }}
      >
        <RefreshCw 
          className={`h-5 w-5 text-primary ${isRefreshing ? 'animate-spin' : ''}`}
          style={{
            transform: `rotate(${indicatorRotation}deg)`,
            transition: isRefreshing ? 'none' : 'transform 0.1s ease-out'
          }}
        />
      </div>

      {children}
    </div>
  );
};