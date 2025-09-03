
import React, { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/auth";
import MainLayout from "@/components/layout/MainLayout";
import UnifiedAuthView from "@/components/auth/unified/UnifiedAuthView";
import { InvitationSignupFlow } from "@/components/auth/InvitationSignupFlow";

const Auth = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, isLoading } = useAuth();
  
  // Check if this is an invitation flow
  const isInvitationFlow = searchParams.has('invitation_id');

  // Redirect authenticated users to the appropriate page
  useEffect(() => {
    if (user && !isLoading) {
      const redirectPath = searchParams.get('redirect') || '/';
      console.log("🏠 User already authenticated, redirecting to:", redirectPath);
      navigate(redirectPath, { replace: true });
    }
  }, [user, isLoading, navigate, searchParams]);

  if (isLoading) {
    return (
      <MainLayout>
        <div className="container max-w-md mx-auto py-10 px-4 flex-grow flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Loading...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  // Show invitation-specific flow if applicable
  if (isInvitationFlow) {
    return <InvitationSignupFlow />;
  }

  return (
    <MainLayout>
      <div className="container max-w-md mx-auto py-10 px-4 flex-grow flex items-center justify-center">
        <UnifiedAuthView />
      </div>
    </MainLayout>
  );
};

export default Auth;
