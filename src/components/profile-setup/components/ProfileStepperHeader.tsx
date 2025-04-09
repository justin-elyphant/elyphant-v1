
import React from "react";
import { CardTitle, CardDescription } from "@/components/ui/card";
import { Stepper, Step, StepLabel } from "../Stepper";

interface ProfileStepperHeaderProps {
  activeStep: number;
  steps: string[];
}

const ProfileStepperHeader: React.FC<ProfileStepperHeaderProps> = ({ 
  activeStep, 
  steps 
}) => {
  return (
    <>
      <CardTitle className="text-2xl font-bold text-purple-700">Complete Your Profile</CardTitle>
      <CardDescription>
        This information helps us personalize your gifting experience
      </CardDescription>
      <Stepper activeStep={activeStep} className="mt-4">
        {steps.map((label, index) => (
          <Step key={index} completed={index < activeStep}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>
    </>
  );
};

export default ProfileStepperHeader;
