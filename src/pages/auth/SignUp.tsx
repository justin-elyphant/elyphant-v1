
import React from "react";
import { useNavigate } from "react-router-dom";
import { useSignUpProcess } from "@/hooks/auth";
import SignUpContentWrapper from "@/components/auth/signup/SignUpContentWrapper";
import Header from "@/components/home/Header";
import { useAuth } from "@/contexts/auth";
import Footer from "@/components/home/Footer";

// Simplified list of keys to clear on fresh signup visits
const CLEAR_SIGNUP_KEYS = [
  "userIntent",
  "newSignUp",
  "showingIntentModal",
  "ctaIntent",
  "bypassVerification",
  "emailVerified",
  "verifiedEmail",
];

const SignUp: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Clear signup state for fresh starts (but preserve ongoing signup sessions)
  React.useEffect(() => {
    if (!user) {
      const hasOngoingSignup = localStorage.getItem("pendingVerificationEmail");
      
      if (!hasOngoingSignup) {
        console.log("[SignUp] Fresh visit - clearing signup state");
        CLEAR_SIGNUP_KEYS.forEach((key) => localStorage.removeItem(key));
      } else {
        console.log("[SignUp] Ongoing signup detected - preserving state");
      }
    }
  }, [user]);

  // Handle authenticated users
  React.useEffect(() => {
    const newSignUp = localStorage.getItem("newSignUp") === "true";
    const userIntent = localStorage.getItem("userIntent");
    const validIntent = userIntent === "giftor" || userIntent === "giftee";
    
    console.log("[SignUp] Auth check:", { user: !!user, newSignUp, userIntent, validIntent });

    if (user && (!newSignUp || validIntent)) {
      console.log("[SignUp] Authenticated user with valid state - navigating to dashboard");
      navigate("/dashboard", { replace: true });
    }
  }, [user, navigate]);

  const {
    step,
    userEmail,
    userName,
    onSignUpSubmit,
    handleBackToSignUp,
    isSubmitting,
    handleResendVerification,
    resendCount,
    bypassVerification = true,
  } = useSignUpProcess();

  // Set bypass verification flag
  React.useEffect(() => {
    localStorage.setItem("bypassVerification", "true");
    
    if (step === "verification") {
      localStorage.setItem("newSignUp", "true");
      console.log("[SignUp] Entered verification step - newSignUp flag set");
    }
    
    if (step === "signup") {
      localStorage.removeItem("newSignUp");
      console.log("[SignUp] Returned to signup step - newSignUp flag cleared");
    }
  }, [step]);

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <div className="container max-w-md mx-auto py-10 px-4 flex-grow flex items-center justify-center">
        <SignUpContentWrapper
          step={step as "signup" | "verification"}
          userEmail={userEmail}
          userName={userName}
          onSignUpSubmit={onSignUpSubmit}
          handleBackToSignUp={handleBackToSignUp}
          isSubmitting={isSubmitting}
          onResendVerification={handleResendVerification}
          resendCount={resendCount}
          bypassVerification={bypassVerification}
        />
      </div>
      <Footer />
    </div>
  );
};

export default SignUp;
