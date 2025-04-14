
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
      console.log("Sign up process initiated for", values.email);
      
      // 1. Create user in Supabase Auth
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
        options: {
          data: {
            name: values.name,
          }
        }
      });
      
      if (signUpError) {
        console.error("Signup error:", signUpError);
        
        if (signUpError.message.includes("already registered")) {
          toast.error("Email already registered", {
            description: "Please use a different email address or try to sign in."
          });
        } else {
          toast.error("Signup failed", {
            description: signUpError.message
          });
        }
        
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
        setTestVerificationCode("123456"); // Set dummy code
        
        // Show success message
        toast.success("Account created successfully!", {
          description: "Taking you to complete your profile."
        });
        
        // 3. Force auto-verification and redirect to profile setup
        setTimeout(() => {
          setStep("verification");
        }, 100);
      }
    } catch (err: any) {
      console.error("Signup submission error:", err);
      toast.error("Sign up failed", {
        description: err.message || "An unexpected error occurred"
      });
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
  };
}
