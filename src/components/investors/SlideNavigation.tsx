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
      {/* Dot indicators - right side */}
      <div className="fixed right-6 top-1/2 -translate-y-1/2 flex flex-col gap-3 z-50">
        {Array.from({ length: totalSlides }).map((_, index) => (
          <button
            key={index}
            onClick={() => onNavigate(index)}
            className={cn(
              "w-3 h-3 rounded-full transition-all duration-300",
              currentSlide === index
                ? "bg-gradient-to-r from-purple-500 to-sky-500 scale-125"
                : "bg-gray-600 hover:bg-gray-400"
            )}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>

      {/* Arrow navigation - bottom right */}
      <div className="fixed bottom-6 right-6 flex flex-col gap-2 z-50">
        <button
          onClick={onPrevious}
          disabled={currentSlide === 0}
          className={cn(
            "p-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 transition-all",
            currentSlide === 0
              ? "opacity-30 cursor-not-allowed"
              : "hover:bg-white/20 hover:scale-110"
          )}
          aria-label="Previous slide"
        >
          <ChevronUp className="w-5 h-5 text-white" />
        </button>
        <button
          onClick={onNext}
          disabled={currentSlide === totalSlides - 1}
          className={cn(
            "p-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 transition-all",
            currentSlide === totalSlides - 1
              ? "opacity-30 cursor-not-allowed"
              : "hover:bg-white/20 hover:scale-110"
          )}
          aria-label="Next slide"
        >
          <ChevronDown className="w-5 h-5 text-white" />
        </button>
      </div>

      {/* Slide counter - bottom left */}
      <div className="fixed bottom-6 left-6 text-gray-400 text-sm font-mono z-50">
        {String(currentSlide + 1).padStart(2, '0')} / {String(totalSlides).padStart(2, '0')}
      </div>
    </>
  );
};

export default SlideNavigation;
