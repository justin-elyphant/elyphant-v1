
import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Separator } from "@/components/ui/separator";
import { GoogleIcon } from "@/components/ui/icons/GoogleIcon";
import { toast } from "sonner";

const TrunklineLogin = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isSignUp) {
      if (!email || !password || !name) {
        toast.error("Please fill in all fields");
        return;
      }
    } else {
      if (!email || !password) {
        toast.error("Please enter both email and password");
        return;
      }
    }

    // Check if email is from elyphant.com domain
    if (!email.toLowerCase().endsWith('@elyphant.com')) {
      toast.error("Access restricted to @elyphant.com email addresses");
      return;
    }

    setIsLoading(true);

    try {
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/trunkline`,
            data: {
              name: name,
              user_type: 'employee'
            }
          }
        });

        if (error) {
          console.error('Sign up error:', error);
          
          if (error.message.includes('User already registered')) {
            toast.error('Account already exists. Try signing in instead.');
          } else {
            toast.error('Failed to create account. Please try again.');
          }
          return;
        }

        if (data.user) {
          toast.success('Account created! Please check your email to confirm your account.');
          setIsSignUp(false); // Switch back to login mode
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          console.error('Sign in error:', error);
          
          if (error.message.includes('Invalid login credentials')) {
            toast.error('Invalid email or password');
          } else if (error.message.includes('Email not confirmed')) {
            toast.error('Please check your email and confirm your account');
          } else {
            toast.error('Failed to sign in. Please try again.');
          }
          return;
        }

        if (data.user) {
          toast.success('Signed in successfully');
          // The TrunklineGuard will handle the access check and navigation
        }
      }
    } catch (err) {
      console.error('Auth error:', err);
      toast.error('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `https://elyphant.ai/trunkline`,
          queryParams: {
            hd: 'elyphant.com' // Restrict to elyphant.com domain
          }
        }
      });

      if (error) {
        console.error('Google sign in error:', error);
        toast.error('Failed to sign in with Google');
      }
    } catch (err) {
      console.error('Google sign in error:', err);
      toast.error('Failed to sign in with Google');
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-100">
      <div className="container max-w-md mx-auto py-10 px-4 flex-grow flex items-center justify-center">
        <Card className="w-full bg-white shadow-lg border-slate-200">
          <CardHeader className="space-y-1">
            <div className="flex items-center justify-center mb-4">
              <h1 className="text-2xl font-bold text-slate-800">Trunkline</h1>
            </div>
            <CardTitle className="text-xl text-slate-700">
              {isSignUp ? 'Create Employee Account' : 'Employee Login'}
            </CardTitle>
            <CardDescription className="text-slate-500">
              {isSignUp 
                ? 'Create an account to access the Trunkline admin portal' 
                : 'Sign in to access the Trunkline admin portal'
              }
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleGoogleSignIn}
              className="w-full flex items-center justify-center gap-2"
            >
              <GoogleIcon className="h-5 w-5" />
              Sign in with Google
            </Button>
            
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <Separator />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-slate-500">Or continue with</span>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {isSignUp && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Full Name</label>
                  <Input 
                    type="text" 
                    placeholder="Enter your full name"
                    className="w-full border-slate-300"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
              )}
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Email</label>
                <Input 
                  type="email" 
                  placeholder="Enter your @elyphant.com email"
                  className="w-full border-slate-300"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Password</label>
                <PasswordInput 
                  placeholder="Enter your password"
                  className="w-full border-slate-300"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <Button 
                type="submit" 
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                disabled={isLoading}
              >
                {isLoading 
                  ? (isSignUp ? "Creating Account..." : "Signing In...")
                  : (isSignUp ? "Create Account" : "Sign In")
                }
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex flex-col items-center space-y-2">
            {!isSignUp && (
              <Link 
                to="/forgot-password" 
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                Forgot password?
              </Link>
            )}
            <button
              type="button"
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-sm text-slate-600 hover:text-slate-700"
            >
              {isSignUp 
                ? "Already have an account? Sign in" 
                : "Need an account? Sign up"
              }
            </button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default TrunklineLogin;
