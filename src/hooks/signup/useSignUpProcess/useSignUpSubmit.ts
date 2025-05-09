
import { toast } from "sonner";
import { SignUpFormValues } from "@/components/auth/signup/forms/SignUpForm";
import { supabase } from "@/integrations/supabase/client";
import { createUserProfile } from "./useProfileCreation";
import { getDefaultDataSharingSettings } from "@/utils/privacyUtils";

interface UseSignUpSubmitProps {
  setUserEmail: (email: string) => void;
  setUserName: (name: string) => void;
  setEmailSent: (sent: boolean) => void;
  setStep: (step: "signup" | "verification") => void;
  setIsSubmitting: (isSubmitting: boolean) => void;
}

export const useSignUpSubmit = ({
  setUserEmail,
  setUserName,
  setEmailSent,
  setStep,
  setIsSubmitting
}: UseSignUpSubmitProps) => {
  const onSignUpSubmit = async (values: SignUpFormValues) => {
    try {
      setIsSubmitting(true);
      console.log("Sign up process initiated for", values.email);
      
      // Create user in Supabase Auth
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
        
        // Create user profile with privacy settings
        if (signUpData.user.id) {
          try {
            // Use only expected arguments and let the function handle defaults internally
            await createUserProfile(signUpData.user.id, values.email, values.name);
            console.log("Profile created successfully");
          } catch (profileError) {
            console.error("Error creating profile:", profileError);
            // Continue with signup process even if profile creation fails
          }
        }
        
        // Set application state
        setUserEmail(values.email);
        setUserName(values.name);
        setEmailSent(true);
        
        toast.success("Account created!", {
          description: "Please check your email to confirm your account."
        });
        
        setStep("verification");
      }
    } catch (err: any) {
      console.error("Signup submission error:", err);
      setIsSubmitting(false);
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  };

  return { onSignUpSubmit };
};
