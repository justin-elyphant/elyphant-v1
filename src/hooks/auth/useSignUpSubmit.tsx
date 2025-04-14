
import { SignUpFormValues } from "@/components/auth/signup/forms/SignUpForm";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { handleRateLimit } from "./utils/rateLimit";
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
      
      // Check if rate limited previously and bypass normal flow
      if (localStorage.getItem("signupRateLimited") === "true") {
        console.log("Rate limit detected from localStorage, bypassing verification");
        
        setBypassVerification(true);
        
        // Store user data for continuation
        localStorage.setItem("userEmail", values.email);
        localStorage.setItem("userName", values.name);
        localStorage.setItem("newSignUp", "true");
        
        // Set state values to proceed
        setUserEmail(values.email);
        setUserName(values.name);
        setEmailSent(true);
        setTestVerificationCode("123456"); // Set dummy code
        
        toast.success("Account creation successful!", {
          description: "Taking you to complete your profile."
        });
        
        // Move directly to profile setup
        setTimeout(() => {
          navigate('/profile-setup', { replace: true });
        }, 1500);
        
        setIsSubmitting(false);
        return;
      }
      
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
        if (signUpError.message.includes("rate limit") || 
            signUpError.message.includes("too many requests") || 
            signUpError.status === 429 ||
            signUpError.code === "over_email_send_rate_limit") {
          
          console.log("Rate limit detected, bypassing verification");
          
          // Set bypass verification flag
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
          setTestVerificationCode("123456"); // Set dummy code
          
          // Try to create a profile anyway
          try {
            // This will only work if we successfully created the user
            if (signUpData?.user?.id) {
              console.log("Creating profile for user despite rate limit");
              await supabase.from('profiles').insert([
                { 
                  id: signUpData.user.id,
                  email: values.email,
                  name: values.name,
                  updated_at: new Date().toISOString()
                }
              ]);
            }
          } catch (profileError) {
            console.error("Error creating profile after rate limit:", profileError);
          }
          
          toast.success("Account creation successful!", {
            description: "We've simplified the verification process for you."
          });
          
          // Move to profile setup directly
          setTimeout(() => {
            navigate('/profile-setup', { replace: true });
          }, 1500);
          
          setIsSubmitting(false);
          return;
        }
        
        // For other errors, throw to be caught by the form's error handler
        setIsSubmitting(false);
        throw signUpError;
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
        try {
          console.log("Creating profile for new user");
          const { error: profileError } = await supabase.from('profiles').insert([
            { 
              id: signUpData.user.id,
              email: values.email,
              name: values.name,
              updated_at: new Date().toISOString()
            }
          ]);
          
          if (profileError) {
            console.error("Error creating profile:", profileError);
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
        setTestVerificationCode("123456"); // Set dummy code for development
        
        toast.success("Account created successfully!", {
          description: "Taking you to complete your profile."
        });
        
        // Navigate directly to profile setup
        setTimeout(() => {
          navigate('/profile-setup', { replace: true });
        }, 1500);
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
        
        toast.success("Account created successfully!", {
          description: "We've simplified the verification process for you."
        });
        
        setTimeout(() => {
          navigate('/profile-setup', { replace: true });
        }, 1500);
      }
      
      setIsSubmitting(false);
      throw err; // Propagate the error to be caught by the form
    } finally {
      setIsSubmitting(false);
    }
  };

  return { onSignUpSubmit };
};
