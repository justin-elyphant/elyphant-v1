
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

interface UseAutoRedirectProps {
  emailSent: boolean;
  step: "signup" | "verification";
  userEmail: string;
  userName: string;
  bypassVerification?: boolean;
}

export const useAutoRedirect = ({
  emailSent,
  step,
  userEmail,
  userName,
  bypassVerification = false
}: UseAutoRedirectProps) => {
  const navigate = useNavigate();

  useEffect(() => {
    // Only handle verification step redirects, not signup completion
    // The signup flow is now handled in SignUpContentWrapper
    if (step === "verification" && (emailSent || bypassVerification)) {
      console.log("[useAutoRedirect] In verification step", { emailSent, userEmail, bypassVerification });
      
      localStorage.setItem("userEmail", userEmail);
      localStorage.setItem("userName", userName || "");

      if (bypassVerification) {
        toast.success("Account created successfully!", {
          description: "Welcome to Elyphant!"
        });
        
        // Check if onboarding was completed
        const onboardingComplete = localStorage.getItem("onboardingComplete") === "true";
        const userIntent = localStorage.getItem("userIntent");
        
        if (onboardingComplete) {
          console.log("[useAutoRedirect] Onboarding complete, navigating to profile setup");
          navigate('/profile-setup', { replace: true });
        } else {
          console.log("[useAutoRedirect] No onboarding completed, staying on verification");
        }
      }
    }
  }, [emailSent, step, navigate, userEmail, userName, bypassVerification]);
  
  return null;
};
