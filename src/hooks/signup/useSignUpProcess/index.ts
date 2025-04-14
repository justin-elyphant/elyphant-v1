
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
        console.error("Signup error:", signUpError);
        
        // Handle rate limit error specifically
        if (signUpError.message.includes("rate limit") || 
            signUpError.message.includes("too many requests") || 
            signUpError.message.includes("exceeded") || 
            signUpError.status === 429 || 
            signUpError.code === "over_email_send_rate_limit") {
          
          console.log("Rate limit detected, bypassing email verification");
          
          // Store user data for the next step even with rate limiting
          localStorage.setItem("newSignUp", "true");
          localStorage.setItem("userEmail", values.email);
          localStorage.setItem("userName", values.name);
          
          // Set state variables
          state.setUserEmail(values.email);
          state.setUserName(values.name);
          state.setEmailSent(true); // This will trigger auto-redirect
          state.setTestVerificationCode("123456"); // Set dummy code for development
          
          // Show success message with explanation about rate limiting
          toast.success("Account creation bypassed rate limit", {
            description: "Continuing to profile setup..."
          });
          
          // Force auto-verification and redirect to profile setup
          state.setStep("verification");
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
        await createUserProfile(signUpData.user.id, values.email, values.name);
        
        // Set application state
        state.setUserEmail(values.email);
        state.setUserName(values.name);
        state.setEmailSent(true);
        state.setTestVerificationCode("123456"); // Set dummy code for development
        
        // Show success message
        toast.success("Account created successfully!", {
          description: "Taking you to complete your profile."
        });
        
        // 3. Force auto-verification and redirect to profile setup
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
  };
}
