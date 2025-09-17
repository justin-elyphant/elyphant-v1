import React, { useEffect } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { triggerHapticFeedback } from "@/utils/haptics";

interface MobileBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  className?: string;
  snapPoints?: number[]; // For backward compatibility
  initialSnapPoint?: number; // For backward compatibility
}

export const MobileBottomSheet: React.FC<MobileBottomSheetProps> = ({
  isOpen,
  onClose,
  title,
  children,
  className = ""
}) => {
  // Handle escape key and prevent body scroll
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      
      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          onClose();
        }
      };
      
      document.addEventListener('keydown', handleEscape);
      return () => {
        document.body.style.overflow = 'unset';
        document.removeEventListener('keydown', handleEscape);
      };
    }
  }, [isOpen, onClose]);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      triggerHapticFeedback('light');
      onClose();
    }
  };

  const handleClose = () => {
    triggerHapticFeedback('light');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 z-[70] animate-fade-in"
        onClick={handleBackdropClick}
      />
      
      {/* Bottom Sheet */}
      <div className={`connection-bottom-sheet ${isOpen ? 'open' : ''} ${className}`}>
        {/* Handle */}
        <div className="connection-bottom-sheet-handle" />
        
        {/* Header */}
        {title && (
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <h3 className="text-lg font-semibold">{title}</h3>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={handleClose}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}
        
        {/* Content */}
        <div className="max-h-[70vh] overflow-y-auto">
          {children}
        </div>
      </div>
    </>
  );
};