import React from 'react';
import { Check, MapPin, CreditCard, Package } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CheckoutProgressIndicatorProps {
  currentStep: 'shipping' | 'payment' | 'review';
}

const CheckoutProgressIndicator: React.FC<CheckoutProgressIndicatorProps> = ({ currentStep }) => {
  const steps = [
    { key: 'shipping', label: 'Shipping', icon: MapPin, number: 1 },
    { key: 'payment', label: 'Payment', icon: CreditCard, number: 2 },
    { key: 'review', label: 'Review', icon: Package, number: 3 }
  ];

  const getCurrentStepIndex = () => {
    return steps.findIndex(step => step.key === currentStep);
  };

  const currentStepIndex = getCurrentStepIndex();

  return (
    <div className="flex items-center justify-center py-4">
      {steps.map((step, index) => {
        const isActive = index === currentStepIndex;
        const isCompleted = index < currentStepIndex;

        return (
          <React.Fragment key={step.key}>
            {/* Step Circle */}
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  "relative flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-200",
                  isCompleted 
                    ? "bg-gradient-to-r from-purple-600 to-sky-500 border-transparent text-white" 
                    : isActive 
                      ? "border-purple-600 bg-background text-purple-600" 
                      : "border-muted-foreground/30 bg-background text-muted-foreground"
                )}
              >
                {isCompleted ? (
                  <Check className="h-5 w-5" strokeWidth={2.5} />
                ) : (
                  <span className="text-sm font-semibold">{step.number}</span>
                )}
              </div>
              
              {/* Step Label - Hidden on mobile for cleaner look */}
              <span className={cn(
                "mt-2 text-xs font-medium hidden sm:block",
                isActive ? "text-foreground" : isCompleted ? "text-foreground" : "text-muted-foreground"
              )}>
                {step.label}
              </span>
            </div>

            {/* Connecting Line */}
            {index < steps.length - 1 && (
              <div className={cn(
                "w-12 sm:w-20 h-0.5 mx-2 sm:mx-4 transition-colors duration-200",
                isCompleted ? "bg-gradient-to-r from-purple-600 to-sky-500" : "bg-muted-foreground/30"
              )} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

export default CheckoutProgressIndicator;
