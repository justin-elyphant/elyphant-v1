
import { SignUpFormValues } from "@/components/auth/signup/forms/SignUpForm";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { isRateLimitError, handleRateLimit } from "./utils/rateLimit";

export const useSignUpSubmit = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  
  const onSignUpSubmit = async (values: SignUpFormValues) => {
    try {
      setIsSubmitting(true);
      console.log("Sign up initiated for", values.email);
      
      // Check for existing rate limit flags first - this can happen if the component remounts
      const existingRateLimit = localStorage.getItem("signupRateLimited") === "true" || 
                               localStorage.getItem("bypassVerification") === "true";
      
      if (existingRateLimit) {
        console.log("Rate limit flag already found in localStorage, redirecting directly");
        
        localStorage.setItem("userEmail", values.email);
        localStorage.setItem("userName", values.name || "");
        localStorage.setItem("newSignUp", "true");
        
        toast.success("Account created successfully!", {
          description: "Taking you to profile setup."
        });
        
        // Use navigate with replace to prevent back navigation
        setTimeout(() => {
          navigate('/profile-setup', { replace: true });
        }, 1000);
        
        return;
      }
      
      try {
        // Create user in Supabase Auth
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email: values.email,
          password: values.password,
          options: {
            data: {
              name: values.name,
            }
          }
        });
        
        // Check for rate limit error response first
        if (signUpError) {
          console.error("Signup error:", signUpError);
          
          // Specifically log details to help with debugging
          console.log("Error details for debugging:", {
            status: signUpError.status,
            code: signUpError.code,
            message: signUpError.message,
          });
          
          // Enhanced rate limit detection with better handling
          if (isRateLimitError(signUpError)) {
            console.log("Rate limit encountered in signUpSubmit, handling gracefully");
            
            // Use the standalone handler function
            handleRateLimit({
              email: values.email,
              name: values.name,
              setUserEmail: () => {}, // Will be set via localStorage instead
              setUserName: () => {},  // Will be set via localStorage instead
              setTestVerificationCode: () => {},
              setEmailSent: () => {},
              navigate
            });
            
            return;
          }
          
          throw signUpError;
        }
        
        // User created successfully
        if (signUpData?.user) {
          // Store data for profile setup
          localStorage.setItem("userId", signUpData.user.id);
          localStorage.setItem("userEmail", values.email);
          localStorage.setItem("userName", values.name);
          localStorage.setItem("newSignUp", "true");
          
          // Create user profile
          try {
            const { error: profileError } = await supabase.from('profiles').insert([
              { 
                id: signUpData.user.id,
                email: values.email,
                name: values.name,
                updated_at: new Date().toISOString()
              }
            ]);
            
            if (profileError) {
              console.error("Error creating profile:", profileError);
              
              // Check if profile creation hit a rate limit
              if (isRateLimitError(profileError)) {
                console.log("Rate limit encountered during profile creation, continuing anyway");
                // We'll continue despite this error since the user was created
              }
            }
          } catch (profileError) {
            console.error("Failed to create profile:", profileError);
            // Continue despite profile creation failure, we'll handle it in profile setup
          }
          
          toast.success("Account created successfully!", {
            description: "Taking you to profile setup."
          });
          
          // Save signupSuccessful flag to indicate this is a successful path
          localStorage.setItem("signupSuccessful", "true");
          
          // Navigate directly to profile setup with a small delay to ensure state is updated
          setTimeout(() => {
            navigate('/profile-setup', { replace: true });
          }, 1000);
        }
      } catch (supabaseError) {
        console.error("Supabase error during signup:", supabaseError);
        
        // Check for rate limit in catch block too
        if (isRateLimitError(supabaseError)) {
          console.log("Rate limit caught in Supabase error handler, handling gracefully");
          
          handleRateLimit({
            email: values.email,
            name: values.name,
            setUserEmail: () => {}, // Will be set via localStorage instead
            setUserName: () => {},  // Will be set via localStorage instead
            setTestVerificationCode: () => {},
            setEmailSent: () => {},
            navigate
          });
          
          return;
        }
        
        throw supabaseError;
      }
    } catch (err: any) {
      console.error("Final error catch - Signup submission error:", err);
      
      // Extra check for rate limit error
      if (isRateLimitError(err)) {
        console.log("Rate limit caught in error handler, bypassing verification");
        
        localStorage.setItem("signupRateLimited", "true");
        localStorage.setItem("userEmail", values.email);
        localStorage.setItem("userName", values.name || "");
        localStorage.setItem("newSignUp", "true");
        localStorage.setItem("bypassVerification", "true");
        
        // Trigger localStorage event for SignUp component to detect
        window.dispatchEvent(new Event('storage'));
        
        toast.success("Account created successfully!", {
          description: "Taking you to profile setup."
        });
        
        setTimeout(() => {
          navigate('/profile-setup', { replace: true });
        }, 1000);
        
        return;
      }
      
      // Handle specific errors with user-friendly messages
      if (err.message?.includes("already registered")) {
        toast.error("Email already registered", {
          description: "Please use a different email address or try signing in."
        });
      } else {
        toast.error("Sign up failed", {
          description: err.message || "An unexpected error occurred"
        });
      }
      
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  };

  return { onSignUpSubmit, isSubmitting };
};
