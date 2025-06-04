
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
    console.log("[useAutoRedirect] Checking auto-redirect conditions", { 
      emailSent, 
      step, 
      userEmail, 
      bypassVerification 
    });

    // CRITICAL: NEVER auto-redirect during verification step - let the intent modal handle everything
    if (step === "verification") {
      console.log("[useAutoRedirect] BLOCKING auto-redirect - verification step requires intent modal first");
      return;
    }

    // Only proceed if we have email sent and bypass is enabled
    if (!emailSent || !bypassVerification) {
      console.log("[useAutoRedirect] Conditions not met for auto-redirect");
      return;
    }

    // Check if intent modal is currently showing
    const showingIntentModal = localStorage.getItem("showingIntentModal") === "true";
    if (showingIntentModal) {
      console.log("[useAutoRedirect] Intent modal is showing - blocking auto-redirect");
      return;
    }

    // Store user data for later use
    localStorage.setItem("newSignUp", "true");
    localStorage.setItem("userEmail", userEmail);
    localStorage.setItem("userName", userName || "");

    // Check if we have a valid intent
    const userIntent = localStorage.getItem("userIntent");
    const validIntent = userIntent === "giftor" || userIntent === "giftee";

    if (!validIntent) {
      console.log("[useAutoRedirect] No valid intent, will wait for intent modal");
      return;
    }

    // If we reach here, we have valid intent and can redirect
    if (bypassVerification) {
      toast.success("Account created successfully!", {
        description: "We've simplified your signup experience."
      });
    }

    // Navigate based on intent with delay
    setTimeout(() => {
      if (userIntent === "giftor") {
        console.log("[useAutoRedirect] Navigating to /marketplace");
        navigate('/marketplace', { replace: true });
      } else if (userIntent === "giftee") {
        console.log("[useAutoRedirect] Navigating to /profile-setup");
        navigate('/profile-setup', { replace: true });
      }
    }, 150);
  }, [emailSent, step, navigate, userEmail, userName, bypassVerification]);
  
  return null;
};
