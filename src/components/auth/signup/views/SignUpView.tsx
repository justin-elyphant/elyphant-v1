
import React from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import SignUpForm, { SignUpFormValues } from "@/components/auth/signup/SignUpForm";
import { Link } from "react-router-dom";

interface SignUpViewProps {
  onSubmit: (values: SignUpFormValues) => Promise<void>;
  isSubmitting?: boolean;
}

const SignUpView: React.FC<SignUpViewProps> = ({ onSubmit, isSubmitting = false }) => {
  return (
    <Card>
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl text-center font-bold">Create an Account</CardTitle>
        <CardDescription className="text-center">
          Join our community to discover and share amazing gift ideas
        </CardDescription>
      </CardHeader>
      <CardContent>
        <SignUpForm onSubmit={onSubmit} isSubmitting={isSubmitting} />
      </CardContent>
      <CardFooter className="flex flex-col items-center gap-4">
        <div className="text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link to="/signin" className="text-purple-700 underline-offset-4 hover:underline">
            Sign in
          </Link>
        </div>
      </CardFooter>
    </Card>
  );
};

export default SignUpView;
