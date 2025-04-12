
import { useState } from "react";

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

  const handleNext = () => {
    console.log("Moving to next step from step", activeStep);
    setActiveStep((prevStep) => prevStep + 1);
  };

  const handleBack = () => {
    console.log("Moving to previous step from step", activeStep);
    setActiveStep((prevStep) => Math.max(0, prevStep - 1));
  };

  return {
    activeStep,
    steps,
    handleNext,
    handleBack
  };
};
