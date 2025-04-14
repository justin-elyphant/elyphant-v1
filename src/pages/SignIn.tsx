
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
import { supabase } from "@/integrations/supabase/client";

const SignIn = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  
  // Handle redirects when user is already logged in
  useEffect(() => {
    if (user) {
      console.log("User already signed in, checking for redirect path");
      
      // Check for profile completion
      const checkProfileCompletion = async () => {
        // Check if we have a flag in localStorage indicating profile is completed
        const profileCompleted = localStorage.getItem("profileCompleted") === "true";
        if (profileCompleted) {
          handleRedirectAfterLogin();
          return;
        }

        try {
          const { data, error } = await supabase
            .from('profiles')
            .select('onboarding_completed')
            .eq('id', user.id)
            .single();
          
          if (error) {
            console.error("Error checking profile completion:", error);
            // If we can't check, assume profile needs to be completed
            navigate("/profile-setup", { replace: true });
            return;
          }
          
          if (data?.onboarding_completed) {
            // Profile is complete, set the flag and redirect
            localStorage.setItem("profileCompleted", "true");
            handleRedirectAfterLogin();
          } else {
            // Profile needs to be completed
            navigate("/profile-setup", { replace: true });
          }
        } catch (err) {
          console.error("Error in profile check:", err);
          navigate("/profile-setup", { replace: true });
        }
      };
      
      checkProfileCompletion();
    }
  }, [user, navigate]);

  const handleRedirectAfterLogin = () => {
    // Check if this is a new signup that needs to complete profile setup
    const isNewSignUp = localStorage.getItem("newSignUp") === "true";
    
    if (isNewSignUp) {
      console.log("Redirecting to profile setup to continue new signup");
      navigate("/profile-setup", { replace: true });
      return;
    }
    
    // Get the next steps option if available
    const nextStepsOption = localStorage.getItem("nextStepsOption");
    if (nextStepsOption) {
      console.log("Next steps option found:", nextStepsOption);
      
      // Navigate based on the selected option
      switch (nextStepsOption) {
        case "create_wishlist":
          navigate("/wishlists", { replace: true });
          break;
        case "find_friends":
          navigate("/connections", { replace: true });
          break;
        case "shop_gifts":
          navigate("/gifting", { replace: true });
          break;
        case "explore_marketplace":
          navigate("/marketplace", { replace: true });
          break;
        default:
          navigate("/dashboard", { replace: true });
          break;
      }
      
      // Clear this option after using it
      localStorage.removeItem("nextStepsOption");
      return;
    }
    
    // Check if there's a redirect path saved from the ProtectedRoute
    const redirectPath = localStorage.getItem("redirectAfterSignIn");
    
    if (redirectPath && redirectPath !== "/sign-in" && redirectPath !== "/sign-up") {
      console.log("Redirecting to previously attempted path:", redirectPath);
      localStorage.removeItem("redirectAfterSignIn");
      navigate(redirectPath, { replace: true });
    } else {
      console.log("No specific redirect, going to dashboard");
      navigate("/dashboard", { replace: true });
    }
  };

  const handleSignInSuccess = () => {
    // Set a flag to indicate this is coming from signin
    localStorage.setItem("fromSignIn", "true");
    
    // The redirection will be handled by the useEffect when user becomes available
    console.log("Sign in successful, awaiting user state update for redirect");
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
