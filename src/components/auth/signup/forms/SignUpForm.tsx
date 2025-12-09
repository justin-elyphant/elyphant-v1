
import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Mail, Lock, User, Loader2 } from "lucide-react";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import InputField from "../fields/InputField";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { triggerHapticFeedback } from "@/utils/haptics";

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
      console.log("Form submitted with values:", { ...values, password: "******" });
      
      await onSubmit(values);
      console.log("Submission completed successfully");
    } catch (error: any) {
      console.error("Form submission error:", error);
      
      // Handle specific error cases
      if (error.message?.includes("already registered")) {
        setErrorMessage("Email already registered. Please use a different email address or sign in.");
      } else if (error.status === 504 || error.message?.includes("timeout")) {
        setErrorMessage("Request timed out. The server is taking too long to respond. Please try again later.");
        toast.error("Signup request timed out", {
          description: "Our servers are experiencing high load. Please try again in a moment."
        });
      } else if (error.message?.includes("Network error")) {
        setErrorMessage("Network error. Please check your internet connection and try again.");
      } else {
        // Fallback for other errors
        setErrorMessage(error.message || "An unexpected error occurred. Please try again.");
      }
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
          placeholder="Your first and last name"
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
        
        <motion.div
          whileTap={{ scale: 0.97 }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
        >
          <Button 
            type="submit" 
            className="w-full min-h-[44px] bg-purple-600 hover:bg-purple-700 touch-manipulation"
            disabled={isSubmitting}
            onClick={() => triggerHapticFeedback('medium')}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating account...
              </>
            ) : (
              "Create account"
            )}
          </Button>
        </motion.div>
      </form>
    </Form>
  );
};

export default SignUpForm;
