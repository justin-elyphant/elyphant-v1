import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { X, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MobileBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  snapPoints?: number[]; // Percentages of screen height
  initialSnapPoint?: number;
  showHandle?: boolean;
}

export const MobileBottomSheet: React.FC<MobileBottomSheetProps> = ({
  isOpen,
  onClose,
  title,
  children,
  snapPoints = [30, 70, 95],
  initialSnapPoint = 1,
  showHandle = true,
}) => {
  const [currentSnapPoint, setCurrentSnapPoint] = useState(initialSnapPoint);
  const [isDragging, setIsDragging] = useState(false);
  const [startY, setStartY] = useState<number | null>(null);
  const [currentY, setCurrentY] = useState(0);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const handleTouchStart = (e: React.TouchEvent) => {
    setStartY(e.touches[0].clientY);
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (startY === null) return;
    
    const deltaY = e.touches[0].clientY - startY;
    setCurrentY(deltaY);
  };

  const handleTouchEnd = () => {
    if (startY === null) return;
    
    setIsDragging(false);
    
    // Snap to closest snap point or close if dragged down significantly
    if (currentY > 100) {
      if (currentSnapPoint > 0) {
        setCurrentSnapPoint(currentSnapPoint - 1);
      } else {
        onClose();
      }
    } else if (currentY < -100) {
      if (currentSnapPoint < snapPoints.length - 1) {
        setCurrentSnapPoint(currentSnapPoint + 1);
      }
    }
    
    setStartY(null);
    setCurrentY(0);
  };

  if (!isOpen) return null;

  const heightPercent = snapPoints[currentSnapPoint];
  const translateY = isDragging ? Math.max(0, currentY) : 0;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50"
        onClick={onClose}
      />
      
      {/* Bottom Sheet */}
      <div 
        className={cn(
          "fixed bottom-0 left-0 right-0 bg-card border-t border-border rounded-t-lg z-50",
          "transition-all duration-300 ease-out",
          isDragging && "transition-none"
        )}
        style={{
          height: `${heightPercent}vh`,
          transform: `translateY(${translateY}px)`,
        }}
      >
        {/* Handle */}
        {showHandle && (
          <div 
            className="w-full py-3 px-4 cursor-grab active:cursor-grabbing touch-manipulation"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <div className="w-12 h-1 bg-muted-foreground/40 rounded-full mx-auto" />
          </div>
        )}
        
        {/* Header */}
        {title && (
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <h2 className="text-lg font-semibold">{title}</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0 touch-target-44"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}
        
        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 pb-safe">
          {children}
        </div>
        
        {/* Snap Point Indicator */}
        <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col gap-1">
          {snapPoints.map((_, index) => (
            <div
              key={index}
              className={cn(
                "w-1 h-4 rounded-full transition-colors",
                index === currentSnapPoint ? "bg-primary" : "bg-muted"
              )}
            />
          ))}
        </div>
      </div>
    </>
  );
};