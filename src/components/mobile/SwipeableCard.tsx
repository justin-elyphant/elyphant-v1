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
  const [isHorizontalSwipe, setIsHorizontalSwipe] = useState<boolean | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (disabled) return;
    
    const touch = e.touches[0];
    setStartX(touch.clientX);
    setStartY(touch.clientY);
    setIsDragging(true);
    setIsHorizontalSwipe(null); // Reset direction detection
  }, [disabled]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (disabled || startX === null || startY === null) return;
    
    const touch = e.touches[0];
    const deltaX = touch.clientX - startX;
    const deltaY = touch.clientY - startY;
    
    // Detect direction only after a minimum threshold (10px) to avoid false positives
    const MIN_DETECTION_THRESHOLD = 10;
    
    if (isHorizontalSwipe === null) {
      // Haven't determined direction yet
      if (Math.abs(deltaX) > MIN_DETECTION_THRESHOLD || Math.abs(deltaY) > MIN_DETECTION_THRESHOLD) {
        // Lock in direction based on which axis has more movement
        setIsHorizontalSwipe(Math.abs(deltaX) > Math.abs(deltaY));
      }
      return; // Don't move the card until direction is determined
    }
    
    // If vertical swipe detected, let it scroll normally
    if (!isHorizontalSwipe) {
      return;
    }
    
    // Only prevent default for confirmed horizontal swipes
    if (e.cancelable) {
      e.preventDefault();
    }
    setCurrentX(deltaX);
  }, [disabled, startX, startY, isHorizontalSwipe]);

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
    setIsHorizontalSwipe(null);
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