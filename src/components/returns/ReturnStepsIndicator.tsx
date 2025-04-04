
import React from "react";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface ReturnStepsIndicatorProps {
  currentStep: number;
  totalSteps?: number;
}

const ReturnStepsIndicator = ({ 
  currentStep, 
  totalSteps = 3 
}: ReturnStepsIndicatorProps) => {
  // Calculate progress percentage
  const progressPercentage = (currentStep / totalSteps) * 100;

  return (
    <div className="mb-8">
      <div className="flex justify-between mb-2">
        <span className="text-sm font-medium">Step {currentStep} of {totalSteps}</span>
        <span className="text-sm font-medium">{Math.round(progressPercentage)}% Complete</span>
      </div>
      
      <Progress value={progressPercentage} className="h-2 mb-6" />
      
      <Tabs defaultValue={`step-${currentStep}`} className="w-full">
        <TabsList className="w-full grid grid-cols-3">
          <TabsTrigger 
            value="step-1"
            disabled={currentStep < 1}
            className={currentStep >= 1 ? "font-medium" : "text-muted-foreground"}
          >
            Select Items
          </TabsTrigger>
          <TabsTrigger 
            value="step-2"
            disabled={currentStep < 2}
            className={currentStep >= 2 ? "font-medium" : "text-muted-foreground"}
          >
            Return Details
          </TabsTrigger>
          <TabsTrigger 
            value="step-3"
            disabled={currentStep < 3}
            className={currentStep >= 3 ? "font-medium" : "text-muted-foreground"}
          >
            Confirmation
          </TabsTrigger>
        </TabsList>
      </Tabs>
    </div>
  );
};

export default ReturnStepsIndicator;
