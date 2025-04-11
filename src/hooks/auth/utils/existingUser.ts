
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
    setUserEmail(email);
    setUserName(name || "");
    setTestVerificationCode("123456");
    setEmailSent(true);
    
    toast.success("Signed in successfully!", {
      description: "Taking you to your profile."
    });
    
    // Navigate directly to profile setup
    navigate('/profile-setup', { replace: true });
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
