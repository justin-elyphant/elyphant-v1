import React, { useState } from "react";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";
import StepLayout from "../StepLayout";

interface PasswordStepProps {
  password: string;
  onChange: (value: string) => void;
  onNext: () => void;
  onBack: () => void;
  stepIndex: number;
  totalSteps: number;
}

const PasswordStep: React.FC<PasswordStepProps> = ({
  password,
  onChange,
  onNext,
  onBack,
  stepIndex,
  totalSteps,
}) => {
  const [error, setError] = useState("");

  const strength = React.useMemo(() => {
    if (password.length === 0) return 0;
    let s = 0;
    if (password.length >= 8) s++;
    if (/[A-Z]/.test(password)) s++;
    if (/[0-9]/.test(password)) s++;
    if (/[^A-Za-z0-9]/.test(password)) s++;
    return s;
  }, [password]);

  const strengthLabel = ["", "Weak", "Fair", "Good", "Strong"][strength];
  const strengthColor = [
    "bg-border",
    "bg-destructive",
    "bg-orange-400",
    "bg-yellow-400",
    "bg-green-500",
  ][strength];

  const handleNext = () => {
    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    if (strength < 3) {
      setError("Please choose a stronger password (add uppercase, numbers, or symbols)");
      return;
    }
    setError("");
    onNext();
  };

  return (
    <StepLayout
      heading="Create a password"
      subtitle="Use 8 or more characters"
      onBack={onBack}
      onNext={handleNext}
      isNextDisabled={password.length < 8 || strength < 3}
      stepIndex={stepIndex}
      totalSteps={totalSteps}
    >
      <div className="space-y-3">
        <div className="space-y-2">
          <Label htmlFor="password" className="text-sm text-muted-foreground">
            Password
          </Label>
          <PasswordInput
            id="password"
            value={password}
            onChange={(e) => {
              onChange(e.target.value);
              if (error) setError("");
            }}
            placeholder="Create a strong password"
            className="h-12 text-base rounded-lg"
            autoFocus
            onKeyDown={(e: React.KeyboardEvent) =>
              e.key === "Enter" && handleNext()
            }
          />
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>

        {/* Strength indicator */}
        {password.length > 0 && (
          <div className="space-y-1.5">
            <div className="flex gap-1">
              {[1, 2, 3, 4].map((level) => (
                <div
                  key={level}
                  className={`h-1 flex-1 rounded-full transition-colors ${
                    level <= strength ? strengthColor : "bg-border"
                  }`}
                />
              ))}
            </div>
            <p className="text-xs text-muted-foreground">{strengthLabel}</p>
          </div>
        )}
      </div>
    </StepLayout>
  );
};

export default PasswordStep;
