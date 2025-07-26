
import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/auth";
import MainLayout from "@/components/layout/MainLayout";
import UnifiedAuthView from "@/components/auth/unified/UnifiedAuthView";

const Auth = () => {
  const navigate = useNavigate();
  const { user, isLoading } = useAuth();

  // Redirect authenticated users to homepage
  useEffect(() => {
    if (user && !isLoading) {
      console.log("🏠 User already authenticated, redirecting to homepage");
      navigate("/", { replace: true });
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
        <div className="text-center space-y-4 mb-8">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Welcome Back
          </h1>
          <p className="text-muted-foreground">
            Sign in to continue your gifting journey
          </p>
        </div>
        
        <UnifiedAuthView />
      </div>
    </MainLayout>
  );
};

export default Auth;
