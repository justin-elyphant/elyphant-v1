import { ChevronUp, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SlideNavigationProps {
  currentSlide: number;
  totalSlides: number;
  onNavigate: (index: number) => void;
  onNext: () => void;
  onPrevious: () => void;
}

const SlideNavigation = ({
  currentSlide,
  totalSlides,
  onNavigate,
  onNext,
  onPrevious,
}: SlideNavigationProps) => {
  // Safe-area aware bottom offset for iOS home indicator
  const safeBottom = { bottom: 'calc(env(safe-area-inset-bottom, 0px) + 12px)' };

  return (
    <>
      {/* Dot indicators - desktop only (15 dots take too much space on mobile/tablet) */}
      <div className="hidden lg:flex absolute right-4 top-1/2 -translate-y-1/2 flex-col gap-2 z-50">
        {Array.from({ length: totalSlides }).map((_, index) => (
          <button
            key={index}
            onClick={() => onNavigate(index)}
            className={cn(
              "w-2.5 h-2.5 rounded-full transition-all duration-300",
              currentSlide === index
                ? "bg-gradient-to-r from-purple-500 to-sky-500 scale-125"
                : "bg-gray-600 hover:bg-gray-400"
            )}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>

      {/* Arrow navigation - bottom right, inside container, safe-area aware */}
      <div
        className="absolute right-3 lg:right-4 flex flex-col gap-2 z-50 lg:bottom-4"
        style={safeBottom}
      >
        <button
          onClick={onPrevious}
          disabled={currentSlide === 0}
          className={cn(
            "min-w-[44px] min-h-[44px] lg:min-w-0 lg:min-h-0 lg:p-2 flex items-center justify-center rounded-full bg-white/10 backdrop-blur-sm border border-white/20 transition-all touch-manipulation",
            currentSlide === 0
              ? "opacity-30 cursor-not-allowed"
              : "active:scale-95 hover:bg-white/20 lg:hover:scale-110"
          )}
          aria-label="Previous slide"
        >
          <ChevronUp className="w-5 h-5 text-white" />
        </button>
        <button
          onClick={onNext}
          disabled={currentSlide === totalSlides - 1}
          className={cn(
            "min-w-[44px] min-h-[44px] lg:min-w-0 lg:min-h-0 lg:p-2 flex items-center justify-center rounded-full bg-white/10 backdrop-blur-sm border border-white/20 transition-all touch-manipulation",
            currentSlide === totalSlides - 1
              ? "opacity-30 cursor-not-allowed"
              : "active:scale-95 hover:bg-white/20 lg:hover:scale-110"
          )}
          aria-label="Next slide"
        >
          <ChevronDown className="w-5 h-5 text-white" />
        </button>
      </div>

      {/* Slide counter - bottom left, inside container, safe-area aware */}
      <div
        className="absolute left-3 lg:left-4 text-muted-foreground text-xs lg:text-sm font-mono z-50 lg:bottom-4"
        style={safeBottom}
      >
        {String(currentSlide + 1).padStart(2, '0')} / {String(totalSlides).padStart(2, '0')}
      </div>
    </>
  );
};

export default SlideNavigation;
