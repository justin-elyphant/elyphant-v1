
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/auth";
import { useNavigate } from "react-router-dom";

export const useProfileSetupState = () => {
  const { user, isDebugMode = false, isLoading: authLoading } = useAuth();
  const [isInitializing, setIsInitializing] = useState(true); // Start as true
  const [isNewSignUp, setIsNewSignUp] = useState(false);
  const [isManuallyLoading, setIsManuallyLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    console.log(
      "[useProfileSetupState] Effect triggered. AuthLoading:", authLoading, 
      "User:", !!user
    );
    // Clear any old manual loading flag from localStorage if it was used previously
    localStorage.removeItem("profileSetupLoading");

    // If auth is still loading, or if there's no user yet (even if auth isn't "loading" but session not yet established),
    // we are still in an initializing phase for this page's logic.
    if (authLoading || !user) {
      console.log("[useProfileSetupState] Still initializing (auth loading or no user). Keeping isInitializing=true.");
      setIsInitializing(true); // Ensure it stays true
      return;
    }

    // At this point, authLoading is false AND user object exists.
    const newSignUpFlag = localStorage.getItem("newSignUp") === "true";
    const intent = localStorage.getItem("userIntent");
    const validIntent = intent === "giftor" || intent === "giftee";

    console.log(
      "[useProfileSetupState] Auth loaded, user exists. newSignUpFlag:", newSignUpFlag,
      "intent:", intent, "validIntent:", validIntent
    );

    if (newSignUpFlag && !validIntent) {
      console.log("[useProfileSetupState] New signup, intent not valid/chosen. Redirecting to /signup.");
      // We are redirecting. Profile setup page should not fully initialize its content.
      // isInitializing should remain true. The navigation will trigger a new render cycle.
      setIsInitializing(true); 
      navigate("/signup", { replace: true });
      return; // Crucial: stop further processing in this effect run.
    }

    // If we reach here:
    // 1. User exists.
    // 2. It's NOT a new sign-up that needs intent selection (either not new, or new with intent already set).
    // So, we can safely finalize initialization for the ProfileSetup page.
    console.log("[useProfileSetupState] Conditions met to finalize initialization. Setting isInitializing=false.");
    setIsNewSignUp(newSignUpFlag); 
    setIsInitializing(false);     // Mark initialization as complete for this page
    setIsManuallyLoading(false);  // Reset any manual loading state

  }, [user, authLoading, navigate]);

  return {
    user,
    isDebugMode,
    authLoading, // Pass through authLoading for direct use in component if needed
    isInitializing, // This is our key state for controlling the loading screen
    isNewSignUp,
    isManuallyLoading,
    setIsManuallyLoading,
  };
};
