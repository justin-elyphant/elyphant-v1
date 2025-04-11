
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
      
      // TESTING MODE: Bypass actual email verification
      console.log("TESTING MODE: Bypassing actual email verification");
      
      // Set a test verification code
      const testCode = "123456";
      setTestVerificationCode(testCode);
      
      // Show success toast for better user feedback
      if (result.userExists) {
        toast.success("Welcome back! Using existing account", {
          description: "You'll be redirected to the dashboard shortly."
        });
      } else {
        toast.success("Account created successfully!", {
          description: "You'll be redirected to profile setup automatically."
        });
      }
      
      setEmailSent(true);
      setStep("verification");
      
      // Show the test verification code to the user
      toast.info("Test verification code", {
        description: `Your verification code is: ${testCode}`,
        duration: 10000 // Show for 10 seconds
      });
    } catch (err: any) {
      console.error("Signup failed:", err);
      
      if (err.message?.includes("already registered") || err.message?.includes("user_exists")) {
        toast.error("Email already registered", {
          description: "Please use a different email address or try to sign in.",
        });
      } else if (err.message?.includes("incorrect")) {
        toast.error("Authentication failed", {
          description: err.message || "Please try with a different email.",
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
