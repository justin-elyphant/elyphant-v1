
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
      
      // Attempt to create the user
      const result = await signUpUser(values, null, null);
      
      if (!result) {
        toast.error("Signup failed", {
          description: "Unable to create account. Please try again.",
        });
        return;
      }
      
      console.log("User created successfully:", result);
      
      // Store user ID and other info in localStorage for reliability
      if (result.user?.id) {
        localStorage.setItem("userId", result.user.id);
        localStorage.setItem("userEmail", values.email);
        localStorage.setItem("userName", values.name || '');
        localStorage.setItem("newSignUp", "true");
      }
      
      // Set UI state
      setUserEmail(values.email);
      setUserName(values.name);
      
      // Immediate profile creation via edge function
      if (result.user?.id) {
        try {
          console.log("Creating profile for new user:", result.user.id);
          
          const profileData = {
            email: values.email,
            name: values.name || values.email.split('@')[0],
            updated_at: new Date().toISOString()
          };
          
          const response = await supabase.functions.invoke('create-profile', {
            body: {
              user_id: result.user.id,
              profile_data: profileData
            }
          });
          
          if (response.error) {
            console.error("Error creating profile via edge function:", response.error);
          } else {
            console.log("Profile created successfully via edge function:", response.data);
          }
        } catch (err) {
          console.error("Error calling create-profile function:", err);
        }
      } else {
        console.warn("No user ID available after signup. This may cause issues with profile creation.");
      }
      
      // Send verification email
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
      }
      
      // Force setting emailSent flag to true and move to verification step
      setEmailSent(true);
      setStep("verification");
      
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
