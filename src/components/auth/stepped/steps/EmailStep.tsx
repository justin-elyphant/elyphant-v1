import React, { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Check, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import StepLayout from "../StepLayout";

interface EmailStepProps {
  email: string;
  onChange: (value: string) => void;
  onNext: () => void;
  onBack: () => void;
  onSwitchToSignIn?: () => void;
  stepIndex: number;
  totalSteps: number;
}

type AvailabilityStatus = "idle" | "checking" | "available" | "taken";

const EmailStep: React.FC<EmailStepProps> = ({
  email,
  onChange,
  onNext,
  onBack,
  onSwitchToSignIn,
  stepIndex,
  totalSteps,
}) => {
  const [error, setError] = useState("");
  const [availability, setAvailability] = useState<AvailabilityStatus>("idle");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  // Debounced email availability check
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!email.trim() || !emailRegex.test(email)) {
      setAvailability("idle");
      return;
    }

    setAvailability("checking");

    debounceRef.current = setTimeout(async () => {
      try {
        const { data, error: fnError } = await supabase.functions.invoke(
          "check-email-availability",
          { body: { email: email.trim() } }
        );

        if (fnError) {
          console.warn("Email check failed:", fnError);
          setAvailability("idle");
          return;
        }

        setAvailability(data?.available ? "available" : "taken");
        if (!data?.available) {
          setError("");
        }
      } catch {
        setAvailability("idle");
      }
    }, 500);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [email]);

  const validate = () => {
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address");
      return false;
    }
    if (availability === "taken") {
      return false;
    }
    setError("");
    return true;
  };

  const handleNext = () => {
    if (validate()) onNext();
  };

  const isNextDisabled =
    !email.trim() || availability === "taken" || availability === "checking";

  return (
    <StepLayout
      heading="What's your email?"
      subtitle="We'll use this to sign you in"
      onBack={onBack}
      onNext={handleNext}
      isNextDisabled={isNextDisabled}
      stepIndex={stepIndex}
      totalSteps={totalSteps}
    >
      <div className="space-y-2">
        <Label htmlFor="email" className="text-sm text-muted-foreground">
          Email address
        </Label>
        <div className="relative">
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => {
              onChange(e.target.value);
              if (error) setError("");
            }}
            placeholder="you@example.com"
            className="h-12 text-base rounded-lg pr-10"
            autoFocus
            onKeyDown={(e) => e.key === "Enter" && !isNextDisabled && handleNext()}
          />
          {/* Status indicator inside the input */}
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            {availability === "checking" && (
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            )}
            {availability === "available" && (
              <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            )}
          </div>
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        {availability === "taken" && (
          <div className="text-sm">
            <span className="text-destructive">This email is already registered.</span>
            {onSwitchToSignIn && (
              <>
                {" "}
                <button
                  type="button"
                  onClick={onSwitchToSignIn}
                  className="text-primary underline underline-offset-2 hover:opacity-80"
                >
                  Sign in instead
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </StepLayout>
  );
};

export default EmailStep;
