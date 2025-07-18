
/**
 * Utilities for handling existing users during signup
 */

import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

interface ExistingUserHandlerProps {
  email: string;
  password: string;
  name?: string;
  setUserEmail: (email: string) => void;
  setUserName: (name: string) => void;
  setTestVerificationCode: (code: string | null) => void;
  setEmailSent: (sent: boolean) => void;
  navigate: ReturnType<typeof useNavigate>;
}

/**
 * Attempts to sign in an existing user when they try to sign up
 */
export const handleExistingUser = async ({
  email,
  password,
  name,
  setUserEmail,
  setUserName,
  setTestVerificationCode,
  setEmailSent,
  navigate
}: ExistingUserHandlerProps): Promise<boolean> => {
  try {
    console.log("User exists error but we will try to sign in instead");
    
    // Try to sign in with the provided credentials
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    if (error) {
      if (error.message.includes("Invalid login credentials")) {
        toast.error("Email exists but password is incorrect", {
          description: "Try a different email or reset your password."
        });
      } else {
        throw error;
      }
      return false;
    }
    
    // If sign-in was successful, proceed with the flow
    console.log("Existing user signed in:", data);
    
    // Set application state
    setUserEmail(email);
    setUserName(name || "");
    setTestVerificationCode("123456");
    setEmailSent(true);
    
    // Store in localStorage for persistence
    localStorage.setItem("newSignUp", "true");
    localStorage.setItem("userEmail", email);
    localStorage.setItem("userName", name || "");
    
    toast.success("Signed in successfully!", {
      description: "Taking you to your profile."
    });
    
    // Give state time to update before navigation
    setTimeout(() => {
      // Navigate to streamlined signup flow for profile completion
      navigate('/signup?intent=complete-profile', { replace: true });
      
      // Fallback direct location change if navigate doesn't work
      setTimeout(() => {
        window.location.href = "/signup?intent=complete-profile";
      }, 100);
    }, 50);
    
    return true;
  } catch (signInErr: any) {
    console.error("Sign in attempt failed:", signInErr);
    toast.error("Email already registered", {
      description: "Please use a different email address or try to sign in."
    });
    return false;
  }
};

/**
 * Checks if an error is related to an existing user
 */
export const isUserExistsError = (error: any): boolean => {
  return error?.message?.includes("already registered") || 
         error?.message?.includes("user_exists") ||
         error?.code === "user_exists";
};
