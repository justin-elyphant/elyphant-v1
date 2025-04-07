
import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/auth";
import ProfileSetupFlow from "@/components/profile-setup/ProfileSetupFlow";

const ProfileSetup: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const handleComplete = () => {
    navigate("/dashboard");
  };
  
  const handleSkip = () => {
    navigate("/dashboard");
  };
  
  // If not logged in, redirect to login
  if (!user) {
    navigate("/sign-in");
    return null;
  }

  return (
    <div className="container max-w-4xl mx-auto py-10 px-4">
      <ProfileSetupFlow onComplete={handleComplete} onSkip={handleSkip} />
    </div>
  );
};

export default ProfileSetup;
