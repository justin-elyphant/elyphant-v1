
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
      
      setUserEmail(values.email);
      setUserName(values.name);
      
      // Ensure the user has a profile in the database
      if (result.user?.id) {
        console.log("Creating profile for user:", result.user.id);
        
        try {
          // Use a Supabase function to create the profile (bypasses RLS)
          const { error: createProfileError } = await supabase.rpc('create_profile', {
            user_id: result.user.id,
            user_email: values.email,
            user_name: values.name
          });
          
          if (createProfileError) {
            console.error("Error creating profile via RPC:", createProfileError);
            
            // Fallback to standard method (might fail due to RLS)
            const { error: profileError } = await supabase
              .from('profiles')
              .upsert([
                { 
                  id: result.user.id,
                  email: values.email,
                  name: values.name,
                  updated_at: new Date().toISOString()
                }
              ]);
              
            if (profileError) {
              console.error("Error creating profile:", profileError);
              toast.error("Profile creation failed", {
                description: "Your account was created but we couldn't set up your profile."
              });
            } else {
              console.log("Profile created successfully");
            }
          } else {
            console.log("Profile created successfully via RPC");
          }
        } catch (err) {
          console.error("Error in profile creation:", err);
        }
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
        }

        // Log the full emailResult for debugging
        console.log("Full emailResult:", JSON.stringify(emailResult));
      }
      
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
