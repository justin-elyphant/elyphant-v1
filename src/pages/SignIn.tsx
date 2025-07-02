
import React from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/auth";
import MainLayout from "@/components/layout/MainLayout";
import SignInView from "@/components/auth/signin/views/SignInView";

const SignIn = () => {
  const navigate = useNavigate();
  const { user, isLoading } = useAuth();
  const [searchParams] = useSearchParams();
  const redirectPath = searchParams.get('redirect') || '/dashboard';

  React.useEffect(() => {
    if (!isLoading && user) {
      navigate(redirectPath, { replace: true });
    }
  }, [user, isLoading, navigate, redirectPath]);

  const handleSignInSuccess = () => {
    navigate(redirectPath, { replace: true });
  };

  // Don't show loading state for too long to prevent timeouts
  if (isLoading) {
    return (
      <MainLayout>
        <div className="container max-w-md mx-auto py-10 px-4 flex-grow flex items-center justify-center">
          <div>Loading...</div>
        </div>
      </MainLayout>
    );
  }

  // If user is already logged in, redirect immediately
  if (user) {
    return null;
  }

  return (
    <MainLayout>
      <div className="container max-w-md mx-auto py-10 px-4 flex-grow flex items-center justify-center">
        <div className="w-full max-w-md">
          {/* Show redirect context if coming from protected route */}
          {searchParams.get('redirect') && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                Please sign in to access this feature
              </p>
            </div>
          )}
          <SignInView onSignInSuccess={handleSignInSuccess} />
        </div>
      </div>
    </MainLayout>
  );
};

export default SignIn;
