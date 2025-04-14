
import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { SignUpFormValues } from "@/components/auth/signup/forms/SignUpForm";
import { signUpUser, sendVerificationEmail } from "@/hooks/signup/signupService";
import { extractVerificationCode } from "@/hooks/signup/services/email/utils/responseParser";
import { supabase } from "@/integrations/supabase/client";

interface UseSignUpSubmitProps {
  setUserEmail: (email: string) => void;
  setUserName: (name: string) => void;
  setEmailSent: (sent: boolean) => void;
  setStep: (step: "signup" | "verification") => void;
  setTestVerificationCode: (code: string | null) => void;
}

export const useSignUpSubmit = ({
  setUserEmail,
  setUserName,
  setEmailSent,
  setStep,
  setTestVerificationCode
}: UseSignUpSubmitProps) => {
  
  const onSignUpSubmit = async (values: SignUpFormValues) => {
    try {
      console.log("Sign up initiated for", values.email);
      
      const result = await signUpUser(values, null, null);
      
      if (!result) {
        toast.error("Signup failed", {
          description: "Unable to create account. Please try again.",
        });
        return;
      }
      
      console.log("User created successfully:", result);
      
      // Store user ID in localStorage for reliability
      if (result.user?.id) {
        localStorage.setItem("userId", result.user.id);
        localStorage.setItem("userEmail", values.email);
        localStorage.setItem("userName", values.name || '');
      }
      
      setUserEmail(values.email);
      setUserName(values.name);
      
      // Create a profile using the edge function
      if (result.user?.id) {
        console.log("Creating profile for user:", result.user.id);
        
        try {
          const response = await supabase.functions.invoke('create-profile', {
            body: {
              user_id: result.user.id,
              profile_data: {
                email: values.email,
                name: values.name,
                updated_at: new Date().toISOString()
              }
            }
          });
          
          if (response.error) {
            console.error("Error creating profile via edge function:", response.error);
            toast.error("Profile creation failed", {
              description: "Your account was created but we couldn't set up your profile."
            });
          } else {
            console.log("Profile created successfully via edge function:", response.data);
          }
        } catch (err) {
          console.error("Error calling create-profile function:", err);
        }
      } else {
        console.warn("No user ID available after signup. This may cause issues with profile creation.");
      }
      
      const currentOrigin = window.location.origin;
      console.log("Using origin for verification:", currentOrigin);
      
      const emailResult = await sendVerificationEmail(values.email, values.name, currentOrigin);
      
      console.log("Email verification result:", emailResult);
      
      if (!emailResult.success) {
        console.error("Failed to send verification code:", emailResult.error);
        toast.error("Failed to send verification code", {
          description: "Please try again or contact support.",
        });
        return;
      } else {
        console.log("Custom verification email sent successfully");
        toast.success("Account created! Check your email for verification code.");
        
        // If it's a test email, save the verification code
        const code = extractVerificationCode(emailResult);
        if (code) {
          console.log(`Test email detected with code: ${code}`);
          setTestVerificationCode(code);
          
          // Show an immediate toast for the test email code
          toast.info("Test account detected", {
            description: `Your verification code is: ${code}`,
            duration: 10000 // Show for 10 seconds
          });
        } else {
          // For better UX in development, set a default test code 
          setTestVerificationCode("123456");
          toast.info("Development mode", {
            description: "Using default verification code: 123456",
            duration: 8000
          });
        }

        // Log the full emailResult for debugging
        console.log("Full emailResult:", JSON.stringify(emailResult));
      }
      
      // Force setting emailSent flag to true
      setEmailSent(true);
      setStep("verification");
      
      // Set new signup flag for redirection handling
      localStorage.setItem("newSignUp", "true");
      
    } catch (err: any) {
      console.error("Signup failed:", err);
      
      if (err.message?.includes("already registered") || err.message?.includes("user_exists")) {
        toast.error("Email already registered", {
          description: "Please use a different email address or try to sign in.",
        });
      } else {
        toast.error("Signup failed", {
          description: err.message || "An unexpected error occurred",
        });
      }
    }
  };

  return { onSignUpSubmit };
};
