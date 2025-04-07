
import React from "react";
import { Link } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import SignUpForm, { SignUpFormValues } from "@/components/auth/signup/forms/SignUpForm";
import VerificationContainer from "@/components/auth/signup/verification/VerificationContainer";

interface SignUpContentWrapperProps {
  step: "signup" | "verification";
  userEmail: string;
  userName: string;
  resendCount: number;
  testVerificationCode: string | null;
  onSignUpSubmit: (values: SignUpFormValues) => Promise<void>;
  handleResendVerification: () => Promise<{ success: boolean; rateLimited?: boolean }>;
  handleBackToSignUp: () => void;
}

const SignUpContentWrapper: React.FC<SignUpContentWrapperProps> = ({
  step,
  userEmail,
  userName,
  resendCount,
  testVerificationCode,
  onSignUpSubmit,
  handleResendVerification,
  handleBackToSignUp,
}) => {
  if (step === "signup") {
    return (
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
    );
  }

  return (
    <VerificationContainer
      userEmail={userEmail}
      userName={userName}
      onBackToSignUp={handleBackToSignUp}
      onResendVerification={handleResendVerification}
      resendCount={resendCount}
      testVerificationCode={testVerificationCode}
    />
  );
};

export default SignUpContentWrapper;
