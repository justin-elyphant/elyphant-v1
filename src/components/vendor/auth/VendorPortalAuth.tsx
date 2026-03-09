import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { Separator } from "@/components/ui/separator";
import { GoogleIcon } from "@/components/ui/icons/GoogleIcon";
import { toast } from "sonner";
import { CheckCircle } from "lucide-react";
import { motion } from "framer-motion";

const VendorPortalAuth = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [countdown, setCountdown] = useState(5);
  const [showResendVerification, setShowResendVerification] = useState(false);
  const [loginData, setLoginData] = useState({ email: "", password: "" });
  const [signupData, setSignupData] = useState({ 
    firstName: "",
    lastName: "",
    title: "",
    email: "", 
    password: "", 
    companyName: "",
    confirmPassword: "",
    website: "",
    phone: "",
    description: ""
  });

  // Auto-redirect after submission
  useEffect(() => {
    if (!submitted) return;
    if (countdown <= 0) {
      navigate('/');
      return;
    }
    const timer = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [submitted, countdown, navigate]);

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
          toast.error("Please verify your email before signing in");
          setShowResendVerification(true);
        } else {
          toast.error(error.message);
        }
        return;
      }

      if (data.user) {
        const { data: hasVendorRole } = await supabase
          .rpc('has_role', { 
            _user_id: data.user.id, 
            _role: 'vendor' 
          });

        if (hasVendorRole) {
          toast.success("Welcome back!");
          navigate("/vendor");
        } else {
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
    if (!signupData.firstName || !signupData.lastName || !signupData.title || !signupData.email || !signupData.password || !signupData.companyName || !signupData.confirmPassword || !signupData.website || !signupData.phone || !signupData.description) {
      toast.error("Please fill in all required fields");
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
      const { data, error } = await supabase.auth.signUp({
        email: signupData.email,
        password: signupData.password,
        options: {
          emailRedirectTo: `${window.location.origin}/vendor-portal`,
          data: {
            signup_source: 'vendor_portal',
            user_type: 'vendor',
            first_name: signupData.firstName,
            last_name: signupData.lastName,
            title: signupData.title,
            company_name: signupData.companyName
          }
        }
      });

      if (error) {
        toast.error(error.message);
        return;
      }

      if (data.user) {
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

        const { error: vendorError } = await supabase
          .from('vendor_accounts')
          .insert({
            user_id: data.user.id,
            company_name: signupData.companyName,
            contact_email: signupData.email,
            website: signupData.website ? `https://${signupData.website}` : null,
            phone: signupData.phone || null,
            description: signupData.description || null,
            approval_status: 'pending'
          });

        if (vendorError) {
          console.error('Error creating vendor account:', vendorError);
          toast.error("Account created but vendor application failed. Please contact support.");
        } else {
          supabase.functions.invoke('ecommerce-email-orchestrator', {
            body: {
              eventType: 'vendor_application_received',
              recipientEmail: signupData.email,
              data: { 
                company_name: signupData.companyName,
                website: signupData.website ? `https://${signupData.website}` : undefined,
                phone: signupData.phone || undefined,
                description: signupData.description || undefined
              }
            }
          }).catch((err) => console.error('Failed to send vendor application email:', err));

          // Sign out vendor immediately — they should not land on the shopper dashboard
          await supabase.auth.signOut();

          setSubmitted(true);
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

  // Confirmation view after successful submission
  if (submitted) {
    return (
      <div className="flex flex-col min-h-screen bg-[hsl(var(--background))]">
        <div className="container max-w-md mx-auto py-10 px-4 flex-grow flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full"
          >
            <Card className="w-full bg-white rounded-none border-border shadow-sm">
              <CardContent className="flex flex-col items-center text-center py-12 px-6 space-y-6">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                >
                  <CheckCircle className="h-16 w-16 text-foreground" strokeWidth={1.5} />
                </motion.div>

                <div className="space-y-2">
                  <h1 className="text-2xl font-semibold tracking-tight text-foreground">
                    Application Submitted
                  </h1>
                  <p className="text-sm text-muted-foreground leading-relaxed max-w-xs mx-auto">
                    Thank you for applying to become a vendor on Elyphant. We'll review your application and notify you by email once approved.
                  </p>
                </div>

                <div className="bg-muted/50 rounded-none px-4 py-3 w-full">
                  <p className="text-xs text-muted-foreground">
                    Application for <span className="font-medium text-foreground">{signupData.companyName}</span>
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Confirmation sent to <span className="font-medium text-foreground">{signupData.email}</span>
                  </p>
                </div>

                <Button
                  onClick={() => navigate('/')}
                  className="w-full bg-foreground hover:bg-foreground/90 text-background rounded-none h-12 text-sm font-medium tracking-wide uppercase"
                >
                  Back to Elyphant
                </Button>

                <p className="text-xs text-muted-foreground">
                  Redirecting in {countdown} second{countdown !== 1 ? 's' : ''}...
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-[hsl(var(--background))]">
      <div className="container max-w-md mx-auto py-10 px-4 flex-grow flex items-center justify-center">
        <Card className="w-full bg-white rounded-none border-border shadow-sm">
          <CardHeader className="space-y-1">
            <div className="flex items-center justify-center mb-4">
              <h1 className="text-2xl font-semibold tracking-tight text-foreground">Vendor Portal</h1>
            </div>
            <CardDescription className="text-muted-foreground text-center">
              Access your vendor dashboard or apply to become a vendor
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 rounded-none border-border"
            >
              <GoogleIcon className="h-5 w-5" />
              Continue with Google
            </Button>
            
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <Separator />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-muted-foreground">Or continue with</span>
              </div>
            </div>

            <Tabs defaultValue="login" className="w-full">
              <TabsList className="grid w-full grid-cols-2 rounded-none">
                <TabsTrigger value="login" className="rounded-none">Sign In</TabsTrigger>
                <TabsTrigger value="signup" className="rounded-none">Apply</TabsTrigger>
              </TabsList>
              
              <TabsContent value="login" className="space-y-4 mt-4">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Email</label>
                    <Input 
                      type="email" 
                      placeholder="Enter your email"
                      value={loginData.email}
                      onChange={(e) => setLoginData({...loginData, email: e.target.value})}
                      className="w-full border-border rounded-none"
                      disabled={isLoading}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Password</label>
                    <PasswordInput 
                      placeholder="Enter your password"
                      value={loginData.password}
                      onChange={(e) => setLoginData({...loginData, password: e.target.value})}
                      className="w-full border-border rounded-none"
                      disabled={isLoading}
                    />
                  </div>
                  <Button 
                    type="submit" 
                    disabled={isLoading}
                    className="w-full bg-foreground hover:bg-foreground/90 text-background rounded-none h-12 text-sm font-medium tracking-wide uppercase"
                  >
                    {isLoading ? "Signing in..." : "Sign In"}
                  </Button>
                  {showResendVerification && loginData.email && (
                    <Button
                      type="button"
                      variant="ghost"
                      className="w-full text-sm text-muted-foreground hover:text-foreground"
                      disabled={isLoading}
                      onClick={async () => {
                        try {
                          const { error } = await supabase.auth.resend({
                            type: 'signup',
                            email: loginData.email,
                            options: { emailRedirectTo: `${window.location.origin}/vendor-portal` }
                          });
                          if (error) throw error;
                          toast.success("Verification email sent! Check your inbox.");
                        } catch (err) {
                          toast.error("Failed to resend verification email");
                        }
                      }}
                    >
                      Resend verification email
                    </Button>
                  )}
                </form>
              </TabsContent>
              
              <TabsContent value="signup" className="space-y-4 mt-4">
                <form onSubmit={handleSignup} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">First Name</label>
                      <Input 
                        type="text" 
                        placeholder="First name"
                        value={signupData.firstName}
                        onChange={(e) => setSignupData({...signupData, firstName: e.target.value})}
                        className="w-full border-border rounded-none"
                        disabled={isLoading}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">Last Name</label>
                      <Input 
                        type="text" 
                        placeholder="Last name"
                        value={signupData.lastName}
                        onChange={(e) => setSignupData({...signupData, lastName: e.target.value})}
                        className="w-full border-border rounded-none"
                        disabled={isLoading}
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Title</label>
                    <Input 
                      type="text" 
                      placeholder="e.g. Founder, Head of Sales"
                      value={signupData.title}
                      onChange={(e) => setSignupData({...signupData, title: e.target.value})}
                      className="w-full border-border rounded-none"
                      disabled={isLoading}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Company Name</label>
                    <Input 
                      type="text" 
                      placeholder="Your company name"
                      value={signupData.companyName}
                      onChange={(e) => setSignupData({...signupData, companyName: e.target.value})}
                      className="w-full border-border rounded-none"
                      disabled={isLoading}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Email</label>
                    <Input 
                      type="email" 
                      placeholder="Enter your email"
                      value={signupData.email}
                      onChange={(e) => setSignupData({...signupData, email: e.target.value})}
                      className="w-full border-border rounded-none"
                      disabled={isLoading}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Website</label>
                    <div className="flex">
                      <span className="inline-flex items-center px-3 border border-r-0 border-border bg-muted text-muted-foreground text-sm">
                        https://
                      </span>
                      <Input 
                        type="text" 
                        placeholder="yourcompany.com"
                        value={signupData.website}
                        onChange={(e) => setSignupData({...signupData, website: e.target.value})}
                        className="rounded-none border-border"
                        disabled={isLoading}
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Phone</label>
                    <Input 
                      type="tel" 
                      placeholder="(555) 123-4567"
                      value={signupData.phone}
                      onChange={(e) => {
                        const digits = e.target.value.replace(/\D/g, '').slice(0, 10);
                        let formatted = '';
                        if (digits.length > 0) formatted = '(' + digits.slice(0, 3);
                        if (digits.length >= 3) formatted += ') ';
                        if (digits.length > 3) formatted += digits.slice(3, 6);
                        if (digits.length >= 6) formatted += '-' + digits.slice(6);
                        setSignupData({...signupData, phone: formatted});
                      }}
                      className="w-full border-border rounded-none"
                      disabled={isLoading}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Tell us about your business</label>
                    <textarea 
                      placeholder="What products do you sell? Why are you a good fit for Elyphant?"
                      value={signupData.description}
                      onChange={(e) => setSignupData({...signupData, description: e.target.value})}
                      className="flex min-h-[80px] w-full rounded-none border border-border bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      disabled={isLoading}
                      rows={3}
                      required
                    />
                  </div>

                  <div className="pt-2">
                    <p className="text-xs text-muted-foreground mb-3">Create your account credentials — you'll use these to access the portal once approved.</p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Password</label>
                    <PasswordInput 
                      placeholder="Create a password"
                      value={signupData.password}
                      onChange={(e) => setSignupData({...signupData, password: e.target.value})}
                      className="w-full border-border rounded-none"
                      disabled={isLoading}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Confirm Password</label>
                    <PasswordInput 
                      placeholder="Confirm your password"
                      value={signupData.confirmPassword}
                      onChange={(e) => setSignupData({...signupData, confirmPassword: e.target.value})}
                      className="w-full border-border rounded-none"
                      disabled={isLoading}
                    />
                  </div>
                  <Button 
                    type="submit" 
                    disabled={isLoading}
                    className="w-full bg-destructive hover:bg-destructive/90 text-destructive-foreground rounded-none h-12 text-sm font-medium tracking-wide uppercase"
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
              className="text-sm text-foreground underline underline-offset-4 hover:text-foreground/80"
            >
              Forgot password?
            </Link>
          </CardFooter>
        </Card>
      </div>
      <div className="text-center py-4">
        <Link 
          to="/" 
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Back to Elyphant
        </Link>
      </div>
    </div>
  );
};

export default VendorPortalAuth;
