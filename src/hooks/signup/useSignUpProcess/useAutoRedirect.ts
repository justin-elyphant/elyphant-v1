
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
    // Only redirect if userIntent is present *and* valid ('giftor' or 'giftee')
    const userIntent = localStorage.getItem("userIntent");
    const validIntent = userIntent === "giftor" || userIntent === "giftee";
    console.log("[useAutoRedirect] Auto-redirect check", { emailSent, step, userEmail, userIntent, validIntent, bypassVerification });

    // -- BLOCK navigation in all cases unless we have a valid userIntent --
    if ((emailSent && step === "verification") || bypassVerification) {
      localStorage.setItem("newSignUp", "true");
      localStorage.setItem("userEmail", userEmail);
      localStorage.setItem("userName", userName || "");

      // -- CRITICAL: Only redirect if userIntent is set and valid --
      if (!validIntent) {
        // Never navigate if no valid userIntent (modal will show & handle it)
        console.log("[useAutoRedirect] BLOCKING navigation—waiting on valid intent (modal should be visible)", { step, userEmail, userIntent, validIntent, bypassVerification });
        return;
      }

      if (bypassVerification) {
        toast.success("Account created successfully!", {
          description: "We've simplified your signup experience."
        });
      }

      // If 'giftor', go to marketplace, else profile-setup
      if (userIntent === "giftor") {
        console.log("[useAutoRedirect] Navigating to /marketplace (userIntent = giftor)");
        navigate('/marketplace', { replace: true });
      } else if (userIntent === "giftee") {
        console.log("[useAutoRedirect] Navigating to /profile-setup (userIntent = giftee)");
        navigate('/profile-setup', { replace: true });
      }
    }
  }, [emailSent, step, navigate, userEmail, userName, bypassVerification]);
  
  return null;
};
