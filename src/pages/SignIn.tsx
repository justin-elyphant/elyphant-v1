
import React, { useEffect } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { EmailPasswordForm } from "@/components/auth/signin/EmailPasswordForm";
import { SocialLoginButtons } from "@/components/auth/signin/SocialLoginButtons";
import MainLayout from "@/components/layout/MainLayout";
import { useAuth } from "@/contexts/auth";

const SignIn = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  
  // Handle redirects when user is already logged in
  useEffect(() => {
    if (user) {
      console.log("User already signed in, checking for redirect path");
      
      // Check if there's a redirect path saved from the ProtectedRoute
      const redirectPath = localStorage.getItem("redirectAfterSignIn");
      
      // Check if this is a new signup that needs to complete profile setup
      const isNewSignUp = localStorage.getItem("newSignUp") === "true";
      
      if (isNewSignUp) {
        console.log("Redirecting to profile setup to continue new signup");
        navigate("/profile-setup", { replace: true });
      } else if (redirectPath && redirectPath !== "/sign-in" && redirectPath !== "/sign-up") {
        console.log("Redirecting to previously attempted path:", redirectPath);
        localStorage.removeItem("redirectAfterSignIn");
        navigate(redirectPath, { replace: true });
      } else {
        console.log("No specific redirect, going to dashboard");
        navigate("/dashboard", { replace: true });
      }
    }
  }, [user, navigate]);

  const handleSignInSuccess = () => {
    // Get the intended destination after sign-in
    const redirectPath = localStorage.getItem("redirectAfterSignIn");
    const isNewSignUp = localStorage.getItem("newSignUp") === "true";
    
    if (isNewSignUp) {
      // If this was a new signup, continue to profile setup
      console.log("Continuing to profile setup after sign in");
      navigate("/profile-setup", { replace: true });
    } else if (redirectPath && redirectPath !== "/sign-in" && redirectPath !== "/sign-up") {
      // Clear the stored path
      localStorage.removeItem("redirectAfterSignIn");
      console.log("Redirecting to:", redirectPath);
      navigate(redirectPath, { replace: true });
    } else {
      // Default to dashboard
      console.log("No specific redirect path, going to dashboard");
      navigate("/dashboard", { replace: true });
    }
  };

  return (
    <MainLayout>
      <div className="container max-w-md mx-auto py-10 px-4">
        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold">Sign In</CardTitle>
            <CardDescription>
              Enter your credentials to access your account
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <EmailPasswordForm onSuccess={handleSignInSuccess} />
            
            <div className="relative my-4 w-full">
              <Separator />
              <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-2 text-xs text-muted-foreground">
                OR CONTINUE WITH
              </span>
            </div>
            
            <SocialLoginButtons />
          </CardContent>
          
          <CardFooter className="flex flex-col">
            <div className="text-sm text-muted-foreground text-center mt-4">
              Don't have an account?{" "}
              <Link to="/sign-up" className="text-primary underline-offset-4 hover:underline">
                Sign up
              </Link>
            </div>
          </CardFooter>
        </Card>
      </div>
    </MainLayout>
  );
};

export default SignIn;
