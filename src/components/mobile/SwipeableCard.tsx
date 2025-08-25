import React, { useState, useRef, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface SwipeableCardProps {
  children: React.ReactNode;
  className?: string;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  swipeThreshold?: number;
  disabled?: boolean;
}

export const SwipeableCard: React.FC<SwipeableCardProps> = ({
  children,
  className,
  onSwipeLeft,
  onSwipeRight,
  swipeThreshold = 100,
  disabled = false,
}) => {
  const [startX, setStartX] = useState<number | null>(null);
  const [startY, setStartY] = useState<number | null>(null);
  const [currentX, setCurrentX] = useState<number>(0);
  const [isDragging, setIsDragging] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (disabled) return;
    
    const touch = e.touches[0];
    setStartX(touch.clientX);
    setStartY(touch.clientY);
    setIsDragging(true);
  }, [disabled]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (disabled || startX === null || startY === null) return;
    
    const touch = e.touches[0];
    const deltaX = touch.clientX - startX;
    const deltaY = touch.clientY - startY;
    
    // Only handle horizontal swipes (ignore vertical scrolling)
    if (Math.abs(deltaY) > Math.abs(deltaX)) {
      return;
    }
    
    e.preventDefault(); // Prevent scrolling when swiping horizontally
    setCurrentX(deltaX);
  }, [disabled, startX, startY]);

  const handleTouchEnd = useCallback(() => {
    if (disabled || startX === null) return;
    
    setIsDragging(false);
    
    // Determine if swipe threshold was met
    if (Math.abs(currentX) > swipeThreshold) {
      if (currentX > 0 && onSwipeRight) {
        onSwipeRight();
      } else if (currentX < 0 && onSwipeLeft) {
        onSwipeLeft();
      }
    }
    
    // Reset position
    setStartX(null);
    setStartY(null);
    setCurrentX(0);
  }, [disabled, startX, currentX, swipeThreshold, onSwipeLeft, onSwipeRight]);

  const transform = isDragging ? `translateX(${currentX * 0.3}px)` : 'translateX(0px)';
  const opacity = isDragging ? Math.max(0.7, 1 - Math.abs(currentX) / 200) : 1;

  return (
    <Card
      ref={cardRef}
      className={cn(
        'transition-all duration-200 touch-manipulation',
        isDragging && 'transition-none',
        className
      )}
      style={{
        transform,
        opacity,
      }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {children}
    </Card>
  );
};