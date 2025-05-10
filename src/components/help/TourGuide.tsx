
import React, { useState, useEffect } from "react";
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
}

const TourGuide: React.FC<TourGuideProps> = ({
  steps,
  onComplete,
  onSkip,
  tourId
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [position, setPosition] = useState({ top: 0, left: 0 });

  const step = steps[currentStep];
  
  useEffect(() => {
    const positionTooltip = () => {
      const element = document.querySelector(step.elementSelector);
      if (!element) return;
      
      const rect = element.getBoundingClientRect();
      const position = step.position || "bottom";
      
      switch (position) {
        case "top":
          setPosition({
            top: rect.top - 10 - 150, // Height of tooltip
            left: rect.left + rect.width / 2 - 150 // Half width of tooltip
          });
          break;
        case "bottom":
          setPosition({
            top: rect.bottom + 10,
            left: rect.left + rect.width / 2 - 150
          });
          break;
        case "left":
          setPosition({
            top: rect.top + rect.height / 2 - 75,
            left: rect.left - 10 - 300
          });
          break;
        case "right":
          setPosition({
            top: rect.top + rect.height / 2 - 75,
            left: rect.right + 10
          });
          break;
      }
      
      // Highlight the element
      element.classList.add("tour-highlight");
    };
    
    positionTooltip();
    
    const handleResize = () => {
      positionTooltip();
    };
    
    window.addEventListener("resize", handleResize);
    
    return () => {
      window.removeEventListener("resize", handleResize);
      // Remove highlight from the current element
      const element = document.querySelector(step.elementSelector);
      if (element) {
        element.classList.remove("tour-highlight");
      }
    };
  }, [currentStep, step]);
  
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
  };

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/20 z-50" />
      
      {/* Tour tooltip */}
      <div 
        className="fixed z-50 bg-white rounded-lg shadow-lg w-[300px] transform -translate-x-1/2"
        style={{
          top: `${position.top}px`,
          left: `${position.left}px`
        }}
      >
        <div className="p-4">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-semibold">{step.title}</h3>
            <button onClick={handleSkip} className="text-gray-400 hover:text-gray-600">
              <X className="h-4 w-4" />
            </button>
          </div>
          
          <div className="text-sm text-gray-600 mb-4">
            {step.content}
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
                  Back
                </Button>
              )}
              
              <Button 
                size="sm" 
                onClick={handleNext}
                className="flex items-center gap-1"
              >
                {currentStep < steps.length - 1 ? (
                  <>Next <ChevronRight className="h-3 w-3" /></>
                ) : (
                  "Finish"
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Skip button at the bottom */}
      <div className="fixed bottom-4 right-4 z-50">
        <Button variant="outline" size="sm" onClick={handleSkip} className="flex items-center gap-1">
          <LightbulbOff className="h-3 w-3" />
          Skip Tour
        </Button>
      </div>
    </>
  );
};

export default TourGuide;
