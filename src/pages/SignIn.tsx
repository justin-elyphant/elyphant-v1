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
import { useAuth } from "@/contexts/auth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const SignIn = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  
  // Enhanced logging for debugging
  useEffect(() => {
    console.log("SignIn Page - Current User:", user);
    console.log("SignIn Page - Local Storage Flags:", {
      newSignUp: localStorage.getItem("newSignUp"),
      profileCompleted: localStorage.getItem("profileCompleted"),
      nextStepsOption: localStorage.getItem("nextStepsOption"),
      signupRateLimited: localStorage.getItem("signupRateLimited")
    });
  }, [user]);
  
  // Handle redirects when user is already logged in
  useEffect(() => {
    if (user) {
      console.log("User already signed in, checking for redirect path");
      
      // Check for rate limited signup
      const isRateLimited = localStorage.getItem("signupRateLimited") === "true";
      if (isRateLimited) {
        console.log("This was a rate-limited signup, redirecting to profile setup");
        navigate("/profile-setup", { replace: true });
        return;
      }
      
      // Check for profile completion
      const checkProfileCompletion = async () => {
        console.log("Checking profile completion in SignIn");
        
        // Check if we have a flag in localStorage indicating profile is completed
        const profileCompleted = localStorage.getItem("profileCompleted") === "true";
        const isNewSignUp = localStorage.getItem("newSignUp") === "true";
        const nextStepsOption = localStorage.getItem("nextStepsOption");
        
        console.log("Profile completion check:", {
          profileCompleted,
          isNewSignUp,
          nextStepsOption
        });

        try {
          const { data, error } = await supabase
            .from('profiles')
            .select('onboarding_completed')
            .eq('id', user.id)
            .single();
          
          if (error) {
            console.error("Error checking profile completion:", error);
            toast.error("Error checking your profile status");
            navigate("/profile-setup", { replace: true });
            return;
          }
          
          console.log("Profile data from database:", data);
          
          if (data?.onboarding_completed || profileCompleted) {
            console.log("Profile is complete, redirecting based on next steps");
            // Use the same redirection logic from previous implementation
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
            
            // Clear flags after successful redirection
            localStorage.removeItem("newSignUp");
            localStorage.removeItem("nextStepsOption");
          } else {
            console.log("Onboarding not completed, redirecting to profile setup");
            navigate("/profile-setup", { replace: true });
          }
        } catch (err) {
          console.error("Error in profile check:", err);
          toast.error("Error checking your profile status");
          navigate("/profile-setup", { replace: true });
        }
      };
      
      checkProfileCompletion();
    }
  }, [user, navigate]);

  const handleSignInSuccess = () => {
    // Set a flag to indicate this is coming from signin
    localStorage.setItem("fromSignIn", "true");
    
    // The redirection will be handled by the useEffect when user becomes available
    console.log("Sign in successful, awaiting user state update for redirect");
  };

  return (
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
  );
};

export default SignIn;
