import React, { useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X, Plus, Share2, CheckCircle2, Sparkles } from "lucide-react";

interface MobileWishlistIntroCardProps {
  onDismiss: () => void;
  onCreateWishlist: () => void;
}

const MobileWishlistIntroCard: React.FC<MobileWishlistIntroCardProps> = ({
  onDismiss,
  onCreateWishlist
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [translateX, setTranslateX] = useState(0);
  const startXRef = useRef<number | null>(null);
  const isDraggingRef = useRef(false);

  // Handle swipe to dismiss with passive touch listeners
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    startXRef.current = e.touches[0].clientX;
    isDraggingRef.current = false;
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (startXRef.current === null) return;
    
    const deltaX = e.touches[0].clientX - startXRef.current;
    
    // Only track rightward swipes (dismiss gesture)
    if (deltaX > 10) {
      isDraggingRef.current = true;
      setTranslateX(Math.min(deltaX, 150));
    }
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (translateX > 100) {
      // Swiped enough to dismiss
      setIsVisible(false);
      setTimeout(onDismiss, 300);
    } else {
      // Snap back
      setTranslateX(0);
    }
    startXRef.current = null;
    isDraggingRef.current = false;
  }, [translateX, onDismiss]);

  const handleDismissClick = () => {
    setIsVisible(false);
    setTimeout(onDismiss, 300);
  };

  // Check for reduced motion preference
  const prefersReducedMotion = typeof window !== 'undefined' 
    && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

  if (!isVisible) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={prefersReducedMotion ? { opacity: 1 } : { opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, x: 100 }}
        transition={{ duration: 0.2 }}
        className="mb-4"
        style={{ 
          transform: `translate3d(${translateX}px, 0, 0)`,
          opacity: 1 - (translateX / 200),
          touchAction: 'pan-y'
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <Card className="relative overflow-hidden bg-gradient-to-br from-rose-500 via-rose-600 to-amber-500 border-0 text-white">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDismissClick}
            className="absolute top-2 right-2 h-8 w-8 p-0 text-white/80 hover:text-white hover:bg-white/20 rounded-full z-10"
          >
            <X className="h-4 w-4" />
          </Button>

          <CardContent className="p-5">
            <h3 className="text-lg font-bold mb-2 pr-8">Why Build Wishlists?</h3>
            
            <div className="space-y-2 mb-4">
              <div className="flex items-center gap-2 text-sm text-white/90">
                <Share2 className="h-4 w-4 shrink-0" />
                <span>Share with friends for perfect gifts</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-white/90">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                <span>Avoid duplicate purchases</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-white/90">
                <Sparkles className="h-4 w-4 shrink-0" />
                <span>Power AI gift recommendations</span>
              </div>
            </div>

            <Button 
              onClick={onCreateWishlist}
              className="w-full bg-white text-rose-600 hover:bg-white/90 min-h-[44px] font-semibold"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Wishlist
            </Button>

            <p className="text-xs text-white/60 text-center mt-3">
              Swipe right to dismiss
            </p>
          </CardContent>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
};

export default MobileWishlistIntroCard;
