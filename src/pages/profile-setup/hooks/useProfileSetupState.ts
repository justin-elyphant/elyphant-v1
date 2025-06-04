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
    console.log(
      "[useProfileSetupState] Effect triggered. AuthLoading:", authLoading, 
      "User:", !!user
    );
    
    // Clear any old loading flags
    localStorage.removeItem("profileSetupLoading");

    // If auth is still loading, keep initializing
    if (authLoading || !user) {
      console.log("[useProfileSetupState] Still initializing (auth loading or no user)");
      setIsInitializing(true);
      return;
    }

    // Check for stuck modal state and clear it
    const showingIntentModal = localStorage.getItem("showingIntentModal");
    if (showingIntentModal === "true") {
      console.log("[useProfileSetupState] Clearing stuck intent modal flag");
      localStorage.removeItem("showingIntentModal");
    }

    // At this point, authLoading is false AND user object exists
    const newSignUpFlag = localStorage.getItem("newSignUp") === "true";
    const intent = localStorage.getItem("userIntent");
    const validIntent = intent === "giftor" || intent === "giftee";

    console.log(
      "[useProfileSetupState] Auth loaded, user exists. newSignUpFlag:", newSignUpFlag,
      "intent:", intent, "validIntent:", validIntent
    );

    // If new signup without valid intent, redirect to signup page to show intent modal
    if (newSignUpFlag && !validIntent) {
      console.log("[useProfileSetupState] New signup without valid intent, redirecting to signup");
      setIsInitializing(true);
      navigate("/signup", { replace: true });
      return;
    }

    // If we have a giftor intent, redirect to marketplace instead of profile setup
    if (validIntent && intent === "giftor") {
      console.log("[useProfileSetupState] Giftor intent detected, redirecting to marketplace");
      setIsInitializing(true);
      navigate("/marketplace", { replace: true });
      return;
    }

    // If we reach here, we can safely initialize profile setup
    console.log("[useProfileSetupState] Conditions met for profile setup initialization");
    setIsNewSignUp(newSignUpFlag);
    setIsInitializing(false);
    setIsManuallyLoading(false);

  }, [user, authLoading, navigate]);

  // Add a fallback effect to clear stuck states after a timeout
  useEffect(() => {
    if (isInitializing && user && !authLoading) {
      const fallbackTimer = setTimeout(() => {
        console.log("[useProfileSetupState] Fallback: Clearing stuck initialization state");
        setIsInitializing(false);
      }, 3000); // 3 second fallback

      return () => clearTimeout(fallbackTimer);
    }
  }, [isInitializing, user, authLoading]);

  return {
    user,
    isDebugMode,
    authLoading,
    isInitializing,
    isNewSignUp,
    isManuallyLoading,
    setIsManuallyLoading,
  };
};
