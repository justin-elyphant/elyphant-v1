
import { toast } from "sonner";
import { SignUpFormValues } from "@/components/auth/signup/forms/SignUpForm";
import { signUpUser } from "@/hooks/signup/signupService";
import { useNavigate } from "react-router-dom";
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
  const navigate = useNavigate();
  
  const onSignUpSubmit = async (values: SignUpFormValues) => {
    try {
      console.log("Sign up initiated for", values.email);
      
      // Track retries for rate limiting
      let retryCount = 0;
      const maxRetries = 1; // Limit retries to prevent excessive attempts
      let error: any = null;
      let result = null;
      
      // Try signup with retry for rate limits
      while (retryCount <= maxRetries && !result) {
        try {
          // Call the signUpUser function
          result = await signUpUser(values, null, null);
          
          if (!result) {
            throw new Error("Unable to create account. Please try again.");
          }
          
          // Break out of loop on success
          break;
        } catch (err: any) {
          error = err;
          console.error(`Signup attempt ${retryCount + 1} failed:`, err);
          
          // Only retry on rate limit errors
          if (err.message?.toLowerCase().includes("rate limit") || 
              err.message?.toLowerCase().includes("exceeded") || 
              err.status === 429 || 
              err.code === "too_many_requests") {
            retryCount++;
            if (retryCount <= maxRetries) {
              // Wait before retrying (exponential backoff)
              const delay = Math.pow(2, retryCount) * 1000;
              console.log(`Rate limit detected, waiting ${delay}ms before retry`);
              await new Promise(r => setTimeout(r, delay));
              continue;
            }
          }
          
          // For other errors or if retries exhausted, rethrow
          throw err;
        }
      }
      
      // If we still have an error and no result after retries
      if (!result && error) {
        throw error;
      }
      
      // Handle user_exists cases by continuing the flow
      if (result.code === "user_exists") {
        console.log("User exists issue detected, but we'll proceed with the flow");
        
        // Try to sign in with the provided credentials
        const { data, error: signInError } = await supabase.auth.signInWithPassword({
          email: values.email,
          password: values.password
        });
        
        if (signInError) {
          console.error("Sign in failed for existing user:", signInError);
          throw new Error("Email exists but password is incorrect. Please try signing in instead.");
        }
        
        console.log("Signed in existing user successfully");
      } else {
        console.log("Sign up successful:", result);
      }
      
      setUserEmail(values.email);
      setUserName(values.name);
      
      // DIRECT FLOW: Skip email verification entirely
      console.log("BYPASS MODE: Completely skipping email verification and going directly to profile setup");
      
      // Set a dummy verification code
      setTestVerificationCode("123456");
      
      // Show success toast for better user feedback
      toast.success("Account created successfully!", {
        description: "Taking you to complete your profile."
      });
      
      setEmailSent(true);
      
      // Navigate to profile setup
      navigate('/profile-setup', { replace: true });
    } catch (err: any) {
      console.error("Signup failed:", err);
      
      // Handle rate limit error specifically
      if (err.message?.toLowerCase().includes("rate limit") || 
          err.message?.toLowerCase().includes("exceeded") || 
          err.status === 429 || 
          err.code === "over_email_send_rate_limit" ||
          err.code === "too_many_requests") {
        console.log("Rate limit detected:", err);
        
        // Rethrow to let the form component handle the UI for rate limits
        throw err;
      }
      
      // If there's an error about user already exists, we'll handle it specially
      if (err.message?.includes("already registered") || err.message?.includes("user_exists")) {
        console.log("User exists error but we will try to sign in instead");
        
        try {
          // Try to sign in with the provided credentials
          const { data, error } = await supabase.auth.signInWithPassword({
            email: values.email,
            password: values.password
          });
          
          if (error) {
            if (error.message.includes("Invalid login credentials")) {
              toast.error("Email exists but password is incorrect", {
                description: "Try a different email or reset your password."
              });
            } else {
              throw error;
            }
            return;
          }
          
          // If sign-in was successful, proceed with the flow
          console.log("Existing user signed in:", data);
          setUserEmail(values.email);
          setUserName(values.name || "");
          setTestVerificationCode("123456");
          setEmailSent(true);
          
          toast.success("Signed in successfully!", {
            description: "Taking you to your profile."
          });
          
          // Navigate directly to profile setup
          navigate('/profile-setup', { replace: true });
        } catch (signInErr: any) {
          console.error("Sign in attempt failed:", signInErr);
          toast.error("Email already registered", {
            description: "Please use a different email address or try to sign in."
          });
        }
      } else {
        toast.error("Signup failed", {
          description: err.message || "An unexpected error occurred",
        });
      }
      
      // Rethrow to let SignUpForm handle generic errors
      throw err;
    }
  };

  return { onSignUpSubmit };
};
