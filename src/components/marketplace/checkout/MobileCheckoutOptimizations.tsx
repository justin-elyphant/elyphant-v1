
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ChevronRight, ArrowLeft } from 'lucide-react';
import { useMediaQuery } from '@/hooks/useMediaQuery';

interface MobileCheckoutOptimizationsProps {
  currentStep: number;
  totalSteps: number;
  onNext: () => void;
  onPrevious: () => void;
  canProceed: boolean;
  nextLabel?: string;
  showProgress?: boolean;
}

const MobileCheckoutOptimizations: React.FC<MobileCheckoutOptimizationsProps> = ({
  currentStep,
  totalSteps,
  onNext,
  onPrevious,
  canProceed,
  nextLabel = 'Continue',
  showProgress = true
}) => {
  const isMobile = useMediaQuery('(max-width: 768px)');

  if (!isMobile) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 z-50">
      {/* Progress Bar */}
      {showProgress && (
        <div className="mb-4">
          <div className="flex justify-between text-xs text-muted-foreground mb-2">
            <span>Step {currentStep} of {totalSteps}</span>
            <span>{Math.round((currentStep / totalSteps) * 100)}% complete</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-primary h-2 rounded-full transition-all duration-300"
              style={{ width: `${(currentStep / totalSteps) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Navigation Buttons */}
      <div className="flex gap-3">
        {currentStep > 1 && (
          <Button
            variant="outline"
            onClick={onPrevious}
            className="flex-shrink-0"
            size="lg"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
        )}
        
        <Button
          onClick={onNext}
          disabled={!canProceed}
          className="flex-1 flex items-center justify-center gap-2"
          size="lg"
        >
          {nextLabel}
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Estimated time */}
      <p className="text-xs text-center text-muted-foreground mt-2">
        About {Math.max(1, totalSteps - currentStep)} minute{totalSteps - currentStep !== 1 ? 's' : ''} remaining
      </p>
    </div>
  );
};

export default MobileCheckoutOptimizations;
