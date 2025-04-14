
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useVerificationRedirect } from "@/hooks/auth/useVerificationRedirect";
import { toast } from "sonner";
import { SignUpFormValues } from "@/components/auth/signup/forms/SignUpForm";
import { supabase } from "@/integrations/supabase/client";

export function useSignUpProcess() {
  const navigate = useNavigate();
  const [step, setStep] = useState<"signup" | "verification">("signup");
  const [userEmail, setUserEmail] = useState<string>("");
  const [userName, setUserName] = useState<string>("");
  const [emailSent, setEmailSent] = useState<boolean>(false);
  const [resendCount, setResendCount] = useState<number>(0);
  const [testVerificationCode, setTestVerificationCode] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Check for URL parameters indicating verified status
  useVerificationRedirect(navigate, setUserEmail);
  
  // AUTO-REDIRECT TO PROFILE SETUP WHEN EMAIL IS SENT
  useEffect(() => {
    if (emailSent && step === "verification") {
      console.log("Auto-redirecting to profile setup from useSignUpProcess");
      
      // Store in localStorage for persistence
      localStorage.setItem("newSignUp", "true");
      localStorage.setItem("userEmail", userEmail);
      localStorage.setItem("userName", userName || "");
      
      // Use navigate with replace to prevent back-button issues
      navigate('/profile-setup', { replace: true });
    }
  }, [emailSent, step, navigate, userEmail, userName]);
  
  // Handle signup form submission
  const onSignUpSubmit = async (values: SignUpFormValues) => {
    try {
      if (isSubmitting) return; // Prevent multiple submissions
      setIsSubmitting(true);
      console.log("Sign up process initiated for", values.email);
      
      // 1. Create user in Supabase Auth using signUp
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
        options: {
          data: {
            name: values.name,
          },
          // Important: We're not using email confirmation to avoid rate limit issues
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      });
      
      if (signUpError) {
        console.error("Signup error:", signUpError);
        
        // Handle rate limit error specifically
        if (signUpError.message.includes("rate limit") || 
            signUpError.message.includes("too many requests") || 
            signUpError.status === 429) {
          
          toast.error("Too many signup attempts", {
            description: "Please try again in a few minutes or contact support."
          });
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
        
        // 2. Create profile
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
            
            // Fallback to direct profile creation
            try {
              const { error: directError } = await supabase
                .from('profiles')
                .insert([
                  { 
                    id: signUpData.user.id,
                    email: values.email,
                    name: values.name,
                    updated_at: new Date().toISOString()
                  }
                ]);
                
              if (directError) {
                console.error("Direct profile creation also failed:", directError);
              } else {
                console.log("Profile created successfully via direct insertion");
              }
            } catch (directError) {
              console.error("Failed direct profile creation:", directError);
            }
          } else {
            console.log("Profile created successfully via edge function:", response.data);
          }
        } catch (profileError) {
          console.error("Failed to create profile:", profileError);
        }
        
        // Set application state
        setUserEmail(values.email);
        setUserName(values.name);
        setEmailSent(true);
        setTestVerificationCode("123456"); // Set dummy code for development
        
        // Show success message
        toast.success("Account created successfully!", {
          description: "Taking you to complete your profile."
        });
        
        // 3. Force auto-verification and redirect to profile setup
        setStep("verification");
      }
    } catch (err: any) {
      console.error("Signup submission error:", err);
      toast.error("Sign up failed", {
        description: err.message || "An unexpected error occurred"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Simple resend verification function (not actually used in direct signup flow)
  const handleResendVerification = async () => {
    setResendCount((prev) => prev + 1);
    return { success: true };
  };

  const handleBackToSignUp = () => {
    setStep("signup");
  };

  return {
    step,
    userEmail,
    userName,
    emailSent,
    resendCount,
    testVerificationCode,
    onSignUpSubmit,
    handleResendVerification,
    handleBackToSignUp,
    isSubmitting,  // Make sure to expose the isSubmitting state here
  };
}
