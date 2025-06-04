
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
    // Only redirect if we have the conditions for it
    const userIntent = localStorage.getItem("userIntent");
    const validIntent = userIntent === "giftor" || userIntent === "giftee";
    const showingIntentModal = localStorage.getItem("showingIntentModal") === "true";
    
    console.log("[useAutoRedirect] Auto-redirect check", { 
      emailSent, 
      step, 
      userEmail, 
      userIntent, 
      validIntent, 
      bypassVerification,
      showingIntentModal 
    });

    // Don't redirect if intent modal is showing or should be showing
    if (showingIntentModal || ((emailSent && step === "verification") && !validIntent)) {
      console.log("[useAutoRedirect] BLOCKING navigation—intent modal should handle this");
      return;
    }

    if ((emailSent && step === "verification") || bypassVerification) {
      localStorage.setItem("newSignUp", "true");
      localStorage.setItem("userEmail", userEmail);
      localStorage.setItem("userName", userName || "");

      // Only redirect if userIntent is valid
      if (!validIntent) {
        console.log("[useAutoRedirect] No valid intent, staying on verification page for modal");
        return;
      }

      if (bypassVerification) {
        toast.success("Account created successfully!", {
          description: "We've simplified your signup experience."
        });
      }

      // Navigate based on intent with a small delay to ensure state is ready
      setTimeout(() => {
        if (userIntent === "giftor") {
          console.log("[useAutoRedirect] Navigating to /onboarding-gift (userIntent = giftor)");
          navigate('/onboarding-gift', { replace: true });
        } else if (userIntent === "giftee") {
          console.log("[useAutoRedirect] Navigating to /profile-setup (userIntent = giftee)");
          navigate('/profile-setup', { replace: true });
        }
      }, 150);
    }
  }, [emailSent, step, navigate, userEmail, userName, bypassVerification]);
  
  return null;
};
