
import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/auth";
import MainLayout from "@/components/layout/MainLayout";
import SignInView from "@/components/auth/signin/views/SignInView";

const SignIn = () => {
  const navigate = useNavigate();
  const { user, isLoading } = useAuth();

  React.useEffect(() => {
    if (!isLoading && user) {
      navigate("/dashboard", { replace: true });
    }
  }, [user, isLoading, navigate]);

  const handleSignInSuccess = () => {
    navigate("/dashboard", { replace: true });
  };

  // Simplified loading to prevent timeouts
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
        <SignInView onSignInSuccess={handleSignInSuccess} />
      </div>
    </MainLayout>
  );
};

export default SignIn;
