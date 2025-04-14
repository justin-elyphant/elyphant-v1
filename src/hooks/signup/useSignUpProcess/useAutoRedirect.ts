
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

interface UseAutoRedirectProps {
  emailSent: boolean;
  step: "signup" | "verification";
  userEmail: string;
  userName: string;
}

export const useAutoRedirect = ({
  emailSent,
  step,
  userEmail,
  userName
}: UseAutoRedirectProps) => {
  const navigate = useNavigate();

  // AUTO-REDIRECT TO PROFILE SETUP WHEN EMAIL IS SENT
  useEffect(() => {
    if (emailSent && step === "verification") {
      console.log("Auto-redirecting to profile setup from useAutoRedirect");
      
      // Store in localStorage for persistence
      localStorage.setItem("newSignUp", "true");
      localStorage.setItem("userEmail", userEmail);
      localStorage.setItem("userName", userName || "");
      
      // Use navigate with replace to prevent back-button issues
      navigate('/profile-setup', { replace: true });
    }
  }, [emailSent, step, navigate, userEmail, userName]);

  return null;
};
