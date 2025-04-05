
import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
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

// Define signup schema with validation
const signUpSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters" }),
  email: z.string().email({ message: "Please enter a valid email address" }),
  password: z.string().min(8, { message: "Password must be at least 8 characters" }),
  captcha: z.string().min(1, { message: "Please enter the captcha code" }),
});

// Define verification schema
const verificationSchema = z.object({
  code: z.string().length(6, { message: "Verification code must be 6 digits" }),
});

type SignUpValues = z.infer<typeof signUpSchema>;
type VerificationValues = z.infer<typeof verificationSchema>;

const SignUp: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<"signup" | "verification">("signup");
  const [userEmail, setUserEmail] = useState<string>("");
  const [userName, setUserName] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [verificationError, setVerificationError] = useState<string>("");

  // Form for sign up
  const signUpForm = useForm<SignUpValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      captcha: "",
    },
  });

  // Form for verification code
  const verificationForm = useForm<VerificationValues>({
    resolver: zodResolver(verificationSchema),
    defaultValues: {
      code: "",
    },
  });

  // Handle signup form submission
  const onSignUpSubmit = async (values: SignUpValues) => {
    try {
      setIsSubmitting(true);
      
      // Sign up user with Supabase Auth
      const { data, error } = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
        options: {
          data: {
            name: values.name,
          },
          emailRedirectTo: undefined, // Explicitly disable email redirect
        }
      });
      
      if (error) {
        toast.error("Signup failed", {
          description: error.message,
        });
        return;
      }
      
      // Save user email and name for verification step
      setUserEmail(values.email);
      setUserName(values.name);
      
      // Send custom verification email with code
      const currentOrigin = window.location.origin;
      const emailResult = await sendVerificationEmail(values.email, values.name, currentOrigin);
      
      if (!emailResult.success) {
        toast.error("Failed to send verification code", {
          description: "Please try again or contact support.",
        });
        return;
      }
      
      // Move to verification step
      toast.success("Verification code sent", {
        description: "Please check your email for the verification code.",
      });
      setStep("verification");
    } catch (error: any) {
      toast.error("Signup failed", {
        description: error.message || "An unexpected error occurred",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Send verification email with code
  const sendVerificationEmail = async (email: string, name: string, verificationUrl: string) => {
    try {
      const baseUrl = verificationUrl.endsWith('/') ? verificationUrl.slice(0, -1) : verificationUrl;
      
      const emailResponse = await supabase.functions.invoke('send-verification-email', {
        body: {
          email: email,
          name: name,
          verificationUrl: baseUrl,
          useVerificationCode: true
        }
      });
      
      if (emailResponse.error) {
        throw new Error(emailResponse.error.message || "Failed to send verification email");
      }
      
      return { success: true };
    } catch (error) {
      console.error("Failed to send verification email:", error);
      return { success: false, error };
    }
  };

  // Resend verification code
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

  // Handle verification form submission
  const onVerificationSubmit = async (values: VerificationValues) => {
    try {
      setIsSubmitting(true);
      setVerificationError("");
      
      // Verify code with edge function
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
      
      // Success - redirect to dashboard or sign in
      toast.success("Email verified!", {
        description: "Your account is now ready to use.",
      });
      
      // Try to get the session after verification
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

  // Go back to sign up step
  const handleBackToSignUp = () => {
    setStep("signup");
    setVerificationError("");
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
        <Card>
          <CardHeader className="space-y-1">
            <div className="flex items-center">
              <Button 
                variant="ghost" 
                size="icon" 
                className="mr-2" 
                onClick={handleBackToSignUp} 
                type="button"
                disabled={isSubmitting}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <CardTitle className="text-2xl">Verify your email</CardTitle>
            </div>
            <CardDescription>
              Enter the 6-digit code sent to {userEmail}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {verificationError && (
              <Alert variant="destructive">
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{verificationError}</AlertDescription>
              </Alert>
            )}
            
            <Form {...verificationForm}>
              <form onSubmit={verificationForm.handleSubmit(onVerificationSubmit)} className="space-y-6">
                <FormField
                  control={verificationForm.control}
                  name="code"
                  render={({ field }) => (
                    <FormItem className="flex flex-col items-center justify-center">
                      <FormLabel className="text-center mb-2">Verification Code</FormLabel>
                      <FormControl>
                        <InputOTP maxLength={6} {...field}>
                          <InputOTPGroup>
                            <InputOTPSlot index={0} />
                            <InputOTPSlot index={1} />
                            <InputOTPSlot index={2} />
                            <InputOTPSlot index={3} />
                            <InputOTPSlot index={4} />
                            <InputOTPSlot index={5} />
                          </InputOTPGroup>
                        </InputOTP>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="space-y-4">
                  <Button 
                    type="submit" 
                    className="w-full bg-purple-600 hover:bg-purple-700"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Verifying...
                      </>
                    ) : (
                      <>
                        <Check className="mr-2 h-4 w-4" />
                        Verify Email
                      </>
                    )}
                  </Button>
                  
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full"
                    onClick={handleResendCode}
                    disabled={isSubmitting}
                  >
                    Resend Code
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default SignUp;
