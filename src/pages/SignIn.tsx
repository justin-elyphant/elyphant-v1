
import React from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { EmailPasswordForm } from "@/components/auth/signin/EmailPasswordForm";
import { SocialLoginButtons } from "@/components/auth/signin/SocialLoginButtons";

const SignIn = () => {
  const navigate = useNavigate();

  const handleSignInSuccess = () => {
    navigate("/dashboard");
  };

  return (
    <div className="container max-w-md mx-auto py-10 px-4">
      <Card>
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">Sign In</CardTitle>
          <CardDescription>
            Enter your credentials to access your account
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <EmailPasswordForm onSuccess={handleSignInSuccess} />
          
          <div className="relative my-4 w-full">
            <Separator />
            <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-2 text-xs text-muted-foreground">
              OR CONTINUE WITH
            </span>
          </div>
          
          <SocialLoginButtons />
        </CardContent>
        
        <CardFooter className="flex flex-col">
          <div className="text-sm text-muted-foreground text-center mt-4">
            Don't have an account?{" "}
            <Link to="/sign-up" className="text-primary underline-offset-4 hover:underline">
              Sign up
            </Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};

export default SignIn;
