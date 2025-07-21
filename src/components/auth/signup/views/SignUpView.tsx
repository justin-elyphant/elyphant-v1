
import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmailPasswordSignUpForm } from "@/components/auth/signup/EmailPasswordSignUpForm";
import { Link } from "react-router-dom";

interface SignUpViewProps {
  onSignUpSuccess: () => void;
}

const SignUpView: React.FC<SignUpViewProps> = ({ onSignUpSuccess }) => {
  return (
    <Card className="w-full bg-background shadow-lg border border-border">
      <CardHeader className="space-y-1 text-center">
        <CardTitle className="font-sans text-2xl font-semibold text-foreground">Sign Up</CardTitle>
        <CardDescription className="text-sm text-muted-foreground">
          Create your account to get started
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <EmailPasswordSignUpForm onSuccess={onSignUpSuccess} />
        
        <div className="text-sm text-muted-foreground text-center mt-4">
          Already have an account?{" "}
          <Link 
            to="/signin" 
            className="text-primary font-semibold underline-offset-4 hover:underline"
          >
            Sign in
          </Link>
        </div>
      </CardContent>
    </Card>
  );
};

export default SignUpView;
