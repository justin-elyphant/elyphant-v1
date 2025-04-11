
import { toast } from "sonner";
import { SignUpFormValues } from "@/components/auth/signup/forms/SignUpForm";
import { signUpUser } from "@/hooks/signup/signupService";

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
  
  const onSignUpSubmit = async (values: SignUpFormValues) => {
    try {
      console.log("Sign up initiated for", values.email);
      
      // Call the create-user function directly
      const result = await signUpUser(values, null, null);
      
      if (!result) {
        toast.error("Signup failed", {
          description: "Unable to create account. Please try again.",
        });
        return;
      }
      
      console.log("Sign up successful:", result);
      
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
      
      // Force redirection to profile setup with a direct page navigation
      window.location.href = "/profile-setup";
    } catch (err: any) {
      console.error("Signup failed:", err);
      
      if (err.message?.includes("already registered") || err.message?.includes("user_exists")) {
        toast.error("Email already registered", {
          description: "Please use a different email address or try to sign in.",
        });
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
