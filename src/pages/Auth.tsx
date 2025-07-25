
import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/auth";
import MainLayout from "@/components/layout/MainLayout";
import UnifiedAuthView from "@/components/auth/unified/UnifiedAuthView";

const Auth = () => {
  const navigate = useNavigate();
  const { user, isLoading } = useAuth();

  React.useEffect(() => {
    // Don't redirect if modal is in signup flow - let the modal handle navigation
    const inSignupFlow = localStorage.getItem('modalInSignupFlow') === 'true';
    
    if (!isLoading && user && !inSignupFlow) {
      console.log("🚪 Auth page: Redirecting authenticated user to dashboard");
      navigate("/dashboard", { replace: true });
    } else if (user && inSignupFlow) {
      console.log("🚀 Auth page: User authenticated but in signup flow - not redirecting");
    }
  }, [user, isLoading, navigate]);

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

  return (
    <MainLayout>
      <div className="container max-w-md mx-auto py-10 px-4 flex-grow flex items-center justify-center">
        <UnifiedAuthView />
      </div>
    </MainLayout>
  );
};

export default Auth;
