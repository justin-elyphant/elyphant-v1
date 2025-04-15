
import { SignUpFormValues } from "@/components/auth/signup/forms/SignUpForm";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { toast } from "sonner";

export const useSignUpSubmit = () => {
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  
  const onSignUpSubmit = async (values: SignUpFormValues) => {
    try {
      setIsSubmitting(true);
      console.log("Sign up initiated for", values.email);
      
      // Set a timeout to prevent hanging requests
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error("The signup request timed out. Please try again.")), 15000);
      });
      
      // Additional connectivity logging
      console.log("Verifying Supabase client configuration...");
      console.log("Auth configuration:", {
        autoRefreshToken: supabase.auth.onAuthStateChange ? "Configured" : "Not configured",
        persistSession: true
      });
      
      console.log("Sending signup request to Supabase...");
      
      const signupPromise = supabase.auth.signUp({
        email: values.email,
        password: values.password,
        options: {
          data: {
            name: values.name,
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      });
      
      // Race the signup against the timeout
      const { data: signUpData, error: signUpError } = await Promise.race([
        signupPromise,
        timeoutPromise.then(() => {
          throw new Error("Request timed out after 15 seconds. Please try again later.");
        })
      ]) as any;
      
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
      
      // User created successfully
      if (signUpData?.user) {
        console.log("User created successfully:", signUpData.user.id);
        
        toast.success("Account created successfully!", {
          description: "You can now sign in to your account."
        });
        
        // Store data for profile setup
        localStorage.setItem("userId", signUpData.user.id);
        localStorage.setItem("userEmail", values.email);
        localStorage.setItem("userName", values.name);
        localStorage.setItem("newSignUp", "true");
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
