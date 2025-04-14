
import { toast } from "sonner";
import { SignUpFormValues } from "@/components/auth/signup/forms/SignUpForm";
import { supabase } from "@/integrations/supabase/client";
import { createUserProfile } from "./useProfileCreation";

interface UseSignUpSubmitProps {
  setUserEmail: (email: string) => void;
  setUserName: (name: string) => void;
  setEmailSent: (sent: boolean) => void;
  setStep: (step: "signup" | "verification") => void;
  setTestVerificationCode: (code: string | null) => void;
  setBypassVerification: (bypass: boolean) => void;
  setIsSubmitting: (isSubmitting: boolean) => void;
}

export const useSignUpSubmit = ({
  setUserEmail,
  setUserName,
  setEmailSent,
  setStep,
  setTestVerificationCode,
  setBypassVerification,
  setIsSubmitting
}: UseSignUpSubmitProps) => {
  
  const onSignUpSubmit = async (values: SignUpFormValues) => {
    try {
      if (setIsSubmitting) setIsSubmitting(true);
      console.log("Sign up process initiated for", values.email);
      
      // 1. Create user in Supabase Auth using signUp
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
        options: {
          data: {
            name: values.name,
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      });
      
      if (signUpError) {
        // Handle rate limit error specifically
        if (signUpError.message.includes("rate limit") || 
            signUpError.message.includes("too many requests") || 
            signUpError.status === 429 ||
            signUpError.code === "over_email_send_rate_limit") {
          
          console.log("Rate limit detected, bypassing verification");
          setBypassVerification(true);
          localStorage.setItem("signupRateLimited", "true");
          
          // Store user data in localStorage for signup continuation
          localStorage.setItem("userEmail", values.email);
          localStorage.setItem("userName", values.name);
          localStorage.setItem("newSignUp", "true");
          
          // Set state values to proceed
          setUserEmail(values.email);
          setUserName(values.name);
          setEmailSent(true);
          setTestVerificationCode("123456"); // Set dummy code for development
          
          toast.error("Too many signup attempts", {
            description: "We'll bypass verification to let you continue."
          });
          
          // Directly move to verification step which will auto-redirect
          setStep("verification");
          setIsSubmitting(false);
          return;
        }
        
        if (signUpError.message.includes("already registered")) {
          toast.error("Email already registered", {
            description: "Please use a different email address or try to sign in."
          });
        } else {
          toast.error("Signup failed", {
            description: signUpError.message
          });
        }
        
        setIsSubmitting(false);
        return;
      }
      
      // User created successfully
      if (signUpData?.user) {
        console.log("User created successfully:", signUpData.user.id);
        
        // Store user data for reliability
        localStorage.setItem("userId", signUpData.user.id);
        localStorage.setItem("userEmail", values.email);
        localStorage.setItem("userName", values.name);
        localStorage.setItem("newSignUp", "true");
        
        // Auto sign-in after successful signup
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: values.email,
          password: values.password
        });
        
        if (signInError) {
          console.error("Auto sign-in error:", signInError);
          toast.error("Account created but couldn't sign in automatically", {
            description: "Please try signing in manually."
          });
        } else {
          console.log("Auto sign-in successful");
        }
        
        // Create user profile
        if (signUpData.user.id) {
          await createUserProfile(signUpData.user.id, values.email, values.name);
        }
        
        // Set application state
        setUserEmail(values.email);
        setUserName(values.name);
        setEmailSent(true);
        setTestVerificationCode("123456"); // Set dummy code for development
        
        // Try to send email
        try {
          const emailResult = await supabase.functions.invoke('send-verification-email', {
            body: {
              email: values.email,
              name: values.name,
              verificationUrl: window.location.origin
            }
          });
          
          if (emailResult.error) {
            console.error("Error sending verification email:", emailResult.error);
            setBypassVerification(true);
            localStorage.setItem("signupRateLimited", "true");
          } else {
            console.log("Verification email sent successfully");
          }
        } catch (emailError) {
          console.error("Error when sending verification email:", emailError);
          setBypassVerification(true);
          localStorage.setItem("signupRateLimited", "true");
        }
        
        toast.success("Account created successfully!", {
          description: "Taking you to complete your profile."
        });
        
        setStep("verification");
      }
    } catch (err: any) {
      console.error("Signup submission error:", err);
      
      // Additional check for rate limit in the caught error
      if (err.message?.includes("rate limit") || 
          err.message?.includes("too many requests") || 
          err.status === 429 ||
          err.code === "over_email_send_rate_limit") {
        
        console.log("Rate limit caught in error handler, bypassing verification");
        setBypassVerification(true);
        localStorage.setItem("signupRateLimited", "true");
        
        // Store user data and proceed
        localStorage.setItem("userEmail", values.email);
        localStorage.setItem("userName", values.name);
        localStorage.setItem("newSignUp", "true");
        
        setUserEmail(values.email);
        setUserName(values.name);
        setEmailSent(true);
        setTestVerificationCode("123456");
        
        toast.error("Too many signup attempts", {
          description: "We'll bypass verification to let you continue."
        });
        
        setStep("verification");
      } else {
        toast.error("Sign up failed", {
          description: err.message || "An unexpected error occurred"
        });
      }
      
      setIsSubmitting(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return { onSignUpSubmit };
};
