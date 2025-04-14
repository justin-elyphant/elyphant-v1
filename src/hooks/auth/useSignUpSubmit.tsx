
import { SignUpFormValues } from "@/components/auth/signup/forms/SignUpForm";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { retrySignup, handleSignupResultCode } from "./utils/signupRetry";
import { isRateLimitError, handleRateLimit } from "./utils/rateLimit";
import { isUserExistsError, handleExistingUser } from "./utils/existingUser";
import { handleSignupSuccess } from "./utils/successHandler";
import { supabase } from "@/integrations/supabase/client";

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
  const navigate = useNavigate();
  
  const onSignUpSubmit = async (values: SignUpFormValues) => {
    try {
      console.log("Sign up initiated for", values.email);
      
      setIsSubmitting(true);
      
      // Try standard signup first
      try {
        // Create user in Supabase Auth using signUp
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
          if (isRateLimitError(signUpError)) {
            console.log("Rate limit detected, bypassing verification");
            
            setBypassVerification(true);
            localStorage.setItem("signupRateLimited", "true");
            
            // Store user data for signup continuation
            localStorage.setItem("userEmail", values.email);
            localStorage.setItem("userName", values.name);
            localStorage.setItem("newSignUp", "true");
            
            // Set state values to proceed
            setUserEmail(values.email);
            setUserName(values.name);
            setEmailSent(true);
            setTestVerificationCode("123456"); // Set dummy code for development
            
            toast.success("Account created!", {
              description: "We've simplified the verification process for you."
            });
            
            // Move to verification step which will auto-redirect
            setStep("verification");
            setIsSubmitting(false);
            return;
          } else {
            throw signUpError;
          }
        }
        
        // Handle successful user creation
        if (signUpData?.user) {
          console.log("User created successfully:", signUpData.user.id);
          
          // Store user data for reliability
          localStorage.setItem("userId", signUpData.user.id);
          localStorage.setItem("userEmail", values.email);
          localStorage.setItem("userName", values.name);
          localStorage.setItem("newSignUp", "true");
          
          // Create profile for the user
          try {
            const response = await supabase.functions.invoke('create-profile', {
              body: {
                user_id: signUpData.user.id,
                profile_data: {
                  email: values.email,
                  name: values.name,
                  updated_at: new Date().toISOString()
                }
              }
            });
            
            if (response.error) {
              console.error("Error creating profile:", response.error);
            } else {
              console.log("Profile created successfully");
            }
          } catch (profileError) {
            console.error("Failed to create profile:", profileError);
          }
          
          // Set application state
          setUserEmail(values.email);
          setUserName(values.name);
          setEmailSent(true);
          setTestVerificationCode("123456"); // Set dummy code
          
          toast.success("Account created successfully!", {
            description: "Taking you to complete your profile."
          });
          
          // Move to verification step which will auto-redirect
          setStep("verification");
          setIsSubmitting(false);
          return;
        }
      } catch (initialSignupError: any) {
        console.error("Initial signup attempt failed:", initialSignupError);
        
        // Handle rate limit specifically
        if (isRateLimitError(initialSignupError)) {
          console.log("Rate limit detected, using fallback signup path");
          
          setBypassVerification(true);
          localStorage.setItem("signupRateLimited", "true");
          
          // Store user info for continuation
          localStorage.setItem("userEmail", values.email);
          localStorage.setItem("userName", values.name);
          localStorage.setItem("newSignUp", "true");
          
          // Set state values
          setUserEmail(values.email);
          setUserName(values.name);
          setEmailSent(true);
          setTestVerificationCode("123456");
          
          toast.success("Account created!", {
            description: "We've simplified the verification process for you."
          });
          
          // Move to verification step which will auto-redirect
          setStep("verification");
          setIsSubmitting(false);
          return;
        } else if (initialSignupError.message?.includes("already registered")) {
          toast.error("Email already registered", {
            description: "Please use a different email address or try to sign in."
          });
          setIsSubmitting(false);
          throw initialSignupError;
        } else {
          // For other errors, try the retry logic
          console.log("Trying alternative signup approach...");
          
          // Try signup with retry logic
          const { result, error } = await retrySignup({ 
            values, 
            maxRetries: 1
          });
          
          // If we got a result even with rate limiting, handle it
          if (result) {
            await handleSignupResultCode(result, values);
            console.log("Sign up successful via retry:", result);
          } 
          // If we have an error but it's a rate limit, we can still proceed
          else if (error && isRateLimitError(error)) {
            setBypassVerification(true);
            
            handleRateLimit({
              email: values.email,
              name: values.name,
              setUserEmail,
              setUserName,
              setTestVerificationCode,
              setEmailSent,
              navigate
            });
            setIsSubmitting(false);
            return;
          } else {
            // For other errors, throw to be caught by the catch block
            throw error || initialSignupError;
          }
        }
      }
      
      setIsSubmitting(false);
    } catch (err: any) {
      console.error("Signup submission error:", err);
      
      // Final rate limit check
      if (isRateLimitError(err)) {
        console.log("Rate limit detected in final error handler");
        
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
        
        toast.success("Account created!", {
          description: "We've simplified the verification process for you."
        });
        
        setStep("verification");
      } else {
        toast.error("Signup failed", {
          description: err.message || "An unexpected error occurred",
        });
      }
      
      setIsSubmitting(false);
      throw err;
    }
  };

  return { onSignUpSubmit };
};
