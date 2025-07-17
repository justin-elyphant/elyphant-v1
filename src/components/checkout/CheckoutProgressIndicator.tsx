import React from 'react';
import { CheckCircle, Circle, CreditCard, Package, Truck } from 'lucide-react';

interface CheckoutProgressIndicatorProps {
  currentStep: 'review' | 'shipping' | 'payment';
}

const CheckoutProgressIndicator: React.FC<CheckoutProgressIndicatorProps> = ({ currentStep }) => {
  const steps = [
    { key: 'review', label: 'Review', icon: Package },
    { key: 'shipping', label: 'Shipping', icon: Truck },
    { key: 'payment', label: 'Payment', icon: CreditCard }
  ];

  const getCurrentStepIndex = () => {
    return steps.findIndex(step => step.key === currentStep);
  };

  const currentStepIndex = getCurrentStepIndex();

  return (
    <div className="flex items-center justify-between mb-8">
      {steps.map((step, index) => {
        const isActive = index === currentStepIndex;
        const isCompleted = index < currentStepIndex;
        const StepIcon = step.icon;

        return (
          <div key={step.key} className="flex-1 relative">
            <div className="flex items-center">
              {/* Step Circle */}
              <div className={`
                relative z-10 flex items-center justify-center w-10 h-10 rounded-full border-2 
                ${isCompleted 
                  ? 'bg-primary border-primary text-primary-foreground' 
                  : isActive 
                    ? 'border-primary bg-background text-primary' 
                    : 'border-muted-foreground/30 bg-background text-muted-foreground'
                }
              `}>
                {isCompleted ? (
                  <CheckCircle className="h-5 w-5" />
                ) : (
                  <StepIcon className="h-5 w-5" />
                )}
              </div>

              {/* Step Label */}
              <div className="ml-3">
                <p className={`text-sm font-medium ${
                  isActive ? 'text-primary' : isCompleted ? 'text-primary' : 'text-muted-foreground'
                }`}>
                  {step.label}
                </p>
              </div>
            </div>

            {/* Connecting Line */}
            {index < steps.length - 1 && (
              <div className={`
                absolute top-5 left-10 w-full h-0.5 -translate-y-1/2
                ${isCompleted ? 'bg-primary' : 'bg-muted-foreground/30'}
              `} />
            )}
          </div>
        );
      })}
    </div>
  );
};

export default CheckoutProgressIndicator;