
import { SignUpFormValues } from "@/components/auth/signup/forms/SignUpForm";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { toast } from "sonner";

export const useSignUpSubmit = () => {
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  
  const onSignUpSubmit = async (values: SignUpFormValues) => {
    try {
      setIsSubmitting(true);
      console.log("Hybrid sign up initiated for", values.email);
      
      // Additional connectivity logging
      console.log("Verifying Supabase client configuration...");
      
      const signupResponse = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
        options: {
          data: {
            name: values.name,
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      });
      
      const { data: signUpData, error: signUpError } = signupResponse;
      
      console.log("Signup response received:", signUpData ? "Success" : "Failed");
      
      if (signUpError) {
        console.error("Signup error:", signUpError);
        
        if (signUpError.message.includes("already registered")) {
          toast.error("Email already registered", {
            description: "Please use a different email address or try signing in."
          });
        } else {
          toast.error("Sign up failed", {
            description: signUpError.message || "An unexpected error occurred"
          });
        }
        throw signUpError;
      }
      
      // User created successfully - immediately sign the user in
      if (signUpData?.user) {
        console.log("User created successfully:", signUpData.user.id);
        
        toast.success("Account created successfully!", {
          description: "We've sent a verification email (you can check it later)"
        });
        
        // Store data for profile setup - ensure it's reliable
        localStorage.setItem("userId", signUpData.user.id);
        localStorage.setItem("userEmail", values.email);
        localStorage.setItem("userName", values.name);
        localStorage.setItem("newSignUp", "true");
        
        // Try to sign the user in immediately after signup
        try {
          const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
            email: values.email,
            password: values.password
          });
          
          if (signInError) {
            console.error("Auto sign-in after signup failed:", signInError);
            // Continue with redirect anyway even if sign-in fails
          } else {
            console.log("Auto sign-in successful after signup");
          }
        } catch (signInErr) {
          console.error("Error during auto sign-in after signup:", signInErr);
          // Continue anyway, as user can log in later
        }
        
        // Force navigation to profile setup after short delay
        setTimeout(() => {
          console.log("Redirecting to profile setup");
          window.location.href = "/profile-setup";
        }, 1000);
      } else {
        console.error("No user data returned from signUp operation");
        throw new Error("Failed to create account. Please try again.");
      }
    } catch (err: any) {
      console.error("Signup submission error:", err);
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  };

  return { onSignUpSubmit, isSubmitting };
};
