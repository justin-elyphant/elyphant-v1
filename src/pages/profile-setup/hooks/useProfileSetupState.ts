
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/auth";

export const useProfileSetupState = () => {
  const { user, isDebugMode = false, isLoading: authLoading } = useAuth();
  const [isInitializing, setIsInitializing] = useState(true);
  const [isNewSignUp, setIsNewSignUp] = useState(false);
  const [isManuallyLoading, setIsManuallyLoading] = useState(false);

  useEffect(() => {
    localStorage.removeItem("profileSetupLoading");
    
    const loadingTimeout = setTimeout(() => {
      setIsManuallyLoading(false);
      setIsInitializing(false);
    }, 3000);
    
    const newSignUpFlag = localStorage.getItem("newSignUp") === "true";
    setIsNewSignUp(newSignUpFlag);
    
    if (newSignUpFlag) {
      console.log("New signup detected, initializing immediately");
      setIsInitializing(false);
      clearTimeout(loadingTimeout);
    }
    
    return () => clearTimeout(loadingTimeout);
  }, [user, authLoading]);

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
