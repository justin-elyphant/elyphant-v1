
import React, { useState, useEffect } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
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

import { signUpUser, sendVerificationEmail } from "@/hooks/signup/signupService";
import SignUpForm, { SignUpFormValues } from "@/components/auth/signup/forms/SignUpForm";
import VerificationContainer from "@/components/auth/signup/verification/VerificationContainer";

const SignUp: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [step, setStep] = useState<"signup" | "verification">("signup");
  const [userEmail, setUserEmail] = useState<string>("");
  const [userName, setUserName] = useState<string>("");
  const [emailSent, setEmailSent] = useState<boolean>(false);

  useEffect(() => {
    const verified = searchParams.get('verified') === 'true';
    const email = searchParams.get('email');
    
    if (verified && email) {
      console.log("Email verified from URL parameters!");
      setUserEmail(email);
      navigate("/dashboard");
    }
  }, [searchParams, navigate]);

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
    }
  };

  const handleBackToSignUp = () => {
    setStep("signup");
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
            <SignUpForm onSubmit={onSignUpSubmit} />
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
        <VerificationContainer
          userEmail={userEmail}
          userName={userName}
          onBackToSignUp={handleBackToSignUp}
        />
      )}
    </div>
  );
};

export default SignUp;
