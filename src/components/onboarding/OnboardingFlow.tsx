
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/contexts/auth";
import { Sparkles, Users, Heart, Gift, ArrowRight } from "lucide-react";
import OnboardingWelcome from "./steps/OnboardingWelcome";
import OnboardingConnections from "./steps/OnboardingConnections";
import OnboardingPreferences from "./steps/OnboardingPreferences";
import OnboardingComplete from "./steps/OnboardingComplete";
import "./onboardingStyles.css";
import { useGiftSearches } from "./hooks/useGiftSearches";
import { LocalStorageService } from "@/services/localStorage/LocalStorageService";

export type OnboardingStep = 'welcome' | 'connections' | 'preferences' | 'complete';

export interface OnboardingState {
  skippedSteps: OnboardingStep[];
  completedSteps: OnboardingStep[];
}

interface OnboardingFlowProps {
  onComplete: () => void;
  onSkip?: () => void;
}

const OnboardingFlow: React.FC<OnboardingFlowProps> = ({ onComplete, onSkip }) => {
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
  
  // Reset onboarding state when component mounts
  useEffect(() => {
    setState({
      skippedSteps: [],
      completedSteps: []
    });
  }, []);
  
  const { saveGiftSearch } = useGiftSearches();

  // Store onboarding answers as the user progresses
  const [answers, setAnswers] = useState<any>({});

  // Update state on step answer
  const handleStepAnswer = (step: OnboardingStep, data: any) => {
    setAnswers((prev: any) => ({
      ...prev,
      [step]: data
    }));
  };

  const handleNext = (skipCurrent = false, stepData?: any) => {
    // Save the step's answers, if any
    if (stepData && currentStep !== 'complete') {
      handleStepAnswer(currentStep, stepData);
    }
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
      LocalStorageService.markProfileSetupCompleted();
      LocalStorageService.setNicoleContext({ 
        source: 'onboarding_complete',
        currentPage: '/dashboard'
      });
      onComplete();
    }
  };

  const handleSkip = () => {
    handleNext(true);
  };

  const handleCompleteOnboarding = async () => {
    // Mark all remaining steps as completed
    const remainingSteps = steps.slice(currentStepIndex).filter(step => 
      !state.completedSteps.includes(step) && step !== 'complete'
    );
    setState(prev => ({
      ...prev,
      completedSteps: [...prev.completedSteps, ...remainingSteps]
    }));

    // Transform collected onboarding answers into a gift_searches session
    const { welcome, connections, preferences } = answers;
    const onboardingSession = {
      occasion: preferences?.occasion || welcome?.occasion || undefined,
      recipient_name: preferences?.recipient_name || connections?.recipient_name || undefined,
      recipient_type: preferences?.recipient_type || connections?.recipient_type || undefined,
      recipient_relationship: preferences?.recipient_relationship || connections?.recipient_relationship || undefined,
      recipient_age_range: preferences?.recipient_age_range,
      recipient_interests: preferences?.recipient_interests,
      excluded_items: preferences?.excluded_items,
      budget_range: preferences?.budget_range,
      extra_preferences: preferences?.extra_preferences,
      // Optionally, store more data from welcome/connections as needed
    };
    await saveGiftSearch(onboardingSession);

    // Redirect to dashboard
    LocalStorageService.markProfileSetupCompleted();
    LocalStorageService.setNicoleContext({ 
      source: 'onboarding_complete',
      currentPage: '/dashboard'
    });
    
    // If the parent component provided an onComplete handler, use that
    onComplete();
  };

  // If user skips the entire onboarding
  const handleSkipAll = () => {
    if (onSkip) {
      onSkip();
    } else {
      LocalStorageService.markProfileSetupCompleted();
      LocalStorageService.setNicoleContext({ 
        source: 'onboarding_skipped',
        currentPage: '/dashboard',
        timestamp: new Date().toISOString()
      });
      navigate("/dashboard");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white p-4 flex flex-col onboarding-container">
      <div className="w-full max-w-2xl mx-auto mt-8">
        {currentStep !== 'complete' && (
          <div className="mb-8">
            <div className="flex justify-between items-center mb-2">
              <p className="text-sm text-muted-foreground">
                Step {currentStepIndex + 1} of {steps.length - 1}
              </p>
              {currentStep !== 'welcome' && (
                <Button variant="ghost" size="sm" onClick={handleSkipAll}>
                  Skip All
                </Button>
              )}
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        )}

        <div className="bg-white rounded-xl shadow-lg overflow-hidden onboarding-card">
          {currentStep === 'welcome' && (
            <OnboardingWelcome
              onNext={() => handleNext()}
              userName={user?.user_metadata?.name || 'there'}
            />
          )}
          
          {currentStep === 'connections' && (
            <OnboardingConnections
              onNext={() => handleNext()}
              onSkip={() => handleNext(true)}
            />
          )}
          
          {currentStep === 'preferences' && (
            <OnboardingPreferences
              onNext={() => handleNext()}
              onSkip={() => handleNext(true)}
            />
          )}
          
          {currentStep === 'complete' && (
            <OnboardingComplete onComplete={handleCompleteOnboarding} />
          )}
        </div>
      </div>
    </div>
  );
};

export default OnboardingFlow;
