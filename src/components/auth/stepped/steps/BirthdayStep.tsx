import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import StepLayout from "../StepLayout";
import { ChevronDown } from "lucide-react";

interface BirthdayStepProps {
  birthday: string; // YYYY-MM-DD
  onChange: (value: string) => void;
  onNext: () => void;
  onBack: () => void;
  stepIndex: number;
  totalSteps: number;
}

const BirthdayStep: React.FC<BirthdayStepProps> = ({
  birthday,
  onChange,
  onNext,
  onBack,
  stepIndex,
  totalSteps,
}) => {
  const [showWhy, setShowWhy] = useState(false);

  const isValid = React.useMemo(() => {
    if (!birthday) return false;
    const date = new Date(birthday);
    if (isNaN(date.getTime())) return false;
    const year = date.getFullYear();
    return year >= 1900 && year <= new Date().getFullYear();
  }, [birthday]);

  // Compute max date (today) for the input
  const maxDate = new Date().toISOString().split("T")[0];

  return (
    <StepLayout
      heading="When's your birthday?"
      subtitle="Your friends will be reminded to get you something great"
      onBack={onBack}
      onNext={onNext}
      isNextDisabled={!isValid}
      stepIndex={stepIndex}
      totalSteps={totalSteps}
    >
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="birthday" className="text-sm text-muted-foreground">
            Date of birth
          </Label>
          <Input
            id="birthday"
            type="date"
            value={birthday}
            onChange={(e) => onChange(e.target.value)}
            max={maxDate}
            min="1900-01-01"
            className="h-12 text-base rounded-lg"
          />
        </div>

        <button
          type="button"
          onClick={() => setShowWhy(!showWhy)}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors touch-manipulation"
        >
          <ChevronDown
            className={`w-4 h-4 transition-transform ${showWhy ? "rotate-180" : ""}`}
          />
          Why do we need this?
        </button>

        {showWhy && (
          <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
            Your birthday helps us remind your connections to pick out the
            perfect gift. We'll never share your exact age — only the date is
            visible to friends you approve.
          </p>
        )}
      </div>
    </StepLayout>
  );
};

export default BirthdayStep;
