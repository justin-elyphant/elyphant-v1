
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
    // Persist new signup and user data
    if ((emailSent && step === "verification") || bypassVerification) {
      localStorage.setItem("newSignUp", "true");
      localStorage.setItem("userEmail", userEmail);
      localStorage.setItem("userName", userName || "");

      // Don't auto-redirect to /profile-setup if user intent not chosen yet (let modal show)
      const isNewSignUp = localStorage.getItem("newSignUp") === "true";
      const userIntent = localStorage.getItem("userIntent");

      if (isNewSignUp && !userIntent) {
        // Do not navigate; onboarding modal should show
        return;
      }

      if (bypassVerification) {
        toast.success("Account created successfully!", {
          description: "We've simplified your signup experience."
        });
      }

      navigate('/profile-setup', { replace: true });
    }
  }, [emailSent, step, navigate, userEmail, userName, bypassVerification]);

  return null;
};
