
import React from "react";

interface CarouselIndicatorsProps {
  totalImages: number;
  activeIndex: number;
  onIndicatorClick: (index: number) => void;
}

const CarouselIndicators = ({ 
  totalImages, 
  activeIndex, 
  onIndicatorClick 
}: CarouselIndicatorsProps) => {
  if (totalImages <= 1) return null;
  
  return (
    <div className="flex justify-center gap-1 mt-2">
      {Array.from({ length: totalImages }).map((_, idx) => (
        <div 
          key={idx}
          className={`w-2 h-2 rounded-full transition-colors ${
            idx === activeIndex ? 'bg-primary' : 'bg-gray-300'
          }`}
          role="button"
          tabIndex={0}
          onClick={() => onIndicatorClick(idx)}
        />
      ))}
    </div>
  );
};

export default CarouselIndicators;
