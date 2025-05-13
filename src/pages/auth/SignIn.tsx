
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
import { useAuth } from "@/contexts/auth";
import Header from "@/components/home/Header";

const SignIn = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  React.useEffect(() => {
    if (user) {
      navigate("/dashboard", { replace: true });
    }
  }, [user, navigate]);

  const handleSignInSuccess = () => {
    console.log("Sign in successful, awaiting user state update for redirect");
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <div className="container max-w-md mx-auto py-10 px-4 bg-gradient-to-br from-[#9b87f5] to-[#6E59A5] flex-grow flex items-center justify-center">
        <Card className="w-full bg-white/90 backdrop-blur-sm shadow-2xl border-none">
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-2xl font-bold text-[#6E59A5]">Sign In</CardTitle>
            <CardDescription className="text-slate-600">
              Enter your credentials to access your account
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <EmailPasswordForm onSuccess={handleSignInSuccess} />
            
            <div className="relative my-4 w-full">
              <Separator className="bg-slate-300" />
              <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-2 text-xs text-muted-foreground">
                OR CONTINUE WITH
              </span>
            </div>
            
            <SocialLoginButtons />
          </CardContent>
          
          <CardFooter className="flex flex-col">
            <div className="text-sm text-muted-foreground text-center mt-4">
              Don't have an account?{" "}
              <Link 
                to="/signup" 
                className="text-[#6E59A5] font-semibold underline-offset-4 hover:underline"
              >
                Sign up
              </Link>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default SignIn;
