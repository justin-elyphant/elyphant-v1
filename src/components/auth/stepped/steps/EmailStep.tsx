import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import StepLayout from "../StepLayout";

interface EmailStepProps {
  email: string;
  onChange: (value: string) => void;
  onNext: () => void;
  onBack: () => void;
  stepIndex: number;
  totalSteps: number;
}

const EmailStep: React.FC<EmailStepProps> = ({
  email,
  onChange,
  onNext,
  onBack,
  stepIndex,
  totalSteps,
}) => {
  const [error, setError] = useState("");

  const validate = () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address");
      return false;
    }
    setError("");
    return true;
  };

  const handleNext = () => {
    if (validate()) onNext();
  };

  return (
    <StepLayout
      heading="What's your email?"
      subtitle="We'll use this to sign you in"
      onBack={onBack}
      onNext={handleNext}
      isNextDisabled={!email.trim()}
      stepIndex={stepIndex}
      totalSteps={totalSteps}
    >
      <div className="space-y-2">
        <Label htmlFor="email" className="text-sm text-muted-foreground">
          Email address
        </Label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(e) => {
            onChange(e.target.value);
            if (error) setError("");
          }}
          placeholder="you@example.com"
          className="h-12 text-base rounded-lg"
          autoFocus
          onKeyDown={(e) => e.key === "Enter" && handleNext()}
        />
        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>
    </StepLayout>
  );
};

export default EmailStep;
