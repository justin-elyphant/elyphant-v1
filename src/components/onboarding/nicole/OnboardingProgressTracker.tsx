
import React from "react";
import { CheckCircle, Circle } from "lucide-react";

type OnboardingStep = 
  | "intent-discovery" 
  | "giftor-flow" 
  | "giftee-flow" 
  | "connection-discovery" 
  | "completion";

type UserIntent = "giftor" | "giftee" | "explorer";

interface OnboardingProgressTrackerProps {
  currentStep: OnboardingStep;
  userIntent: UserIntent | null;
}

const OnboardingProgressTracker: React.FC<OnboardingProgressTrackerProps> = ({
  currentStep,
  userIntent
}) => {
  const getSteps = () => {
    const baseSteps = [
      { id: "intent-discovery", label: "Welcome", required: true },
    ];
    
    if (userIntent === "giftor") {
      baseSteps.push({ id: "giftor-flow", label: "Gift Setup", required: true });
    } else if (userIntent === "giftee") {
      baseSteps.push({ id: "giftee-flow", label: "Profile Setup", required: true });
    }
    
    baseSteps.push(
      { id: "connection-discovery", label: "Connect", required: false },
      { id: "completion", label: "Ready!", required: true }
    );
    
    return baseSteps;
  };

  const steps = getSteps();
  const currentStepIndex = steps.findIndex(step => step.id === currentStep);

  const getProgressPercentage = () => {
    if (currentStep === "completion") return 100;
    return Math.max(0, (currentStepIndex / (steps.length - 1)) * 100);
  };

  return (
    <div className="p-4 border-b border-gray-100 bg-white rounded-t-3xl">
      {/* Progress Bar */}
      <div className="w-full bg-gray-200 h-1 rounded-full mb-4 overflow-hidden">
        <div 
          className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-500 ease-out"
          style={{ width: `${getProgressPercentage()}%` }}
        />
      </div>
      
      {/* Step Indicators */}
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const isCompleted = index < currentStepIndex;
          const isCurrent = index === currentStepIndex;
          const isUpcoming = index > currentStepIndex;
          
          return (
            <div key={step.id} className="flex flex-col items-center">
              <div className={`
                w-6 h-6 rounded-full flex items-center justify-center mb-1 transition-all duration-300
                ${isCompleted ? 'bg-purple-600 text-white' : 
                  isCurrent ? 'bg-purple-100 border-2 border-purple-600' : 
                  'bg-gray-200 text-gray-400'}
              `}>
                {isCompleted ? (
                  <CheckCircle className="h-4 w-4" />
                ) : (
                  <Circle className="h-3 w-3" fill="currentColor" />
                )}
              </div>
              
              <span className={`
                text-xs font-medium transition-colors duration-300
                ${isCompleted || isCurrent ? 'text-purple-600' : 'text-gray-400'}
              `}>
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default OnboardingProgressTracker;
