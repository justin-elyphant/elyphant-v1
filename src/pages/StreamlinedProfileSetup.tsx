import React from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/auth";
import MainLayout from "@/components/layout/MainLayout";
import UnifiedOnboarding from "@/components/onboarding/UnifiedOnboarding";

const StreamlinedProfileSetup = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, isLoading } = useAuth();

  // Redirect all users to the stepped auth flow
  React.useEffect(() => {
    if (!isLoading) {
      if (!user) {
        navigate('/auth');
      } else {
        // Preserve invite attribution across the redirect.
        // Prefer URL param, fall back to localStorage (set by InvitePage).
        const inviteUser =
          searchParams.get('invite_user') ||
          localStorage.getItem('elyphant_invite_user') ||
          '';
        const params = new URLSearchParams({ mode: 'signup', oauth_resume: 'true' });
        if (inviteUser) params.set('invite_user', inviteUser);
        navigate(`/auth?${params.toString()}`, { replace: true });
      }
    }
  }, [user, isLoading, navigate, searchParams]);

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
