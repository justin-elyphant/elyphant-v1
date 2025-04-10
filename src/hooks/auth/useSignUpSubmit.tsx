
import { SignUpFormValues } from "@/components/auth/signup/forms/SignUpForm";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { retrySignup, handleSignupResultCode } from "./utils/signupRetry";
import { isRateLimitError, handleRateLimit } from "./utils/rateLimit";
import { isUserExistsError, handleExistingUser } from "./utils/existingUser";
import { handleSignupSuccess } from "./utils/successHandler";

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
      
      // Try signup with retry logic
      const { result, error } = await retrySignup({ 
        values, 
        maxRetries: 1
      });
      
      // If we got a result even with rate limiting, handle it
      if (result) {
        await handleSignupResultCode(result, values);
        console.log("Sign up successful:", result);
      } 
      // If we have an error but it's a rate limit, we can still proceed
      else if (error && isRateLimitError(error)) {
        handleRateLimit({
          email: values.email,
          name: values.name,
          setUserEmail,
          setUserName,
          setTestVerificationCode,
          setEmailSent,
          navigate
        });
        return;
      }
      
      // Handle successful signup
      handleSignupSuccess({
        email: values.email,
        name: values.name,
        setUserEmail,
        setUserName,
        setTestVerificationCode,
        setEmailSent,
        navigate
      });
      
    } catch (err: any) {
      console.error("Signup failed:", err);
      
      // Handle rate limit error specifically
      if (isRateLimitError(err)) {
        console.log("Rate limit detected:", err);
        
        handleRateLimit({
          email: values.email,
          name: values.name,
          setUserEmail,
          setUserName,
          setTestVerificationCode,
          setEmailSent,
          navigate
        });
        return;
      }
      
      // Handle existing user error
      if (isUserExistsError(err)) {
        const success = await handleExistingUser({
          email: values.email,
          password: values.password,
          name: values.name,
          setUserEmail,
          setUserName,
          setTestVerificationCode,
          setEmailSent,
          navigate
        });
        
        if (success) return;
      } else {
        // Generic error handling
        toast.error("Signup failed", {
          description: err.message || "An unexpected error occurred",
        });
      }
      
      throw err;
    }
  };

  return { onSignUpSubmit };
};
