
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSignUpSubmit } from "../signup/useSignUpProcess/useSignUpSubmit";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export function useSignUpProcess() {
  const navigate = useNavigate();
  const [step, setStep] = useState<"signup" | "verification">("signup");
  const [userEmail, setUserEmail] = useState<string>("");
  const [userName, setUserName] = useState<string>("");
  const [resendCount, setResendCount] = useState<number>(0);
  const [emailSent, setEmailSent] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Phase 5: Always enable verification bypass
  const [bypassVerification] = useState(true);

  // Check localStorage for previously stored values on component mount
  useEffect(() => {
    const storedEmail = localStorage.getItem("pendingVerificationEmail");
    const storedName = localStorage.getItem("pendingVerificationName");
    const storedResendCount = localStorage.getItem("verificationResendCount");
    const userIntent = localStorage.getItem("userIntent");

    // Restore last verification session if it exists
    if (storedEmail && storedName) {
      setUserEmail(storedEmail);
      setUserName(storedName);
      setStep("verification");

      // If the user has already picked an intent and refreshes, immediately route them
      if (userIntent === "giftor") {
        navigate("/marketplace", { replace: true });
      } else if (userIntent === "giftee" || userIntent === "skipped") {
        navigate("/profile-setup", { replace: true });
      }
    }

    if (storedResendCount) {
      setResendCount(Number(storedResendCount) || 0);
    }

    // Phase 5: Always set bypass verification to true
    localStorage.setItem("bypassVerification", "true");
  }, [navigate]);

  const { onSignUpSubmit: originalOnSignUpSubmit } = useSignUpSubmit({
    setUserEmail,
    setUserName,
    setEmailSent,
    setStep,
    setIsSubmitting
  });

  const handleSignUpSubmit = async (values: any) => {
    try {
      // Store pending verification details before submission
      localStorage.setItem("pendingVerificationEmail", values.email);
      localStorage.setItem("pendingVerificationName", values.name);

      await originalOnSignUpSubmit(values);

      setUserEmail(values.email);
      setUserName(values.name);
      setStep("verification");

      // Set new signup flag for custom onboarding flow
      localStorage.setItem("newSignUp", "true");
      // Do NOT auto-redirect here! Modal will handle all navigation.
    } catch (error) {
      console.error("Sign up process error:", error);
      throw error;
    }
  };

  const handleResendVerification = async (): Promise<{ success: boolean; rateLimited?: boolean }> => {
    try {
      setResendCount(prev => prev + 1);
      localStorage.setItem("verificationResendCount", String(resendCount + 1));

      // Use Supabase's native resend functionality
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: userEmail,
      });

      if (error) {
        console.error("Error resending verification:", error);

        // Check for rate limiting errors
        if (error.message?.includes("rate limit") || error.status === 429) {
          toast.info("Rate limit reached", {
            description: "You can continue without waiting for verification."
          });

          return { success: true, rateLimited: true };
        }

        toast.error("Failed to resend verification email");
        return { success: false };
      }

      // Phase 5: We no longer auto-redirect here—modal choice will handle it!

      toast.success("Verification email sent", {
        description: "Please check your inbox and spam folder."
      });

      return { success: true };
    } catch (err) {
      console.error("Error in handleResendVerification:", err);
      return { success: false };
    }
  };

  const handleBackToSignUp = () => {
    setStep("signup");

    // Clear stored verification details when going back
    localStorage.removeItem("pendingVerificationEmail");
    localStorage.removeItem("pendingVerificationName");
  };

  return {
    step,
    userEmail,
    userName,
    resendCount,
    onSignUpSubmit: handleSignUpSubmit,
    handleResendVerification,
    handleBackToSignUp,
    isSubmitting,
    bypassVerification,
  };
}
