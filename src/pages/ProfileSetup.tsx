
import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/auth";
import { toast } from "sonner";
import ProfileSetupFlow from "@/components/profile-setup/ProfileSetupFlow";

const ProfileSetup: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // Check if user is logged in
  useEffect(() => {
    if (!user) {
      toast.error("Please sign in to continue");
      navigate("/sign-in");
    }
  }, [user, navigate]);
  
  const handleComplete = () => {
    toast.success("Profile setup complete!");
    navigate("/dashboard");
  };
  
  const handleSkip = () => {
    toast.info("You can complete your profile later in settings");
    navigate("/dashboard");
  };
  
  // If not logged in, redirect to login
  if (!user) {
    return null;
  }

  return (
    <div className="container max-w-4xl mx-auto py-10 px-4">
      <ProfileSetupFlow onComplete={handleComplete} onSkip={handleSkip} />
    </div>
  );
};

export default ProfileSetup;
