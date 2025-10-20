import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { Separator } from "@/components/ui/separator";
import { GoogleIcon } from "@/components/ui/icons/GoogleIcon";
import { toast } from "sonner";

const VendorPortalAuth = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [loginData, setLoginData] = useState({ email: "", password: "" });
  const [signupData, setSignupData] = useState({ 
    email: "", 
    password: "", 
    companyName: "",
    confirmPassword: ""
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginData.email || !loginData.password) {
      toast.error("Please fill in all fields");
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: loginData.email,
        password: loginData.password,
      });

      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          toast.error("Invalid email or password");
        } else if (error.message.includes('Email not confirmed')) {
          toast.error("Please check your email and click the verification link");
        } else {
          toast.error(error.message);
        }
        return;
      }

      if (data.user) {
        // Check vendor role using secure has_role function
        const { data: hasVendorRole } = await supabase
          .rpc('has_role', { 
            _user_id: data.user.id, 
            _role: 'vendor' 
          });

        if (hasVendorRole) {
          toast.success("Welcome back!");
          navigate("/vendor-management");
        } else {
          // Check if they have a pending application
          const { data: vendorAccount } = await supabase
            .from('vendor_accounts')
            .select('approval_status')
            .eq('user_id', data.user.id)
            .single();

          if (vendorAccount) {
            toast.error("Your vendor application is still under review");
          } else {
            toast.error("No vendor account found. Please apply to become a vendor first.");
            navigate("/vendor-partner");
          }
        }
      }
    } catch (err) {
      console.error('Login error:', err);
      toast.error("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signupData.email || !signupData.password || !signupData.companyName || !signupData.confirmPassword) {
      toast.error("Please fill in all fields");
      return;
    }

    if (signupData.password !== signupData.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (signupData.password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    setIsLoading(true);
    try {
      // Create auth user with vendor source attribution
      const { data, error } = await supabase.auth.signUp({
        email: signupData.email,
        password: signupData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/vendor-portal`,
          data: {
            signup_source: 'vendor_portal',
            user_type: 'vendor',
            company_name: signupData.companyName
          }
        }
      });

      if (error) {
        toast.error(error.message);
        return;
      }

      if (data.user) {
        // Set user identification
        const { error: identificationError } = await supabase
          .rpc('set_user_identification', {
            target_user_id: data.user.id,
            user_type_param: 'vendor',
            signup_source_param: 'vendor_portal',
            metadata_param: {
              company_name: signupData.companyName,
              signup_timestamp: new Date().toISOString(),
              signup_ip: window.location.hostname
            },
            attribution_param: {
              source: 'vendor_portal',
              campaign: 'vendor_signup',
              referrer: document.referrer || 'direct'
            }
          });

        if (identificationError) {
          console.error('Error setting user identification:', identificationError);
        }

        // Create vendor account record
        const { error: vendorError } = await supabase
          .from('vendor_accounts')
          .insert({
            user_id: data.user.id,
            company_name: signupData.companyName,
            contact_email: signupData.email,
            approval_status: 'pending'
          });

        if (vendorError) {
          console.error('Error creating vendor account:', vendorError);
          toast.error("Account created but vendor application failed. Please contact support.");
        } else {
          toast.success("Vendor application submitted! Please check your email for verification.");
          toast.info("Your application will be reviewed and you'll be notified once approved.");
        }
      }
    } catch (err) {
      console.error('Signup error:', err);
      toast.error("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/vendor-portal`,
          queryParams: {
            signup_source: 'vendor_portal',
            user_type: 'vendor'
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
    } finally {
      setIsLoading(false);
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
            <CardDescription className="text-slate-500 text-center">
              Access your vendor dashboard or apply to become a vendor
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2"
            >
              <GoogleIcon className="h-5 w-5" />
              Continue with Google
            </Button>
            
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <Separator />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-slate-500">Or continue with</span>
              </div>
            </div>

            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Sign In</TabsTrigger>
                <TabsTrigger value="signup">Apply</TabsTrigger>
              </TabsList>
              
              <TabsContent value="login" className="space-y-4 mt-4">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Email</label>
                    <Input 
                      type="email" 
                      placeholder="Enter your email"
                      value={loginData.email}
                      onChange={(e) => setLoginData({...loginData, email: e.target.value})}
                      className="w-full border-slate-300"
                      disabled={isLoading}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Password</label>
                    <Input 
                      type="password" 
                      placeholder="Enter your password"
                      value={loginData.password}
                      onChange={(e) => setLoginData({...loginData, password: e.target.value})}
                      className="w-full border-slate-300"
                      disabled={isLoading}
                    />
                  </div>
                  <Button 
                    type="submit" 
                    disabled={isLoading}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {isLoading ? "Signing in..." : "Sign In"}
                  </Button>
                </form>
              </TabsContent>
              
              <TabsContent value="signup" className="space-y-4 mt-4">
                <form onSubmit={handleSignup} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Company Name</label>
                    <Input 
                      type="text" 
                      placeholder="Your company name"
                      value={signupData.companyName}
                      onChange={(e) => setSignupData({...signupData, companyName: e.target.value})}
                      className="w-full border-slate-300"
                      disabled={isLoading}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Email</label>
                    <Input 
                      type="email" 
                      placeholder="Enter your email"
                      value={signupData.email}
                      onChange={(e) => setSignupData({...signupData, email: e.target.value})}
                      className="w-full border-slate-300"
                      disabled={isLoading}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Password</label>
                    <Input 
                      type="password" 
                      placeholder="Create a password"
                      value={signupData.password}
                      onChange={(e) => setSignupData({...signupData, password: e.target.value})}
                      className="w-full border-slate-300"
                      disabled={isLoading}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">Confirm Password</label>
                    <Input 
                      type="password" 
                      placeholder="Confirm your password"
                      value={signupData.confirmPassword}
                      onChange={(e) => setSignupData({...signupData, confirmPassword: e.target.value})}
                      className="w-full border-slate-300"
                      disabled={isLoading}
                    />
                  </div>
                  <Button 
                    type="submit" 
                    disabled={isLoading}
                    className="w-full bg-green-600 hover:bg-green-700 text-white"
                  >
                    {isLoading ? "Submitting..." : "Apply to Become a Vendor"}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
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
      <div className="text-center py-4">
        <Link 
          to="/" 
          className="text-sm text-slate-600 hover:text-slate-800"
        >
          ← Back to Elyphant
        </Link>
      </div>
    </div>
  );
};

export default VendorPortalAuth;