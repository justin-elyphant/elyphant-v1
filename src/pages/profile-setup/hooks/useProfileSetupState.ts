
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/auth";
import { useNavigate } from "react-router-dom";

export const useProfileSetupState = () => {
  const { user, isDebugMode = false, isLoading: authLoading } = useAuth();
  const [isInitializing, setIsInitializing] = useState(true);
  const [isNewSignUp, setIsNewSignUp] = useState(false);
  const [isManuallyLoading, setIsManuallyLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    localStorage.removeItem("profileSetupLoading");
    
    // NEW BLOCK: If this is a new sign up and userIntent not chosen, redirect to signup to force intent modal
    const newSignUpFlag = localStorage.getItem("newSignUp") === "true";
    const intent = localStorage.getItem("userIntent");
    const validIntent = intent === "giftor" || intent === "giftee";
    if (newSignUpFlag && !validIntent) {
      // We aren't ready for profile setup, force back to /signup (modal will block navigation from there)
      navigate("/signup", { replace: true });
      return;
    }

    const loadingTimeout = setTimeout(() => {
      setIsManuallyLoading(false);
      setIsInitializing(false);
    }, 3000);

    setIsNewSignUp(newSignUpFlag);

    if (newSignUpFlag) {
      console.log("New signup detected, initializing immediately");
      setIsInitializing(false);
      clearTimeout(loadingTimeout);
    }
    
    return () => clearTimeout(loadingTimeout);
  }, [user, authLoading, navigate]);

  return {
    user,
    isDebugMode,
    authLoading,
    isInitializing,
    isNewSignUp,
    isManuallyLoading,
    setIsManuallyLoading
  };
};
