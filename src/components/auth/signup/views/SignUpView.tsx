
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
import { Separator } from "@/components/ui/separator";
import SignUpForm, { SignUpFormValues } from "@/components/auth/signup/SignUpForm";
import { SocialLoginButtons } from "@/components/auth/signin/SocialLoginButtons";

interface SignUpViewProps {
  onSubmit: (values: SignUpFormValues) => Promise<void>;
  isSubmitting?: boolean;
}

const SignUpView: React.FC<SignUpViewProps> = ({ onSubmit, isSubmitting = false }) => {
  return (
    <Card className="w-full bg-white/90 backdrop-blur-sm shadow-2xl border-none">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl text-[#6E59A5]">Create an account</CardTitle>
        <CardDescription>
          Enter your details below to create your account
        </CardDescription>
      </CardHeader>
      <CardContent>
        <SignUpForm onSubmit={onSubmit} isSubmitting={isSubmitting} />
        
        <div className="relative my-4 w-full">
          <Separator className="bg-slate-300" />
          <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-2 text-xs text-muted-foreground">
            OR CONTINUE WITH
          </span>
        </div>
        
        <SocialLoginButtons />
      </CardContent>
      <CardFooter className="flex justify-center">
        <p className="text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link to="/signin" className="text-[#6E59A5] hover:text-[#9b87f5] font-medium">
            Sign in
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
};

export default SignUpView;
