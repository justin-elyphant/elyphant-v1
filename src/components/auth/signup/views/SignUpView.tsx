
import React from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import SignUpForm, { SignUpFormValues } from "@/components/auth/signup/SignUpForm";
import { Link } from "react-router-dom";
import { SocialLoginButtons } from "@/components/auth/signin/SocialLoginButtons"; // Reusing from signin
import { Separator } from "@/components/ui/separator";

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
      <CardContent className="space-y-4">
        <SignUpForm onSubmit={onSubmit} isSubmitting={isSubmitting} />
        
        <div className="relative my-4 w-full">
          <Separator className="bg-slate-300" />
          <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-background px-2 text-xs text-muted-foreground">
            OR SIGN UP WITH
          </span>
        </div>
        
        <SocialLoginButtons />
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
