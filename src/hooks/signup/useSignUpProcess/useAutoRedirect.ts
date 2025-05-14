
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
    // Only redirect if we are NOT at onboarding-blocked modal: userIntent must exist
    const userIntent = localStorage.getItem("userIntent");
    if ((emailSent && step === "verification") || bypassVerification) {
      localStorage.setItem("newSignUp", "true");
      localStorage.setItem("userEmail", userEmail);
      localStorage.setItem("userName", userName || "");

      // -- CRITICAL: Only redirect if userIntent is set --
      if (!userIntent) {
        console.log("[useAutoRedirect] BLOCKING navigation—no onboarding intent chosen", { step, userEmail, bypassVerification });
        return; // Don't navigate yet—the modal will trigger it
      }

      if (bypassVerification) {
        toast.success("Account created successfully!", {
          description: "We've simplified your signup experience."
        });
      }

      console.log("[useAutoRedirect] Navigating to /profile-setup (userIntent exists)", { userIntent });
      navigate('/profile-setup', { replace: true });
    }
  }, [emailSent, step, navigate, userEmail, userName, bypassVerification]);
  
  return null;
};
