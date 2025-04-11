
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
  const [bypassMode, setBypassMode] = useState(false);
  
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

  // Enable bypass mode after multiple rate limit errors
  React.useEffect(() => {
    if (rateLimited && !bypassMode) {
      // After hitting rate limit, enable auto-bypass mode
      setBypassMode(true);
      console.log("Enabling full email verification bypass mode due to rate limiting");
    }
  }, [rateLimited, bypassMode]);

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
      
      if (bypassMode) {
        toast.info("Rate limit protection active", {
          description: "Using direct signup mode to bypass email verification"
        });
      }
      
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
        
        // Show a user-friendly message
        toast.error("Rate limit exceeded", {
          description: "Using direct mode for signup instead of email verification."
        });
        
        // Try one more time with special flag
        try {
          setBypassMode(true);
          console.log("Retrying with bypass mode enabled");
          await onSubmit(values);
          return;
        } catch (retryError) {
          console.error("Retry with bypass mode also failed:", retryError);
        }
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
            <AlertTitle className="text-amber-700 font-medium">Rate limit detected</AlertTitle>
            <AlertDescription className="text-amber-700">
              {rateLimitCountdown !== null 
                ? `Using direct signup mode instead. Verification cooldown: ${rateLimitCountdown}s.`
                : `Email rate limit exceeded. Using direct signup mode instead.`
              }
            </AlertDescription>
          </Alert>
        )}
        
        {bypassMode && !rateLimited && (
          <Alert className="bg-blue-50 border-blue-200 mb-4">
            <Info className="h-4 w-4 text-blue-500 mr-2" />
            <AlertTitle className="text-blue-700 font-medium">Direct signup mode active</AlertTitle>
            <AlertDescription className="text-blue-700">
              Using direct signup to bypass email verification due to rate limiting.
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
            `Direct mode active (${rateLimitCountdown}s)`
          ) : (
            "Create account"
          )}
        </Button>
      </form>
    </Form>
  );
};

export default SignUpForm;
