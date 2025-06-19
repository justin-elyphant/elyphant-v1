
import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { X, ArrowDown } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { triggerHapticFeedback } from "@/utils/haptics";
import NicoleConversationEngine from "@/components/ai/NicoleConversationEngine";

interface MobileConversationModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialQuery?: string;
  onNavigateToResults: (searchQuery: string) => void;
}

const MobileConversationModal: React.FC<MobileConversationModalProps> = ({
  isOpen,
  onClose,
  initialQuery,
  onNavigateToResults
}) => {
  const isMobile = useIsMobile();
  const [isVisible, setIsVisible] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [startY, setStartY] = useState(0);
  const [currentY, setCurrentY] = useState(0);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      document.body.style.overflow = 'hidden';
      triggerHapticFeedback('light');
    } else {
      setIsVisible(false);
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
    setStartY(e.touches[0].clientY);
    setCurrentY(e.touches[0].clientY);
    triggerHapticFeedback('selection');
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    
    const newY = e.touches[0].clientY;
    const deltaY = newY - startY;
    
    if (deltaY > 0) {
      setCurrentY(newY);
    }
  };

  const handleTouchEnd = () => {
    if (!isDragging) return;
    
    const deltaY = currentY - startY;
    if (deltaY > 100) {
      triggerHapticFeedback('medium');
      onClose();
    } else {
      triggerHapticFeedback('light');
    }
    
    setIsDragging(false);
    setStartY(0);
    setCurrentY(0);
  };

  const transformStyle = isDragging && currentY > startY 
    ? { transform: `translateY(${Math.max(0, currentY - startY)}px)` }
    : {};

  if (!isMobile) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/50 z-40 transition-opacity duration-300 ${
          isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => {
          triggerHapticFeedback('light');
          onClose();
        }}
      />
      
      {/* Modal */}
      <div
        ref={modalRef}
        className={`fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-2xl shadow-2xl transition-transform duration-300 ease-out ${
          isVisible ? 'translate-y-0' : 'translate-y-full'
        }`}
        style={{
          maxHeight: '85vh',
          minHeight: '60vh',
          paddingBottom: 'env(safe-area-inset-bottom)',
          ...transformStyle
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Handle bar */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-12 h-1 bg-gray-300 rounded-full" />
        </div>
        
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2 border-b">
          <h3 className="text-lg font-semibold text-gray-900">Ask Nicole</h3>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => {
              triggerHapticFeedback('light');
              onClose();
            }}
            className="touch-manipulation h-10 w-10"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
        
        {/* Content */}
        <div className="flex-1 overflow-hidden">
          <NicoleConversationEngine
            isOpen={true}
            initialMessage={initialQuery}
            onClose={onClose}
            onNavigateToMarketplace={onNavigateToResults}
          />
        </div>
        
        {/* Pull down indicator when dragging */}
        {isDragging && currentY > startY && (
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 flex items-center gap-1 text-gray-500 bg-white/90 px-3 py-1 rounded-full">
            <ArrowDown className="h-4 w-4" />
            <span className="text-sm font-medium">Pull down to close</span>
          </div>
        )}
      </div>
    </>
  );
};

export default MobileConversationModal;
