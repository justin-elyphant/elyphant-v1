
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/contexts/auth";
import { Sparkles, Users, Heart, Gift, ArrowRight } from "lucide-react";
import OnboardingWelcome from "./steps/OnboardingWelcome";
import OnboardingConnections from "./steps/OnboardingConnections";
import OnboardingPreferences from "./steps/OnboardingPreferences";
import OnboardingComplete from "./steps/OnboardingComplete";

export type OnboardingStep = 'welcome' | 'connections' | 'preferences' | 'complete';

export interface OnboardingState {
  skippedSteps: OnboardingStep[];
  completedSteps: OnboardingStep[];
}

const OnboardingFlow: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState<OnboardingStep>('welcome');
  const [state, setState] = useState<OnboardingState>({
    skippedSteps: [],
    completedSteps: [],
  });

  const steps: OnboardingStep[] = ['welcome', 'connections', 'preferences', 'complete'];
  const currentStepIndex = steps.indexOf(currentStep);
  const progress = (currentStepIndex / (steps.length - 1)) * 100;
  
  const handleNext = (skipCurrent = false) => {
    // Mark current step as completed or skipped
    if (skipCurrent) {
      setState(prev => ({
        ...prev,
        skippedSteps: [...prev.skippedSteps, currentStep]
      }));
    } else {
      setState(prev => ({
        ...prev,
        completedSteps: [...prev.completedSteps, currentStep]
      }));
    }

    // Move to next step or finish onboarding
    if (currentStepIndex < steps.length - 1) {
      setCurrentStep(steps[currentStepIndex + 1]);
    } else {
      // Onboarding complete, redirect to dashboard
      localStorage.removeItem("newSignUp");
      localStorage.setItem("onboardingComplete", "true");
      navigate("/dashboard");
    }
  };

  const handleSkip = () => {
    handleNext(true);
  };

  const handleComplete = () => {
    // Mark all remaining steps as completed
    const remainingSteps = steps.slice(currentStepIndex).filter(step => 
      !state.completedSteps.includes(step) && step !== 'complete'
    );
    
    setState(prev => ({
      ...prev,
      completedSteps: [...prev.completedSteps, ...remainingSteps]
    }));

    // Redirect to dashboard
    localStorage.removeItem("newSignUp");
    localStorage.setItem("onboardingComplete", "true");
    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white p-4 flex flex-col">
      <div className="w-full max-w-2xl mx-auto mt-8">
        {currentStep !== 'complete' && (
          <div className="mb-8">
            <div className="flex justify-between items-center mb-2">
              <p className="text-sm text-muted-foreground">
                Step {currentStepIndex + 1} of {steps.length - 1}
              </p>
              {currentStep !== 'welcome' && (
                <Button variant="ghost" size="sm" onClick={handleSkip}>
                  Skip this step
                </Button>
              )}
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        )}

        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          {currentStep === 'welcome' && (
            <OnboardingWelcome onNext={handleNext} userName={user?.user_metadata?.name || 'there'} />
          )}
          
          {currentStep === 'connections' && (
            <OnboardingConnections onNext={handleNext} onSkip={handleSkip} />
          )}
          
          {currentStep === 'preferences' && (
            <OnboardingPreferences onNext={handleNext} onSkip={handleSkip} />
          )}
          
          {currentStep === 'complete' && (
            <OnboardingComplete onComplete={handleComplete} />
          )}
        </div>
      </div>
    </div>
  );
};

export default OnboardingFlow;
