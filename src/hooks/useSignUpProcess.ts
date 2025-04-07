
import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { SignUpFormValues } from "@/components/auth/signup/SignUpContentWrapper";
import { signUpUser, sendVerificationEmail } from "@/hooks/signup/signupService";

export function useSignUpProcess() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [step, setStep] = useState<"signup" | "verification">("signup");
  const [userEmail, setUserEmail] = useState<string>("");
  const [userName, setUserName] = useState<string>("");
  const [emailSent, setEmailSent] = useState<boolean>(false);
  const [resendCount, setResendCount] = useState<number>(0);
  const [lastResendTime, setLastResendTime] = useState<number | null>(null);
  const [testVerificationCode, setTestVerificationCode] = useState<string | null>(null);

  // Debug logging for the verification code
  useEffect(() => {
    console.log("SignUp hook: testVerificationCode state updated to:", testVerificationCode);
  }, [testVerificationCode]);

  // Check if user is already verified from URL parameters
  useEffect(() => {
    const verified = searchParams.get('verified') === 'true';
    const email = searchParams.get('email');
    
    if (verified && email) {
      console.log("Email verified from URL parameters!");
      setUserEmail(email);
      navigate("/dashboard");
    }
  }, [searchParams, navigate]);

  const handleSignUpSubmit = async (values: SignUpFormValues) => {
    try {
      console.log("Sign up initiated for", values.email);
      
      const result = await signUpUser(values, null, null);
      
      if (!result) {
        toast.error("Signup failed", {
          description: "Unable to create account. Please try again.",
        });
        return;
      }
      
      console.log("User created successfully:", result);
      
      setUserEmail(values.email);
      setUserName(values.name);
      
      const currentOrigin = window.location.origin;
      console.log("Using origin for verification:", currentOrigin);
      
      const emailResult = await sendVerificationEmail(values.email, values.name, currentOrigin);
      
      console.log("Email verification result:", emailResult);
      
      if (!emailResult.success) {
        console.error("Failed to send verification code:", emailResult.error);
        toast.error("Failed to send verification code", {
          description: "Please try again or contact support.",
        });
        return;
      } else {
        console.log("Custom verification email sent successfully");
        toast.success("Account created! Check your email for verification code.");
        setResendCount(0);
        setLastResendTime(Date.now());
        
        // Enhanced extraction of verification code
        if (emailResult.verificationCode) {
          console.log(`Verification code found in response: ${emailResult.verificationCode}`);
          setTestVerificationCode(emailResult.verificationCode);
          
          // Show an immediate toast for the test email code
          toast.info("Verification code detected", {
            description: `Your verification code is: ${emailResult.verificationCode}`,
            duration: 10000 // Show for 10 seconds
          });
        } 
        // Check if code is in data property (matches the edge function structure)
        else if (emailResult.data?.code) {
          console.log(`Verification code found in data.code: ${emailResult.data.code}`);
          setTestVerificationCode(emailResult.data.code);
          
          toast.info("Verification code detected", {
            description: `Your verification code is: ${emailResult.data.code}`,
            duration: 10000
          });
        } else {
          console.log("No verification code found in response:", emailResult);
        }

        // Log the full emailResult for debugging
        console.log("Full emailResult:", JSON.stringify(emailResult));
      }
      
      setEmailSent(true);
      setStep("verification");
    } catch (err: any) {
      console.error("Signup failed:", err);
      
      if (err.message?.includes("already registered") || err.message?.includes("user_exists")) {
        toast.error("Email already registered", {
          description: "Please use a different email address or try to sign in.",
        });
      } else {
        toast.error("Signup failed", {
          description: err.message || "An unexpected error occurred",
        });
      }
    }
  };

  const handleResendVerification = async () => {
    try {
      // Rate limiting check (client-side enforcement)
      if (lastResendTime && Date.now() - lastResendTime < 60000) {
        toast.error("Please wait before requesting another code", {
          description: "You can request a new code once per minute."
        });
        return { success: false, rateLimited: true };
      }
      
      const currentOrigin = window.location.origin;
      console.log("Resending verification using origin:", currentOrigin);
      
      const result = await sendVerificationEmail(userEmail, userName, currentOrigin);
      
      console.log("Resend verification result:", result);
      
      if (!result.success) {
        if (result.rateLimited) {
          toast.error("Too many verification attempts", {
            description: "Please wait a few minutes before trying again."
          });
          return { success: false, rateLimited: true };
        }
        
        toast.error("Failed to resend verification code", {
          description: "Please try again later."
        });
        return { success: false };
      }
      
      // Enhanced extraction of verification code for resend
      if (result.verificationCode) {
        console.log(`Resend - verification code found in response: ${result.verificationCode}`);
        setTestVerificationCode(result.verificationCode);
        
        toast.info("Verification code detected", {
          description: `Your new verification code is: ${result.verificationCode}`,
          duration: 10000
        });
      } 
      // Check if code is in data property
      else if (result.data?.code) {
        console.log(`Resend - verification code found in data.code: ${result.data.code}`);
        setTestVerificationCode(result.data.code);
        
        toast.info("Verification code detected", {
          description: `Your new verification code is: ${result.data.code}`,
          duration: 10000
        });
      } else {
        console.log("Resend - no verification code found in response:", result);
      }
      
      setResendCount(prev => prev + 1);
      setLastResendTime(Date.now());
      toast.success("Verification code resent", {
        description: "Please check your email for the new code."
      });
      return { success: true };
    } catch (error) {
      console.error("Error resending verification:", error);
      toast.error("Failed to resend code");
      return { success: false };
    }
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
    handleSignUpSubmit,
    handleResendVerification,
    handleBackToSignUp,
  };
}
