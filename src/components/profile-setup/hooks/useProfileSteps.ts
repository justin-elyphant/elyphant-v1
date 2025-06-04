
import { useState, useCallback } from "react";

interface Step {
  id: string;
  title: string;
  description?: string;
}

export const useProfileSteps = () => {
  const [activeStep, setActiveStep] = useState('basic-info');

  const steps: Step[] = [
    {
      id: 'basic-info',
      title: 'Basic Information',
      description: 'Tell us about yourself'
    },
    {
      id: 'address',
      title: 'Shipping Address',
      description: 'Where should gifts be delivered?'
    },
    {
      id: 'interests',
      title: 'Interests',
      description: 'What are you interested in?'
    },
    {
      id: 'important-dates',
      title: 'Important Dates',
      description: 'Add special dates and occasions'
    },
    {
      id: 'privacy',
      title: 'Privacy Settings',
      description: 'Control who can see your information'
    },
    {
      id: 'next-steps',
      title: 'Next Steps',
      description: 'Choose what to do next'
    }
  ];

  const handleNext = useCallback(() => {
    const currentIndex = steps.findIndex(step => step.id === activeStep);
    if (currentIndex < steps.length - 1) {
      const nextStep = steps[currentIndex + 1];
      console.log(`Step transition: ${activeStep} -> ${nextStep.id}`);
      setActiveStep(nextStep.id);
    }
  }, [activeStep, steps]);

  const handleBack = useCallback(() => {
    const currentIndex = steps.findIndex(step => step.id === activeStep);
    if (currentIndex > 0) {
      const prevStep = steps[currentIndex - 1];
      console.log(`Step transition: ${activeStep} -> ${prevStep.id}`);
      setActiveStep(prevStep.id);
    }
  }, [activeStep, steps]);

  return {
    activeStep,
    steps,
    handleNext,
    handleBack
  };
};
