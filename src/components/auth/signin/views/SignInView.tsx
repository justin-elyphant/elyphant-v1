
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
    <Card className="w-full bg-background shadow-lg border border-border"> {/* Clean white card style */}
      <CardHeader className="space-y-1 text-center">
        <CardTitle className="text-2xl font-bold text-foreground">Sign In</CardTitle> {/* Standard text color */}
        <CardDescription className="text-muted-foreground">
          Enter your credentials to access your account
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <EmailPasswordForm onSuccess={onSignInSuccess} />
        
        <div className="relative my-4 w-full">
          <Separator className="bg-border" /> {/* Use border color for separator */}
          <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-background px-2 text-xs text-muted-foreground">
            OR SIGN IN WITH
          </span>
        </div>
        
        <SocialLoginButtons />
      </CardContent>
      
      <CardFooter className="flex flex-col items-center gap-2"> {/* Reduced gap for footer */}
        <div className="text-sm text-muted-foreground text-center">
          Don't have an account?{" "}
          <Link 
            to="/signup" 
            className="text-primary font-semibold underline-offset-4 hover:underline" // Use primary color for link
          >
            Sign up
          </Link>
        </div>
        <div className="text-sm text-muted-foreground text-center">
          Forgot your password?{" "}
          <Link 
            to="/reset-password" 
            className="text-primary font-semibold underline-offset-4 hover:underline" // Use primary color for link
          >
            Reset it
          </Link>
        </div>
      </CardFooter>
    </Card>
  );
};

export default SignInView;
