
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Mail, Lock, User, Loader2 } from "lucide-react";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import InputField from "../fields/InputField";
import { CaptchaField } from "../fields/CaptchaField";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info } from "lucide-react";

// Schema definition
const signUpSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters" }),
  email: z.string().email({ message: "Please enter a valid email address" }),
  password: z.string().min(8, { message: "Password must be at least 8 characters" }),
  captcha: z.string().min(1, { message: "Please enter the captcha code" }),
});

export type SignUpFormValues = z.infer<typeof signUpSchema>;

interface SignUpFormProps {
  onSubmit: (values: SignUpFormValues) => Promise<void>;
}

const SignUpForm = ({ onSubmit }: SignUpFormProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [rateLimited, setRateLimited] = useState(false);
  
  const form = useForm<SignUpFormValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      captcha: "",
    },
  });

  const handleSubmit = async (values: SignUpFormValues) => {
    // Validate the captcha - the field component handles the validation internally
    const captchaField = document.querySelector(".CaptchaField") as HTMLElement;
    if (captchaField && captchaField.querySelector(".text-destructive")) {
      return;
    }
    
    // Reset rate limit state if trying again
    if (rateLimited) {
      setRateLimited(false);
    }
    
    try {
      setIsSubmitting(true);
      console.log("Submitting signup form with values:", { ...values, password: "[REDACTED]" });
      await onSubmit(values);
    } catch (error: any) {
      console.error("Form submission error:", error);
      
      // Enhanced rate limit detection with more comprehensive patterns
      if (error.message?.toLowerCase().includes("rate limit") || 
          error.message?.toLowerCase().includes("exceeded") || 
          error.message?.toLowerCase().includes("too many") || 
          error.status === 429 || 
          error.code === "over_email_send_rate_limit" ||
          error.code === "too_many_requests") {
        console.log("Rate limit detected, showing rate limit message");
        setRateLimited(true);
        
        toast.error("Rate limit exceeded", {
          description: "Please wait a moment before trying again."
        });
      } else {
        toast.error("Sign up failed", {
          description: error.message || "Please try again"
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        {rateLimited && (
          <Alert className="bg-amber-50 border-amber-200 mb-4">
            <Info className="h-4 w-4 text-amber-500 mr-2" />
            <AlertDescription className="text-amber-700">
              Email rate limit exceeded. Please try again in a few minutes or use a different email address.
            </AlertDescription>
          </Alert>
        )}
        
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

        <div className="CaptchaField pt-2">
          <CaptchaField form={form} />
        </div>
        
        <Button 
          type="submit" 
          className="w-full bg-purple-600 hover:bg-purple-700"
          disabled={isSubmitting}
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
      </form>
    </Form>
  );
};

export default SignUpForm;
