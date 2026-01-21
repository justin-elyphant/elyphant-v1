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
  return (
    <>
      {/* Dot indicators - right side, inside container */}
      <div className="absolute right-3 md:right-4 top-1/2 -translate-y-1/2 flex flex-col gap-2 z-50">
        {Array.from({ length: totalSlides }).map((_, index) => (
          <button
            key={index}
            onClick={() => onNavigate(index)}
            className={cn(
              "w-2 h-2 md:w-2.5 md:h-2.5 rounded-full transition-all duration-300",
              currentSlide === index
                ? "bg-gradient-to-r from-purple-500 to-sky-500 scale-125"
                : "bg-gray-600 hover:bg-gray-400"
            )}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>

      {/* Arrow navigation - bottom right, inside container */}
      <div className="absolute bottom-3 md:bottom-4 right-3 md:right-4 flex flex-col gap-1.5 z-50">
        <button
          onClick={onPrevious}
          disabled={currentSlide === 0}
          className={cn(
            "p-1.5 md:p-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 transition-all",
            currentSlide === 0
              ? "opacity-30 cursor-not-allowed"
              : "hover:bg-white/20 hover:scale-110"
          )}
          aria-label="Previous slide"
        >
          <ChevronUp className="w-4 h-4 md:w-5 md:h-5 text-white" />
        </button>
        <button
          onClick={onNext}
          disabled={currentSlide === totalSlides - 1}
          className={cn(
            "p-1.5 md:p-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 transition-all",
            currentSlide === totalSlides - 1
              ? "opacity-30 cursor-not-allowed"
              : "hover:bg-white/20 hover:scale-110"
          )}
          aria-label="Next slide"
        >
          <ChevronDown className="w-4 h-4 md:w-5 md:h-5 text-white" />
        </button>
      </div>

      {/* Slide counter - bottom left, inside container */}
      <div className="absolute bottom-3 md:bottom-4 left-3 md:left-4 text-gray-400 text-xs md:text-sm font-mono z-50">
        {String(currentSlide + 1).padStart(2, '0')} / {String(totalSlides).padStart(2, '0')}
      </div>
    </>
  );
};

export default SlideNavigation;
