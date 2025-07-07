
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

    // CRITICAL: Check if auto-redirect is blocked by intent modal
    const isAutoRedirectBlocked = localStorage.getItem("blockAutoRedirect") === "true";
    if (isAutoRedirectBlocked) {
      console.log("[useAutoRedirect] Auto-redirect is blocked - intent modal is handling navigation");
      return;
    }

    // CRITICAL: COMPLETELY DISABLE auto-redirect during verification step
    // The intent modal in SignUpContentWrapper will handle ALL navigation
    if (step === "verification") {
      console.log("[useAutoRedirect] COMPLETELY BLOCKING auto-redirect - verification step requires intent modal selection");
      return;
    }

    // Only proceed during signup step if we have specific conditions
    if (step !== "signup" || !emailSent || !bypassVerification) {
      console.log("[useAutoRedirect] Conditions not met for auto-redirect");
      return;
    }

    // During signup step, we can potentially redirect if user already has intent
    const userIntent = localStorage.getItem("userIntent");
    const validIntent = userIntent === "giftor" || userIntent === "giftee";

    if (validIntent) {
      console.log("[useAutoRedirect] Valid intent during signup, redirecting");
      
      if (bypassVerification) {
        toast.success("Welcome back!", {
          description: "Redirecting to your dashboard."
        });
      }

      // Navigate based on intent with delay
      setTimeout(() => {
        if (userIntent === "giftor") {
          console.log("[useAutoRedirect] Navigating to /marketplace");
          navigate('/marketplace', { replace: true });
        } else if (userIntent === "giftee") {
          console.log("[useAutoRedirect] Navigating to streamlined signup for profile completion");
          navigate('/signup?intent=complete-profile', { replace: true });
        }
      }, 150);
    } else {
      console.log("[useAutoRedirect] No valid intent during signup - will proceed to verification step");
    }
  }, [emailSent, step, navigate, userEmail, userName, bypassVerification]);
  
  return null;
};
