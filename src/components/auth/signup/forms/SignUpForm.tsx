
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Mail, Lock, User, Loader2, AlertTriangle } from "lucide-react";
import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import InputField from "../fields/InputField";
import { CaptchaField } from "../fields/CaptchaField";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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
  const [rateLimitRetryAt, setRateLimitRetryAt] = useState<Date | null>(null);
  const [rateLimitCountdown, setRateLimitCountdown] = useState<number | null>(null);
  
  const form = useForm<SignUpFormValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      captcha: "",
    },
  });

  // Set up a countdown timer when we hit a rate limit
  React.useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null;
    
    if (rateLimited && rateLimitRetryAt) {
      intervalId = setInterval(() => {
        const now = new Date();
        const secondsRemaining = Math.max(0, Math.floor((rateLimitRetryAt.getTime() - now.getTime()) / 1000));
        
        setRateLimitCountdown(secondsRemaining);
        
        if (secondsRemaining <= 0) {
          setRateLimited(false);
          setRateLimitRetryAt(null);
          setRateLimitCountdown(null);
          if (intervalId) clearInterval(intervalId);
        }
      }, 1000);
    }
    
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [rateLimited, rateLimitRetryAt]);

  const handleSubmit = async (values: SignUpFormValues) => {
    // Validate the captcha - the field component handles the validation internally
    const captchaField = document.querySelector(".CaptchaField") as HTMLElement;
    if (captchaField && captchaField.querySelector(".text-destructive")) {
      return;
    }
    
    // Check if we're still rate limited
    if (rateLimited && rateLimitRetryAt && new Date() < rateLimitRetryAt) {
      const secondsRemaining = Math.floor((rateLimitRetryAt.getTime() - new Date().getTime()) / 1000);
      toast.error("Still rate limited", {
        description: `Please wait ${secondsRemaining} seconds before trying again.`
      });
      return;
    }
    
    // Reset rate limit state if trying again
    if (rateLimited) {
      setRateLimited(false);
      setRateLimitRetryAt(null);
      setRateLimitCountdown(null);
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
        
        // Set a retry time 2 minutes from now
        const retryAt = new Date();
        retryAt.setMinutes(retryAt.getMinutes() + 2);
        
        setRateLimited(true);
        setRateLimitRetryAt(retryAt);
        setRateLimitCountdown(120); // Start with 120 seconds
        
        toast.error("Rate limit exceeded", {
          description: "Please wait a few minutes before trying again."
        });
      } else if (error.message?.includes("already registered") || error.message?.includes("user_exists")) {
        toast.error("Email already registered", {
          description: "Please try a different email address or sign in."
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
            <AlertTriangle className="h-4 w-4 text-amber-500 mr-2" />
            <AlertTitle className="text-amber-700 font-medium">Rate limit exceeded</AlertTitle>
            <AlertDescription className="text-amber-700">
              {rateLimitCountdown !== null 
                ? `Please wait ${rateLimitCountdown} seconds before trying again, or use a different email address.`
                : `Email rate limit exceeded. Please try again in a few minutes or use a different email address.`
              }
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
          disabled={isSubmitting || (rateLimited && rateLimitCountdown !== null && rateLimitCountdown > 0)}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating account...
            </>
          ) : rateLimited && rateLimitCountdown !== null && rateLimitCountdown > 0 ? (
            `Try again in ${rateLimitCountdown}s`
          ) : (
            "Create account"
          )}
        </Button>
      </form>
    </Form>
  );
};

export default SignUpForm;
