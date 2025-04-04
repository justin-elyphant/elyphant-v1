
import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, Lock, Facebook, Apple } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { FcGoogle } from "react-icons/fc";
import { Separator } from "@/components/ui/separator";

const SignIn = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState<{[key: string]: boolean}>({
    google: false,
    apple: false,
    facebook: false
  });
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setError(error.message);
        toast.error("Sign in failed", {
          description: error.message,
        });
      } else {
        toast.success("Signed in successfully!");
        navigate("/dashboard");
      }
    } catch (err) {
      console.error("Sign in error:", err);
      setError("An unexpected error occurred");
      toast.error("Sign in failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialLogin = async (provider: 'google' | 'apple' | 'facebook') => {
    try {
      setSocialLoading({ ...socialLoading, [provider]: true });
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/dashboard`,
          queryParams: provider === 'facebook' ? {
            access_type: 'offline',
            scope: 'email,public_profile,user_friends'
          } : undefined
        }
      });
      
      if (error) {
        toast.error(`${provider} sign-in failed`, {
          description: error.message,
        });
      }
    } catch (err) {
      console.error(`${provider} sign-in error:`, err);
      toast.error(`Failed to sign in with ${provider}`);
    } finally {
      setSocialLoading({ ...socialLoading, [provider]: false });
    }
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
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Link
                  to="/reset-password"
                  className="text-sm text-primary underline-offset-4 hover:underline"
                >
                  Forgot?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
            </div>
            {error && (
              <div className="text-sm text-destructive">{error}</div>
            )}
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button 
              type="submit" 
              className="w-full bg-purple-600 hover:bg-purple-700"
              disabled={isLoading}
            >
              {isLoading ? "Signing in..." : "Sign In"}
            </Button>
            
            <div className="relative my-4 w-full">
              <Separator />
              <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-2 text-xs text-muted-foreground">
                OR CONTINUE WITH
              </span>
            </div>
            
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => handleSocialLogin('google')}
                disabled={socialLoading.google}
                className="flex items-center justify-center gap-2"
              >
                <FcGoogle className="h-5 w-5" />
                <span className="sr-only sm:not-sr-only sm:inline-block">Google</span>
              </Button>
              
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => handleSocialLogin('apple')}
                disabled={socialLoading.apple}
                className="flex items-center justify-center gap-2"
              >
                <Apple className="h-5 w-5" />
                <span className="sr-only sm:not-sr-only sm:inline-block">Apple</span>
              </Button>
              
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => handleSocialLogin('facebook')}
                disabled={socialLoading.facebook}
                className="flex items-center justify-center gap-2"
              >
                <Facebook className="h-5 w-5 text-blue-600" />
                <span className="sr-only sm:not-sr-only sm:inline-block">Facebook</span>
              </Button>
            </div>
            
            <div className="text-sm text-muted-foreground text-center mt-4">
              Don't have an account?{" "}
              <Link to="/sign-up" className="text-primary underline-offset-4 hover:underline">
                Sign up
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default SignIn;
