
import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/auth";
import OnboardingFlow from "@/components/onboarding/OnboardingFlow";

const OnboardingPage = () => {
  const { user, isLoading } = useAuth();
  
  // Check if onboarding has been completed
  const onboardingComplete = localStorage.getItem("onboardingComplete") === "true";
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }
  
  // If not logged in, redirect to login
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  // If onboarding already completed, redirect to dashboard
  if (onboardingComplete && !localStorage.getItem("newSignUp")) {
    return <Navigate to="/dashboard" replace />;
  }
  
  // Show the onboarding flow
  return <OnboardingFlow />;
};

export default OnboardingPage;
