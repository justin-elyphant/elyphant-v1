
import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Mail, Lock, User, Loader2 } from "lucide-react";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import InputField from "../fields/InputField";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { isRateLimitError } from "@/hooks/auth/utils/rateLimit";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

// Simplified schema without captcha
const signUpSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters" }),
  email: z.string().email({ message: "Please enter a valid email address" }),
  password: z.string().min(8, { message: "Password must be at least 8 characters" }),
});

export type SignUpFormValues = z.infer<typeof signUpSchema>;

interface SignUpFormProps {
  onSubmit: (values: SignUpFormValues) => Promise<void>;
  isSubmitting?: boolean;
}

const SignUpForm: React.FC<SignUpFormProps> = ({ 
  onSubmit, 
  isSubmitting = false 
}) => {
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [localIsSubmitting, setLocalIsSubmitting] = React.useState<boolean>(false);
  const navigate = useNavigate();

  const form = useForm<SignUpFormValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
    },
  });

  const handleSubmit = async (values: SignUpFormValues) => {
    try {
      setErrorMessage(null);
      setLocalIsSubmitting(true);
      
      await onSubmit(values).catch(error => {
        console.error("Error during signup:", error);
        
        // Check if it's a rate limit error
        if (isRateLimitError(error)) {
          console.log("Rate limit error detected in SignUpForm");
          
          // Store data for profile setup
          localStorage.setItem("newSignUp", "true");
          localStorage.setItem("userEmail", values.email);
          localStorage.setItem("userName", values.name);
          localStorage.setItem("signupRateLimited", "true");
          localStorage.setItem("bypassVerification", "true");
          
          // Show success toast
          toast.success("Account created successfully!", {
            description: "Taking you to complete your profile."
          });
          
          // Navigate to profile setup
          setTimeout(() => {
            navigate("/profile-setup", { replace: true });
          }, 1500);
          
          // Don't rethrow, we're handling it here
          return;
        }
        
        // For other errors, propagate
        throw error;
      });
    } catch (error: any) {
      console.error("Form submission error:", error);
      
      // Set error message based on type
      if (error.message?.includes("already registered")) {
        setErrorMessage("Email already registered. Please use a different email address or sign in.");
      } else if (isRateLimitError(error)) {
        // This is a backup check - the error should be caught in the try block above
        setErrorMessage("Email rate limit reached. Redirecting to profile setup...");
        
        // Navigate to profile setup after showing message briefly
        setTimeout(() => {
          navigate("/profile-setup", { replace: true });
        }, 2000);
      } else {
        setErrorMessage(error.message || "An unexpected error occurred");
      }
    } finally {
      setLocalIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      {errorMessage && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      )}
      
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <InputField
          form={form}
          name="name"
          label="Name"
          placeholder="Your name"
          Icon={User}
        />
        
        <InputField
          form={form}
          name="email"
          label="Email"
          placeholder="your@email.com"
          type="email"
          Icon={Mail}
        />
        
        <InputField
          form={form}
          name="password"
          label="Password"
          placeholder="********"
          type="password"
          Icon={Lock}
        />
        
        <Button 
          type="submit" 
          className="w-full bg-purple-600 hover:bg-purple-700"
          disabled={isSubmitting || localIsSubmitting}
        >
          {(isSubmitting || localIsSubmitting) ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating account...
            </>
          ) : (
            "Create account"
          )}
        </Button>
      </form>
    </Form>
  );
};

export default SignUpForm;
