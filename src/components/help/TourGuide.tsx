import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { X, ChevronRight, ChevronLeft, LightbulbOff } from "lucide-react";
import { cn } from "@/lib/utils";

export type TourStep = {
  id: string;
  title: string;
  content: React.ReactNode;
  elementSelector: string;
  position?: "top" | "right" | "bottom" | "left";
};

interface TourGuideProps {
  steps: TourStep[];
  onComplete: () => void;
  onSkip: () => void;
  tourId: string;
  isOpen?: boolean;
  onClose?: () => void;
}

const TourGuide: React.FC<TourGuideProps> = ({
  steps,
  onComplete,
  onSkip,
  tourId,
  isOpen = true,
  onClose,
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState(false);

  const step = steps[currentStep];
  
  // Check if device is mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener("resize", checkMobile);
    
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    
    const positionTooltip = () => {
      const element = document.querySelector(step?.elementSelector);
      if (!element) return;
      
      const rect = element.getBoundingClientRect();
      const tooltipHeight = tooltipRef.current?.offsetHeight || 150;
      const tooltipWidth = tooltipRef.current?.offsetWidth || 300;
      
      let newPosition = { top: 0, left: 0 };
      const position = step.position || (isMobile ? "bottom" : "right");
      
      switch (position) {
        case "top":
          newPosition = {
            top: Math.max(10, rect.top - tooltipHeight - 10),
            left: rect.left + rect.width / 2 - tooltipWidth / 2
          };
          break;
        case "bottom":
          newPosition = {
            top: rect.bottom + 10,
            left: rect.left + rect.width / 2 - tooltipWidth / 2
          };
          break;
        case "left":
          newPosition = {
            top: rect.top + rect.height / 2 - tooltipHeight / 2,
            left: Math.max(10, rect.left - tooltipWidth - 10)
          };
          break;
        case "right":
          newPosition = {
            top: rect.top + rect.height / 2 - tooltipHeight / 2,
            left: rect.right + 10
          };
          break;
      }
      
      // Adjust position to keep tooltip within viewport
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      
      if (newPosition.left < 10) newPosition.left = 10;
      if (newPosition.left + tooltipWidth > viewportWidth - 10) {
        newPosition.left = viewportWidth - tooltipWidth - 10;
      }
      
      if (newPosition.top < 10) newPosition.top = 10;
      if (newPosition.top + tooltipHeight > viewportHeight - 10) {
        newPosition.top = viewportHeight - tooltipHeight - 10;
      }
      
      setPosition(newPosition);
      
      // Highlight the element
      element.classList.add("tour-highlight");
      
      // Add pulse animation if first visit
      if (!localStorage.getItem(`tour-${tourId}-started`)) {
        element.classList.add("tour-pulse");
      }
    };
    
    positionTooltip();
    
    // Mark tour as started
    localStorage.setItem(`tour-${tourId}-started`, "true");
    
    const handleResize = () => {
      positionTooltip();
    };
    
    window.addEventListener("resize", handleResize);
    window.addEventListener("scroll", handleResize, true);
    
    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("scroll", handleResize, true);
      // Remove highlight from the current element
      const element = document.querySelector(step?.elementSelector);
      if (element) {
        element.classList.remove("tour-highlight");
        element.classList.remove("tour-pulse");
      }
    };
  }, [currentStep, step, isOpen, isMobile, tourId]);
  
  if (!isOpen) return null;
  
  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Mark tour as completed in local storage
      const completedTours = JSON.parse(localStorage.getItem("completedTours") || "{}");
      completedTours[tourId] = true;
      localStorage.setItem("completedTours", JSON.stringify(completedTours));
      onComplete();
    }
  };
  
  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };
  
  const handleSkip = () => {
    // Mark tour as skipped in local storage
    const skippedTours = JSON.parse(localStorage.getItem("skippedTours") || "{}");
    skippedTours[tourId] = true;
    localStorage.setItem("skippedTours", JSON.stringify(skippedTours));
    onSkip();
    if (onClose) onClose();
  };
  
  const handleClose = () => {
    if (onClose) onClose();
    else handleSkip();
  };

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/20 z-50" onClick={handleClose} />
      
      {/* Tour tooltip */}
      <div 
        ref={tooltipRef}
        className={cn(
          "fixed z-50 bg-white rounded-lg shadow-lg w-[300px] md:w-[320px]",
          isMobile ? "bottom-16 left-1/2 transform -translate-x-1/2" : "transform"
        )}
        style={!isMobile ? {
          top: `${position.top}px`,
          left: `${position.left}px`
        } : undefined}
      >
        <div className="p-4">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-semibold">{step?.title}</h3>
            <button onClick={handleClose} className="text-gray-400 hover:text-gray-600">
              <X className="h-4 w-4" />
            </button>
          </div>
          
          <div className="text-sm text-gray-600 mb-4">
            {step?.content}
          </div>
          
          <div className="flex justify-between items-center">
            <div className="text-xs text-gray-500">
              {currentStep + 1} of {steps.length}
            </div>
            
            <div className="flex gap-2">
              {currentStep > 0 && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handlePrev}
                  className="flex items-center gap-1"
                >
                  <ChevronLeft className="h-3 w-3" />
                  <span className="hidden sm:inline">Back</span>
                </Button>
              )}
              
              <Button 
                size="sm" 
                onClick={handleNext}
                className="flex items-center gap-1"
              >
                {currentStep < steps.length - 1 ? (
                  <>
                    <span>{isMobile ? "Next" : "Continue"}</span> <ChevronRight className="h-3 w-3" />
                  </>
                ) : (
                  "Finish"
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Skip button at the bottom */}
      {!isMobile && (
        <div className="fixed bottom-4 right-4 z-50">
          <Button variant="outline" size="sm" onClick={handleSkip} className="flex items-center gap-1">
            <LightbulbOff className="h-3 w-3" />
            Skip Tour
          </Button>
        </div>
      )}
    </>
  );
};

export default TourGuide;
