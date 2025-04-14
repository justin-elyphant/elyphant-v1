
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

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

  // AUTO-REDIRECT TO PROFILE SETUP WHEN EMAIL IS SENT OR VERIFICATION IS BYPASSED
  useEffect(() => {
    if ((emailSent && step === "verification") || bypassVerification) {
      console.log("Auto-redirecting to profile setup from useAutoRedirect", { 
        emailSent, 
        step, 
        bypassVerification 
      });
      
      // Store in localStorage for persistence
      localStorage.setItem("newSignUp", "true");
      localStorage.setItem("userEmail", userEmail);
      localStorage.setItem("userName", userName || "");
      
      // Use navigate with replace to prevent back-button issues
      navigate('/profile-setup', { replace: true });
    }
  }, [emailSent, step, navigate, userEmail, userName, bypassVerification]);

  return null;
};
