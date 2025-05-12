
import { useState, useEffect } from "react";
import { TourStep } from "@/components/onboarding/TourGuide";

interface UseTourGuideProps {
  tourId: string;
  steps: TourStep[];
  autoShowOnFirstVisit?: boolean;
}

export const useTourGuide = ({
  tourId,
  steps,
  autoShowOnFirstVisit = true
}: UseTourGuideProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [hasSeenTour, setHasSeenTour] = useState(false);
  
  useEffect(() => {
    // Check if user has seen this tour before
    const seenTours = JSON.parse(localStorage.getItem("seenTours") || "{}");
    const hasSeen = seenTours[tourId];
    
    setHasSeenTour(!!hasSeen);
    
    // Auto-show if this is the first visit and autoShow is enabled
    if (!hasSeen && autoShowOnFirstVisit) {
      // Small delay to let the page render first
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [tourId, autoShowOnFirstVisit]);
  
  const openTour = () => {
    setIsOpen(true);
  };
  
  const closeTour = () => {
    setIsOpen(false);
  };
  
  const completeTour = () => {
    // Mark this tour as seen
    const seenTours = JSON.parse(localStorage.getItem("seenTours") || "{}");
    seenTours[tourId] = true;
    localStorage.setItem("seenTours", JSON.stringify(seenTours));
    
    setHasSeenTour(true);
    setIsOpen(false);
  };
  
  const resetTour = () => {
    // Remove this tour from seen tours
    const seenTours = JSON.parse(localStorage.getItem("seenTours") || "{}");
    delete seenTours[tourId];
    localStorage.setItem("seenTours", JSON.stringify(seenTours));
    
    setHasSeenTour(false);
  };
  
  return {
    isOpen,
    hasSeenTour,
    openTour,
    closeTour,
    completeTour,
    resetTour,
    steps
  };
};
