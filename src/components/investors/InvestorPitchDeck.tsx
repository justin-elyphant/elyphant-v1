import { useState, useEffect, useCallback, useRef } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Maximize, Minimize } from 'lucide-react';
import SlideNavigation from './SlideNavigation';
import TitleSlide from './slides/TitleSlide';
import ProblemSlide from './slides/ProblemSlide';
import WhyGiftingFailsSlide from './slides/WhyGiftingFailsSlide';
import WelcomeSlide from './slides/WelcomeSlide';
import SolutionSlide from './slides/SolutionSlide';
import HowItWorksSlide from './slides/HowItWorksSlide';
import MarketSlide from './slides/MarketSlide';
import WhyNowSlide from './slides/WhyNowSlide';
import CompetitionSlide from './slides/CompetitionSlide';
import RevenueStreamsSlide from './slides/RevenueStreamsSlide';
import TractionSlide from './slides/TractionSlide';
import TeamSlide from './slides/TeamSlide';
import UseOfFundsSlide from './slides/UseOfFundsSlide';
import TheAskSlide from './slides/TheAskSlide';
import ContactSlide from './slides/ContactSlide';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// Sequoia-optimized slide order (15 slides)
const slides = [
  { id: 'title', component: TitleSlide },           // 1 - Hook
  { id: 'problem', component: ProblemSlide },       // 2 - $850B crisis
  { id: 'why-fails', component: WhyGiftingFailsSlide }, // 3 - Root causes
  { id: 'welcome', component: WelcomeSlide },       // 4 - Brand moment
  { id: 'solution', component: SolutionSlide },     // 5 - Our answer
  { id: 'how-it-works', component: HowItWorksSlide }, // 6 - Demo flow
  { id: 'revenue-streams', component: RevenueStreamsSlide }, // 7 - Revenue model + unit economics
  { id: 'market', component: MarketSlide },         // 8 - TAM/SAM/SOM (math now grounded by prior slide)
  { id: 'why-now', component: WhyNowSlide },        // 9 - Market timing
  { id: 'competition', component: CompetitionSlide }, // 10 - Differentiation
  { id: 'traction', component: TractionSlide },     // 11 - Metrics + roadmap
  { id: 'team', component: TeamSlide },             // 12 - Founders
  { id: 'the-ask', component: TheAskSlide },        // 13 - Ask + valuation + milestones
  { id: 'use-of-funds', component: UseOfFundsSlide }, // 14 - $3.5M deployment
  { id: 'contact', component: ContactSlide },       // 15 - Closing CTA
];

const InvestorPitchDeck = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [direction, setDirection] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const toggleFullscreen = useCallback(async () => {
    if (!document.fullscreenElement) {
      try {
        await containerRef.current?.requestFullscreen();
        setIsFullscreen(true);
      } catch (err) {
        console.error('Error entering fullscreen:', err);
      }
    } else {
      try {
        await document.exitFullscreen();
        setIsFullscreen(false);
      } catch (err) {
        console.error('Error exiting fullscreen:', err);
      }
    }
  }, []);

  // Listen for fullscreen changes (e.g., user presses Escape)
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const goToNext = useCallback(() => {
    if (currentSlide < slides.length - 1) {
      setDirection(1);
      setCurrentSlide(prev => prev + 1);
    }
  }, [currentSlide]);

  const goToPrevious = useCallback(() => {
    if (currentSlide > 0) {
      setDirection(-1);
      setCurrentSlide(prev => prev - 1);
    }
  }, [currentSlide]);

  const goToSlide = useCallback((index: number) => {
    setDirection(index > currentSlide ? 1 : -1);
    setCurrentSlide(index);
  }, [currentSlide]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown' || e.key === 'ArrowRight' || e.key === ' ') {
        e.preventDefault();
        goToNext();
      } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
        e.preventDefault();
        goToPrevious();
      } else if (e.key === 'Home') {
        e.preventDefault();
        goToSlide(0);
      } else if (e.key === 'End') {
        e.preventDefault();
        goToSlide(slides.length - 1);
      } else if (e.key === 'f' || e.key === 'F') {
        e.preventDefault();
        toggleFullscreen();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goToNext, goToPrevious, goToSlide, toggleFullscreen]);

  // Touch/swipe support — horizontal-only to avoid conflict with vertical
  // scrolling inside slides (and iOS Safari rubber-band).
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let startY = 0;
    let startX = 0;
    let startedInScrollable = false;

    const isInScrollableAncestor = (el: EventTarget | null): boolean => {
      let node = el as HTMLElement | null;
      while (node && node !== container) {
        const style = window.getComputedStyle(node);
        const oy = style.overflowY;
        if ((oy === 'auto' || oy === 'scroll') && node.scrollHeight > node.clientHeight) {
          return true;
        }
        node = node.parentElement;
      }
      return false;
    };

    const handleTouchStart = (e: TouchEvent) => {
      startY = e.touches[0].clientY;
      startX = e.touches[0].clientX;
      startedInScrollable = isInScrollableAncestor(e.target);
    };

    const handleTouchEnd = (e: TouchEvent) => {
      const endY = e.changedTouches[0].clientY;
      const endX = e.changedTouches[0].clientX;
      const diffY = startY - endY;
      const diffX = startX - endX;

      // Horizontal swipe is dominant and clear (prevents accidental nav while scrolling).
      if (Math.abs(diffX) > 60 && Math.abs(diffX) > Math.abs(diffY) * 1.5) {
        if (diffX > 0) goToNext();
        else goToPrevious();
        return;
      }

      // Vertical swipe only when not inside scrollable content.
      if (!startedInScrollable && Math.abs(diffY) > 80 && Math.abs(diffY) > Math.abs(diffX) * 1.5) {
        if (diffY > 0) goToNext();
        else goToPrevious();
      }
    };

    container.addEventListener('touchstart', handleTouchStart, { passive: true });
    container.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [goToNext, goToPrevious]);

  const CurrentSlideComponent = slides[currentSlide].component;

  return (
    <div 
      ref={containerRef}
      className={cn(
        "min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-purple-950",
        isFullscreen && "fixed inset-0 z-50"
      )}
    >
      {/* Centered slide container - responsive: full-screen on mobile, framed on desktop */}
      <div className={cn(
        "w-full mx-auto",
        !isFullscreen && "max-w-6xl md:px-8 md:py-8"
      )}>
        <div className={cn(
          "relative bg-foreground/50 overflow-hidden",
          !isFullscreen && "h-[100svh] md:h-auto md:aspect-[16/10] md:rounded-2xl md:shadow-2xl md:border md:border-white/5",
          isFullscreen && "h-screen"
        )}>
          {/* Progress bar */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gray-800 z-50">
            <div 
              className="h-full bg-gradient-to-r from-purple-500 to-sky-500 transition-all duration-500 ease-out"
              style={{ width: `${((currentSlide + 1) / slides.length) * 100}%` }}
            />
          </div>

          {/* Fullscreen toggle button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleFullscreen}
            className="absolute top-4 right-4 z-50 text-muted-foreground hover:text-white hover:bg-white/10"
            title={isFullscreen ? 'Exit fullscreen (Esc)' : 'Enter fullscreen (F)'}
          >
            {isFullscreen ? <Minimize className="h-5 w-5" /> : <Maximize className="h-5 w-5" />}
          </Button>

          {/* Slide content */}
          <AnimatePresence mode="wait" custom={direction}>
            <CurrentSlideComponent 
              key={slides[currentSlide].id} 
              direction={direction}
              onNext={goToNext}
              isFirst={currentSlide === 0}
              isLast={currentSlide === slides.length - 1}
            />
          </AnimatePresence>

          {/* Navigation - inside container */}
          <SlideNavigation
            currentSlide={currentSlide}
            totalSlides={slides.length}
            onNavigate={goToSlide}
            onNext={goToNext}
            onPrevious={goToPrevious}
          />

          {/* Keyboard hint (only on first slide) */}
          {currentSlide === 0 && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-muted-foreground text-xs md:text-sm animate-pulse hidden md:block">
              Press arrow keys or scroll to navigate
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InvestorPitchDeck;
