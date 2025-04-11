
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
      
      // Call the create-user function with a forced creation flag
      const result = await signUpUser(values, null, null);
      
      if (!result) {
        toast.error("Signup failed", {
          description: "Unable to create account. Please try again.",
        });
        return;
      }
      
      // If the user already exists but we want to bypass that check
      // We'll continue with the flow as if the signup was successful
      if (result.code === "user_exists") {
        console.log("User exists issue detected, but we'll proceed with the flow");
        // We'll log it but still continue with the profile setup flow
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
      
      // Use React Router navigation instead of direct location change
      // This maintains the React component lifecycle better
      navigate('/profile-setup', { replace: true });
    } catch (err: any) {
      console.error("Signup failed:", err);
      
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
          
          navigate('/profile-setup', { replace: true });
        } catch (signInErr: any) {
          console.error("Sign in attempt failed:", signInErr);
          toast.error("Email already registered", {
            description: "Please use a different email address or try to sign in."
          });
        }
      } else if (err.message?.includes("rate limit") || err.message?.includes("exceeded")) {
        toast.error("Email rate limit exceeded", {
          description: "Please try again in a few minutes or use a different email address.",
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

