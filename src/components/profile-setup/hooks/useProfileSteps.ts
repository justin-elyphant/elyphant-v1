
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
    setActiveStep((prevStep) => prevStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  return {
    activeStep,
    steps,
    handleNext,
    handleBack
  };
};
