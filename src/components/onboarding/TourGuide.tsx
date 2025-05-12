
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { X, ArrowRight, HelpCircle } from "lucide-react";

export interface TourStep {
  id: string;
  title: string;
  content: React.ReactNode;
  elementSelector?: string; // CSS selector to highlight
  position?: 'top' | 'right' | 'bottom' | 'left';
}

interface TourGuideProps {
  steps: TourStep[];
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

const TourGuide: React.FC<TourGuideProps> = ({
  steps,
  isOpen,
  onClose,
  onComplete
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  
  // Reset to first step when opened
  useEffect(() => {
    if (isOpen) {
      setCurrentStepIndex(0);
    }
  }, [isOpen]);
  
  // Handle highlighting the targeted element
  useEffect(() => {
    if (!isOpen) return;
    
    const currentStep = steps[currentStepIndex];
    if (currentStep.elementSelector) {
      const element = document.querySelector(currentStep.elementSelector);
      if (element) {
        // Add a highlight class to the element
        element.classList.add('tour-highlight');
        // Scroll the element into view if needed
        element.scrollIntoView({
          behavior: 'smooth',
          block: 'center'
        });
      }
      
      // Clean up the highlight when the step changes or tour closes
      return () => {
        if (element) {
          element.classList.remove('tour-highlight');
        }
      };
    }
  }, [currentStepIndex, isOpen, steps]);
  
  const handleNext = () => {
    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex(prev => prev + 1);
    } else {
      onComplete();
    }
  };
  
  const handlePrev = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(prev => prev - 1);
    }
  };
  
  const currentStep = steps[currentStepIndex];
  const isLastStep = currentStepIndex === steps.length - 1;
  
  if (!isOpen) return null;
  
  return (
    <Dialog open={isOpen} onOpenChange={() => onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <HelpCircle className="mr-2 h-5 w-5 text-primary" />
            {currentStep.title}
          </DialogTitle>
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-4 top-4"
            onClick={onClose}
          >
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>
        
        <div className="py-4">
          {currentStep.content}
        </div>
        
        <DialogFooter className="flex justify-between">
          <div className="flex items-center">
            <span className="text-sm text-muted-foreground">
              Step {currentStepIndex + 1} of {steps.length}
            </span>
          </div>
          <div className="flex gap-2">
            {currentStepIndex > 0 && (
              <Button variant="outline" onClick={handlePrev}>
                Back
              </Button>
            )}
            <Button onClick={handleNext} className="min-w-[100px]">
              {isLastStep ? 'Finish' : (
                <>
                  Next
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TourGuide;
