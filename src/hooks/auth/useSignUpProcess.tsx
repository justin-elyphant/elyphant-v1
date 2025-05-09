
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSignUpSubmit } from "./useSignUpSubmit";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export function useSignUpProcess() {
  const navigate = useNavigate();
  const [step, setStep] = useState<"signup" | "verification">("signup");
  const [userEmail, setUserEmail] = useState<string>("");
  const [userName, setUserName] = useState<string>("");
  const [resendCount, setResendCount] = useState<number>(0);
  const { onSignUpSubmit: originalOnSignUpSubmit, isSubmitting } = useSignUpSubmit();

  // Phase 5: Always enable verification bypass
  const [bypassVerification] = useState(true);
  
  // Check localStorage for previously stored values on component mount
  useEffect(() => {
    const storedEmail = localStorage.getItem("pendingVerificationEmail");
    const storedName = localStorage.getItem("pendingVerificationName");
    const storedResendCount = localStorage.getItem("verificationResendCount");
    
    // Restore last verification session if it exists
    if (storedEmail && storedName) {
      setUserEmail(storedEmail);
      setUserName(storedName);
      setStep("verification");
    }
    
    if (storedResendCount) {
      setResendCount(Number(storedResendCount) || 0);
    }
    
    // Phase 5: Always set bypass verification to true
    localStorage.setItem("bypassVerification", "true");
  }, []);

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
      
      // Phase 5: Auto-redirect to profile setup since we're bypassing verification
      if (bypassVerification) {
        localStorage.setItem("emailVerified", "true");
        localStorage.setItem("verifiedEmail", values.email);
        
        // Short delay before redirecting to ensure state is updated
        setTimeout(() => {
          navigate('/profile-setup', { replace: true });
        }, 800);
      }
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
      
      // Phase 5: For bypass verification, redirect to profile setup after resend
      if (bypassVerification) {
        toast.success("Account created successfully!", {
          description: "Taking you to profile setup..."
        });
        
        // We'll still record that verification was sent for data completeness
        localStorage.setItem("emailVerified", "true");
        localStorage.setItem("verifiedEmail", userEmail);
        
        // Short delay before redirecting
        setTimeout(() => {
          navigate('/profile-setup', { replace: true });
        }, 1000);
      } else {
        toast.success("Verification email sent", {
          description: "Please check your inbox and spam folder."
        });
      }
      
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
