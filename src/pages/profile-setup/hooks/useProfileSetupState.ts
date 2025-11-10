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
    // Optimized logging - only log when state changes meaningfully
    if (process.env.NODE_ENV === 'development' && (authLoading || !user)) {
      console.log("[useProfileSetupState] Auth state:", { authLoading, hasUser: !!user });
    }

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
    const intent = localStorage.getItem("userIntent"); // OLD: giftor/giftee
    const signupContext = localStorage.getItem("signupContext"); // NEW: gift_recipient/gift_giver

    // Check for BOTH old and new signup context patterns
    const validOldIntent = intent === "giftor" || intent === "giftee";
    const validNewContext = signupContext === "gift_recipient" || signupContext === "gift_giver";
    const hasValidContext = validOldIntent || validNewContext;

    console.log(
      "[useProfileSetupState] Auth loaded, user exists. newSignUpFlag:", newSignUpFlag,
      "oldIntent:", intent, "newSignupContext:", signupContext, "hasValidContext:", hasValidContext
    );

    // If new signup without ANY valid context (old OR new), redirect to signup page
    if (newSignUpFlag && !hasValidContext) {
      console.log("[useProfileSetupState] New signup without valid context, redirecting to signup");
      setIsInitializing(true);
      navigate("/signup", { replace: true });
      return;
    }

    // If we have a giftor/gift_giver context, redirect to marketplace/gifting instead of profile setup
    if (hasValidContext && (intent === "giftor" || signupContext === "gift_giver")) {
      console.log("[useProfileSetupState] Gift giver detected, redirecting to marketplace");
      setIsInitializing(true);
      navigate("/marketplace", { replace: true });
      return;
    }

    // Check if profile setup is already complete
    const completionState = localStorage.getItem('profileCompletionState');
    if (!completionState && !newSignUpFlag) {
      console.log("[useProfileSetupState] No profile completion state and not new signup, redirecting to dashboard");
      setIsInitializing(true);
      navigate("/", { replace: true });
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
