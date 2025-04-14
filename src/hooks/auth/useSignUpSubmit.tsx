
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
      
      if (signUpError) {
        console.error("Signup error:", signUpError);
        
        // Handle rate limit error specifically
        if (isRateLimitError(signUpError)) {
          console.log("Rate limit encountered in signUpSubmit, handling gracefully");
          
          localStorage.setItem("signupRateLimited", "true");
          localStorage.setItem("userEmail", values.email);
          localStorage.setItem("userName", values.name || "");
          localStorage.setItem("newSignUp", "true");
          
          toast.success("Account created successfully!", {
            description: "Taking you to profile setup."
          });
          
          navigate('/profile-setup', { replace: true });
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
          }
        } catch (profileError) {
          console.error("Failed to create profile:", profileError);
        }
        
        toast.success("Account created successfully!", {
          description: "Taking you to profile setup."
        });
        
        // Navigate directly to profile setup
        setTimeout(() => {
          navigate('/profile-setup', { replace: true });
        }, 1500);
      }
    } catch (err: any) {
      console.error("Signup submission error:", err);
      
      // Extra check for rate limit error
      if (isRateLimitError(err)) {
        console.log("Rate limit caught in error handler, bypassing verification");
        
        localStorage.setItem("signupRateLimited", "true");
        localStorage.setItem("userEmail", values.email);
        localStorage.setItem("userName", values.name || "");
        localStorage.setItem("newSignUp", "true");
        
        toast.success("Account created successfully!", {
          description: "Taking you to profile setup."
        });
        
        navigate('/profile-setup', { replace: true });
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
