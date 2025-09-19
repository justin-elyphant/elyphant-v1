import React from "react";
import { useViewport } from "@/hooks/useViewport";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { MobileBottomSheet } from "@/components/mobile/MobileBottomSheet";
import { cn } from "@/lib/utils";

interface ResponsiveProductModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  source?: 'wishlist' | 'interests' | 'ai' | 'trending';
  children: React.ReactNode;
}

const ResponsiveProductModal: React.FC<ResponsiveProductModalProps> = ({
  open,
  onOpenChange,
  title,
  description,
  source,
  children
}) => {
  const { isMobile } = useViewport();

  const sourceLabel = {
    'ai': "🤖 AI picked this for you",
    'trending': "📈 Trending now", 
    'interests': "🎯 Based on your interests",
    'wishlist': "❤️ From wishlist"
  };

  if (isMobile) {
    return (
      <MobileBottomSheet
        isOpen={open}
        onClose={() => onOpenChange(false)}
        className="ios-modal-backdrop mobile-container safe-area-bottom"
      >
        <div className="mobile-card ios-scroll">
          {/* Mobile Header */}
          <div className="sticky top-0 bg-background/95 backdrop-blur-sm border-b px-4 py-3 z-10">
            <div className="space-y-1">
              {source && (
                <div className="text-xs font-medium text-primary">
                  {sourceLabel[source]}
                </div>
              )}
              <h2 className="text-lg font-semibold leading-tight mobile-truncate-multi">
                {title}
              </h2>
              {description && (
                <p className="text-sm text-muted-foreground mobile-truncate-multi">
                  {description}
                </p>
              )}
            </div>
          </div>
          
          {/* Mobile Content */}
          <div className="px-4 pb-24 safe-area-bottom">
            {children}
          </div>
        </div>
      </MobileBottomSheet>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">
            {title}
          </DialogTitle>
          <DialogDescription asChild>
            <div className="text-sm text-muted-foreground line-clamp-2">
              {source && (
                <div className="mb-2 text-xs font-medium text-primary">
                  {sourceLabel[source]}
                </div>
              )}
              {description && <span>{description}</span>}
            </div>
          </DialogDescription>
        </DialogHeader>
        {children}
      </DialogContent>
    </Dialog>
  );
};

export default ResponsiveProductModal;