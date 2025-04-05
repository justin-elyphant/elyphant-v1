import React, { useState, useEffect } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { CaptchaField } from "@/components/auth/signup/fields/CaptchaField";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Mail, Lock, User, ArrowLeft, Check, Loader2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import EmailVerificationView from "@/components/auth/signup/EmailVerificationView";
import { signUpUser, sendVerificationEmail } from "@/hooks/signup/signupService";

const signUpSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters" }),
  email: z.string().email({ message: "Please enter a valid email address" }),
  password: z.string().min(8, { message: "Password must be at least 8 characters" }),
  captcha: z.string().min(1, { message: "Please enter the captcha code" }),
});

const verificationSchema = z.object({
  code: z.string().length(6, { message: "Verification code must be 6 digits" }),
});

type SignUpValues = z.infer<typeof signUpSchema>;
type VerificationValues = z.infer<typeof verificationSchema>;

const SignUp: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [step, setStep] = useState<"signup" | "verification">("signup");
  const [userEmail, setUserEmail] = useState<string>("");
  const [userName, setUserName] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [verificationError, setVerificationError] = useState<string>("");
  const [isVerified, setIsVerified] = useState<boolean>(false);
  const [emailSent, setEmailSent] = useState<boolean>(false);

  useEffect(() => {
    const verified = searchParams.get('verified') === 'true';
    const email = searchParams.get('email');
    
    if (verified && email) {
      console.log("Email verified from URL parameters!");
      setIsVerified(true);
      setUserEmail(email);
      navigate("/dashboard");
    }
  }, [searchParams, navigate]);

  const signUpForm = useForm<SignUpValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      captcha: "",
    },
  });

  const verificationForm = useForm<VerificationValues>({
    resolver: zodResolver(verificationSchema),
    defaultValues: {
      code: "",
    },
  });

  const onSignUpSubmit = async (values: SignUpValues) => {
    try {
      setIsSubmitting(true);
      
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
      
      if (!emailResult.success) {
        console.error("Failed to send verification code:", emailResult.error);
        toast.error("Failed to send verification code", {
          description: "Please try again or contact support.",
        });
        return;
      } else {
        console.log("Custom verification email sent successfully");
        toast.success("Account created! Check your email for verification code.");
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
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendCode = async () => {
    try {
      setIsSubmitting(true);
      const currentOrigin = window.location.origin;
      const result = await sendVerificationEmail(userEmail, userName, currentOrigin);
      
      if (result.success) {
        toast.success("Verification code resent", {
          description: "Please check your email for the new code.",
        });
      } else {
        toast.error("Failed to resend code", {
          description: "Please try again or contact support.",
        });
      }
    } catch (error) {
      toast.error("Failed to resend code");
    } finally {
      setIsSubmitting(false);
    }
  };

  const onVerificationSubmit = async (values: VerificationValues) => {
    try {
      setIsSubmitting(true);
      setVerificationError("");
      
      const { data, error } = await supabase.functions.invoke('verify-email-code', {
        body: {
          email: userEmail,
          code: values.code
        }
      });
      
      if (error || !data.success) {
        setVerificationError(error?.message || "Invalid verification code");
        return;
      }
      
      toast.success("Email verified!", {
        description: "Your account is now ready to use.",
      });
      
      const { data: sessionData } = await supabase.auth.getSession();
      
      if (sessionData.session) {
        navigate("/dashboard");
      } else {
        navigate("/sign-in");
      }
    } catch (error: any) {
      setVerificationError(error.message || "Verification failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  const checkEmailVerification = async () => {
    try {
      setIsSubmitting(true);
      
      const { data, error } = await supabase.auth.getSession();
      
      if (error) {
        toast.error("Failed to check verification status");
        return { verified: false };
      }
      
      if (data?.session?.user?.email_confirmed_at) {
        setIsVerified(true);
        toast.success("Email verified!");
        
        navigate("/dashboard");
        return { verified: true };
      }
      
      toast.error("Email not verified yet", {
        description: "Please enter the verification code sent to your email."
      });
      return { verified: false };
    } catch (err) {
      toast.error("Failed to check verification status");
      return { verified: false };
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBackToSignUp = () => {
    setStep("signup");
    setVerificationError("");
  };

  const verifyWithCode = async (code: string): Promise<boolean> => {
    try {
      setIsSubmitting(true);
      setVerificationError("");
      
      const { data, error } = await supabase.functions.invoke('verify-email-code', {
        body: {
          email: userEmail,
          code: code
        }
      });
      
      if (error || !data.success) {
        setVerificationError(error?.message || "Invalid verification code");
        return false;
      }
      
      toast.success("Email verified!", {
        description: "Your account is now ready to use.",
      });
      
      setIsVerified(true);
      
      const { data: sessionData } = await supabase.auth.getSession();
      
      if (sessionData.session) {
        setTimeout(() => {
          navigate("/dashboard");
        }, 1500);
      } else {
        setTimeout(() => {
          navigate("/sign-in");  
        }, 1500);
      }
      
      return true;
    } catch (error: any) {
      setVerificationError(error.message || "Verification failed");
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container max-w-md mx-auto py-10 px-4">
      {step === "signup" ? (
        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl">Create an account</CardTitle>
            <CardDescription>
              Enter your details below to create your account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...signUpForm}>
              <form onSubmit={signUpForm.handleSubmit(onSignUpSubmit)} className="space-y-4">
                <FormField
                  control={signUpForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                          <Input placeholder="Your name" className="pl-10" {...field} />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={signUpForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                          <Input type="email" placeholder="your@email.com" className="pl-10" {...field} />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={signUpForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
                          <Input type="password" placeholder="********" className="pl-10" {...field} />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="pt-2">
                  <CaptchaField form={signUpForm} />
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
          </CardContent>
          <CardFooter className="flex justify-center">
            <p className="text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link to="/sign-in" className="text-purple-600 hover:text-purple-700 font-medium">
                Sign in
              </Link>
            </p>
          </CardFooter>
        </Card>
      ) : (
        <EmailVerificationView 
          userEmail={userEmail}
          verificationChecking={isSubmitting}
          onCheckVerification={checkEmailVerification}
          isVerified={isVerified}
          onVerifyWithCode={verifyWithCode}
        />
      )}
    </div>
  );
};

export default SignUp;
