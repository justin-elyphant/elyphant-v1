
import { useNavigate } from "react-router-dom";
import { useVerificationRedirect } from "@/hooks/auth/useVerificationRedirect";
import { useSignUpState } from "./useSignUpState";
import { useAutoRedirect } from "./useAutoRedirect";
import { createUserProfile } from "./useProfileCreation";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { SignUpFormValues, UseSignUpProcessReturn } from "./types";

export function useSignUpProcess(): UseSignUpProcessReturn {
  const navigate = useNavigate();
  const state = useSignUpState();
  
  // Check for URL parameters indicating verified status
  useVerificationRedirect(navigate, state.setUserEmail);
  
  // Setup auto-redirect when email is sent
  useAutoRedirect({
    emailSent: state.emailSent,
    step: state.step,
    userEmail: state.userEmail,
    userName: state.userName
  });
  
  // Handle signup form submission
  const onSignUpSubmit = async (values: SignUpFormValues) => {
    try {
      if (state.isSubmitting) return; // Prevent multiple submissions
      state.setIsSubmitting(true);
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
            signUpError.status === 429) {
          
          state.setBypassVerification(true);
          localStorage.setItem("signupRateLimited", "true");
          
          toast.error("Too many signup attempts", {
            description: "Please try again in a few minutes or contact support."
          });
          state.setIsSubmitting(false);
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
        
        state.setIsSubmitting(false);
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
        state.setUserEmail(values.email);
        state.setUserName(values.name);
        state.setEmailSent(true);
        state.setTestVerificationCode("123456"); // Set dummy code for development
        
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
            state.setBypassVerification(true);
            localStorage.setItem("signupRateLimited", "true");
          } else {
            console.log("Verification email sent successfully");
          }
        } catch (emailError) {
          console.error("Error when sending verification email:", emailError);
          state.setBypassVerification(true);
          localStorage.setItem("signupRateLimited", "true");
        }
        
        toast.success("Account created successfully!", {
          description: "Taking you to complete your profile."
        });
        
        state.setStep("verification");
      }
    } catch (err: any) {
      console.error("Signup submission error:", err);
      toast.error("Sign up failed", {
        description: err.message || "An unexpected error occurred"
      });
    } finally {
      state.setIsSubmitting(false);
    }
  };

  const handleResendVerification = async () => {
    state.setResendCount((prev) => prev + 1);
    return { success: true };
  };

  const handleBackToSignUp = () => {
    state.setStep("signup");
  };

  return {
    step: state.step,
    userEmail: state.userEmail,
    userName: state.userName,
    emailSent: state.emailSent,
    resendCount: state.resendCount,
    testVerificationCode: state.testVerificationCode,
    onSignUpSubmit,
    handleResendVerification,
    handleBackToSignUp,
    isSubmitting: state.isSubmitting,
    bypassVerification: state.bypassVerification,
  };
}
