import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/auth";
import MainLayout from "@/components/layout/MainLayout";
import UnifiedOnboarding from "@/components/onboarding/UnifiedOnboarding";

const StreamlinedProfileSetup = () => {
  const navigate = useNavigate();
  const { user, isLoading } = useAuth();

  // Redirect all users to the stepped auth flow
  React.useEffect(() => {
    if (!isLoading) {
      if (!user) {
        navigate('/auth');
      } else {
        // Authenticated user needing profile setup → stepped flow
        navigate('/auth?mode=signup&oauth_resume=true', { replace: true });
      }
    }
  }, [user, isLoading, navigate]);

  if (isLoading) {
    return (
      <MainLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full"></div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container max-w-2xl mx-auto py-10 px-4 flex-grow flex items-center justify-center">
        <div className="w-full">
          <UnifiedOnboarding />
        </div>
      </div>
    </MainLayout>
  );
};

export default StreamlinedProfileSetup;
