
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSignUpSubmit } from "../signup/useSignUpProcess/useSignUpSubmit";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { LocalStorageService } from "@/services/localStorage/LocalStorageService";

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
    // Try new LocalStorageService first, fallback to deprecated keys for migration
    const completionState = LocalStorageService.getProfileCompletionState();
    const storedEmail = completionState?.email || localStorage.getItem("pendingVerificationEmail");
    const storedName = completionState?.firstName + ' ' + completionState?.lastName || localStorage.getItem("pendingVerificationName");
    const storedResendCount = localStorage.getItem("verificationResendCount");
    const userIntent = LocalStorageService.getNicoleContext()?.selectedIntent || localStorage.getItem("userIntent");

    // Restore last verification session if it exists
    if (storedEmail && storedName) {
      setUserEmail(storedEmail);
      setUserName(storedName);
      setStep("verification");

      // If the user has already picked an intent and refreshes, immediately route them
      if (userIntent === "giftor") {
        navigate("/marketplace", { replace: true });
      } else if (userIntent === "giftee" || userIntent === "skipped") {
        navigate("/signup?intent=complete-profile", { replace: true });
      }
    }

    if (storedResendCount) {
      setResendCount(Number(storedResendCount) || 0);
    }

    // Migration: Use LocalStorageService for new state management
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
      // Store pending verification details in new service
      LocalStorageService.setProfileCompletionState({
        email: values.email,
        firstName: values.name.split(' ')[0] || '',
        lastName: values.name.split(' ').slice(1).join(' ') || '',
        step: 'signup',
        source: 'email'
      });

      await originalOnSignUpSubmit(values);

      setUserEmail(values.email);
      setUserName(values.name);
      setStep("verification");

      // Update completion state to indicate verification step
      LocalStorageService.setProfileCompletionState({
        step: 'profile',
        source: 'email'
      });
      // Do NOT auto-redirect here! Modal will handle all navigation.
    } catch (error) {
      console.error("Sign up process error:", error);
      throw error;
    }
  };

  const handleResendVerification = async (): Promise<{ success: boolean; rateLimited?: boolean }> => {
    try {
      const newCount = resendCount + 1;
      setResendCount(newCount);
      
      // Store resend count in profile completion state
      LocalStorageService.setProfileCompletionState({
        email: userEmail,
        step: 'signup'
      });

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
    LocalStorageService.clearProfileCompletionState();
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
