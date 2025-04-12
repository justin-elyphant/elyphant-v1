
import { useState, useCallback } from "react";

export const useProfileSteps = () => {
  const [activeStep, setActiveStep] = useState(0);

  const steps = [
    "Basic Info",
    "Profile",
    "Birthday",
    "Shipping Address",
    "Gift Preferences",
    "Data Sharing",
    "Next Steps"
  ];

  const handleNext = useCallback(() => {
    console.log("Moving to next step from step", activeStep);
    setActiveStep((prevStep) => {
      const nextStep = prevStep + 1;
      console.log(`Step transition: ${prevStep} -> ${nextStep}`);
      return nextStep;
    });
  }, [activeStep]);

  const handleBack = useCallback(() => {
    console.log("Moving to previous step from step", activeStep);
    setActiveStep((prevStep) => {
      const nextStep = Math.max(0, prevStep - 1);
      console.log(`Step transition: ${prevStep} -> ${nextStep}`);
      return nextStep;
    });
  }, [activeStep]);

  return {
    activeStep,
    steps,
    handleNext,
    handleBack
  };
};
