
import React from "react";
import { cn } from "@/lib/utils";

interface StepperProps {
  activeStep: number;
  children: React.ReactNode;
  className?: string;
}

export const Stepper: React.FC<StepperProps> = ({ activeStep, children, className }) => {
  const childrenArray = React.Children.toArray(children);
  
  return (
    <div className={cn("flex items-center justify-between", className)}>
      {childrenArray.map((child, index) => {
        if (!React.isValidElement(child)) return null;
        
        const isCompleted = index < activeStep;
        const isActive = index === activeStep;
        
        return React.cloneElement(child as React.ReactElement<StepProps>, {
          index,
          isCompleted,
          isActive,
        });
      })}
    </div>
  );
};

interface StepProps {
  index?: number;
  isActive?: boolean;
  isCompleted?: boolean;
  children: React.ReactNode;
  completed?: boolean;
}

export const Step: React.FC<StepProps> = ({ isActive, isCompleted, children }) => {
  return (
    <div className="flex flex-col items-center">
      <div
        className={cn(
          "w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold",
          isActive && "bg-primary text-primary-foreground",
          isCompleted && "bg-green-500 text-white",
          !isActive && !isCompleted && "bg-gray-200 text-gray-500"
        )}
      >
        {isCompleted ? "✓" : ""}
      </div>
      {children}
    </div>
  );
};

export const StepLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <div className="mt-2 text-xs text-muted-foreground text-center">{children}</div>;
};
