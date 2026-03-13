import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import StepLayout from "../StepLayout";

interface NameStepProps {
  firstName: string;
  lastName: string;
  onChange: (field: "firstName" | "lastName", value: string) => void;
  onNext: () => void;
  onBack?: () => void;
  locked?: boolean;
  stepIndex: number;
  totalSteps: number;
}

const NameStep: React.FC<NameStepProps> = ({
  firstName,
  lastName,
  onChange,
  onNext,
  onBack,
  locked = false,
  stepIndex,
  totalSteps,
}) => {
  const isValid = firstName.trim().length >= 1 && lastName.trim().length >= 1;

  return (
    <StepLayout
      heading="What's your name?"
      subtitle="So your friends know who you are"
      onBack={onBack}
      onNext={onNext}
      isNextDisabled={!isValid}
      showBack={!!onBack}
      stepIndex={stepIndex}
      totalSteps={totalSteps}
    >
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="firstName" className="text-sm text-muted-foreground">
            First name
          </Label>
          <Input
            id="firstName"
            value={firstName}
            onChange={(e) => onChange("firstName", e.target.value)}
            disabled={locked}
            placeholder="First name"
            className="h-12 text-base rounded-lg"
            autoFocus
            onKeyDown={(e) => e.key === "Enter" && isValid && onNext()}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="lastName" className="text-sm text-muted-foreground">
            Last name
          </Label>
          <Input
            id="lastName"
            value={lastName}
            onChange={(e) => onChange("lastName", e.target.value)}
            disabled={locked}
            placeholder="Last name"
            className="h-12 text-base rounded-lg"
            onKeyDown={(e) => e.key === "Enter" && isValid && onNext()}
          />
        </div>
      </div>
    </StepLayout>
  );
};

export default NameStep;
