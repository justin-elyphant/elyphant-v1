
import React from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { EmailPasswordForm } from "@/components/auth/signin/EmailPasswordForm";
import { SocialLoginButtons } from "@/components/auth/signin/SocialLoginButtons";
import { Separator } from "@/components/ui/separator";
import { Link } from "react-router-dom";

interface SignInViewProps {
  onSignInSuccess: () => void;
}

const SignInView: React.FC<SignInViewProps> = ({ onSignInSuccess }) => {
  return (
    <Card className="w-full bg-white/90 backdrop-blur-sm shadow-2xl border-none">
      <CardHeader className="space-y-1 text-center">
        <CardTitle className="text-2xl font-bold text-purple-700">Welcome Back</CardTitle>
        <CardDescription className="text-slate-600">
          Sign in to continue to your account
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <EmailPasswordForm onSuccess={onSignInSuccess} />
        
        <div className="relative my-4 w-full">
          <Separator className="bg-slate-300" />
          <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-2 text-xs text-muted-foreground">
            OR CONTINUE WITH
          </span>
        </div>
        
        <SocialLoginButtons />
      </CardContent>
      
      <CardFooter className="flex flex-col">
        <div className="text-sm text-muted-foreground text-center mt-2">
          Don't have an account?{" "}
          <Link 
            to="/signup" 
            className="text-purple-700 font-semibold underline-offset-4 hover:underline"
          >
            Sign up
          </Link>
        </div>
        <div className="text-sm text-muted-foreground text-center mt-2">
          Forgot your password?{" "}
          <Link 
            to="/reset-password" 
            className="text-purple-700 font-semibold underline-offset-4 hover:underline"
          >
            Reset it
          </Link>
        </div>
      </CardFooter>
    </Card>
  );
};

export default SignInView;
