import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

interface SwipeGesturesProps {
  children: React.ReactNode;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  enableQuickActions?: boolean;
  className?: string;
}

const MobileSwipeGestures: React.FC<SwipeGesturesProps> = ({
  children,
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
  onSwipeDown,
  enableQuickActions = true,
  className
}) => {
  const navigate = useNavigate();
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null);
  const [touchEnd, setTouchEnd] = useState<{ x: number; y: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart({
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY
    });
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd({
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY
    });
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;

    const distanceX = touchStart.x - touchEnd.x;
    const distanceY = touchStart.y - touchEnd.y;
    const isLeftSwipe = distanceX > minSwipeDistance;
    const isRightSwipe = distanceX < -minSwipeDistance;
    const isUpSwipe = distanceY > minSwipeDistance;
    const isDownSwipe = distanceY < -minSwipeDistance;

    // Handle horizontal swipes
    if (Math.abs(distanceX) > Math.abs(distanceY)) {
      if (isLeftSwipe) {
        if (onSwipeLeft) {
          onSwipeLeft();
        } else if (enableQuickActions) {
          handleDefaultSwipeLeft();
        }
      }
      if (isRightSwipe) {
        if (onSwipeRight) {
          onSwipeRight();
        } else if (enableQuickActions) {
          handleDefaultSwipeRight();
        }
      }
    }
    // Handle vertical swipes
    else {
      if (isUpSwipe) {
        if (onSwipeUp) {
          onSwipeUp();
        } else if (enableQuickActions) {
          handleDefaultSwipeUp();
        }
      }
      if (isDownSwipe) {
        if (onSwipeDown) {
          onSwipeDown();
        } else if (enableQuickActions) {
          handleDefaultSwipeDown();
        }
      }
    }
  };

  const handleDefaultSwipeLeft = () => {
    // Navigate to cart
    navigate('/cart');
  };

  const handleDefaultSwipeRight = () => {
    // Go back in history
    window.history.back();
  };

  const handleDefaultSwipeUp = () => {
    // Show quick actions
    const quickActions = document.querySelector('[data-quick-actions]');
    quickActions?.classList.remove('hidden');
  };

  const handleDefaultSwipeDown = () => {
    // Hide quick actions or scroll to top
    const quickActions = document.querySelector('[data-quick-actions]');
    if (quickActions && !quickActions.classList.contains('hidden')) {
      quickActions.classList.add('hidden');
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div
      ref={containerRef}
      className={cn("touch-pan-x touch-pan-y", className)}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      style={{ touchAction: 'pan-y pinch-zoom' }} // Allow vertical scroll, prevent horizontal blocking
    >
      {children}
    </div>
  );
};

export default MobileSwipeGestures;