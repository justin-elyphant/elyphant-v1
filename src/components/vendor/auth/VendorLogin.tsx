
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
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Separator } from "@/components/ui/separator";
import { GoogleIcon } from "@/components/ui/icons/GoogleIcon";
import { toast } from "sonner";

const VendorLogin = () => {
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Redirect to new vendor portal
    navigate("/vendor-portal");
  };

  const handleGoogleSignIn = async () => {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/vendor-portal`,
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
              <h1 className="text-2xl font-bold text-slate-800">Vendor Portal</h1>
            </div>
            <CardTitle className="text-xl text-slate-700">Sign In</CardTitle>
            <CardDescription className="text-slate-500">
              Sign in to manage your product listings
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
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Email</label>
                <Input 
                  type="email" 
                  placeholder="Enter your email"
                  className="w-full border-slate-300"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Password</label>
                <Input 
                  type="password" 
                  placeholder="Enter your password"  
                  className="w-full border-slate-300"
                />
              </div>
              <Button 
                type="submit" 
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              >
                Sign In
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex justify-center">
            <Link 
              to="/forgot-password" 
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              Forgot password?
            </Link>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default VendorLogin;
