import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/auth";
import { useProfile } from "@/contexts/profile/ProfileContext";
import MainLayout from "@/components/layout/MainLayout";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
// We'll navigate to the profile-setup page instead of using a modal

const StreamlinedSignUp = () => {
  const navigate = useNavigate();
  const { user, isLoading } = useAuth();
  const { refetchProfile } = useProfile();
  
  const [isSigningUp, setIsSigningUp] = useState(false);
  const [showProfileSetup, setShowProfileSetup] = useState(false);
  const [signupData, setSignupData] = useState({
    email: "",
    password: "",
    name: ""
  });

  // Redirect authenticated users to homepage (but not if they just signed up)
  useEffect(() => {
    if (user && !isLoading && !isSigningUp) {
      console.log("🏠 User already authenticated, redirecting to homepage");
      navigate("/", { replace: true });
    }
  }, [user, isLoading, navigate, isSigningUp]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setSignupData(prev => ({ ...prev, [name]: value }));
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!signupData.email || !signupData.password || !signupData.name) {
      toast.error("Please fill in all fields");
      return;
    }

    setIsSigningUp(true);
    
    try {
      console.log("🚀 Starting signup process");
      
      const redirectUrl = `${window.location.origin}/`;
      
      const { data, error } = await supabase.auth.signUp({
        email: signupData.email,
        password: signupData.password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            name: signupData.name
          }
        }
      });

      if (error) {
        console.error("❌ Signup error:", error);
        toast.error(error.message);
        return;
      }

      if (data.user) {
        console.log("✅ Signup successful, redirecting to profile setup");
        toast.success("Account created! Please complete your profile.");
        handleProfileSetupRedirect();
      }
      
    } catch (error) {
      console.error("❌ Signup exception:", error);
      toast.error("An unexpected error occurred. Please try again.");
    } finally {
      setIsSigningUp(false);
    }
  };

  const handleProfileSetupRedirect = () => {
    console.log("✅ Signup successful, redirecting to profile setup");
    refetchProfile();
    navigate("/profile-setup", { replace: true });
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="container max-w-md mx-auto py-10 px-4 flex-grow flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p>Loading...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container max-w-md mx-auto py-10 px-4 flex-grow flex items-center justify-center">
        <Card className="w-full">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Get Started with Elyphant
            </CardTitle>
            <CardDescription>
              Create your account to start your personalized gifting journey
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSignUp} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  name="name"
                  type="text"
                  placeholder="Your full name"
                  value={signupData.name}
                  onChange={handleInputChange}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="your.email@example.com"
                  value={signupData.email}
                  onChange={handleInputChange}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="Choose a secure password"
                  value={signupData.password}
                  onChange={handleInputChange}
                  required
                />
              </div>
              
              <Button 
                type="submit" 
                className="w-full"
                disabled={isSigningUp}
              >
                {isSigningUp ? "Creating Account..." : "Create Account"}
              </Button>
            </form>
          </CardContent>
          
          <CardFooter className="text-center">
            <p className="text-sm text-muted-foreground">
              Already have an account?{" "}
              <Button variant="link" onClick={() => navigate("/auth")} className="p-0 h-auto">
                Sign in
              </Button>
            </p>
          </CardFooter>
        </Card>

        {/* Profile setup will be handled on a separate page */}
      </div>
    </MainLayout>
  );
};

export default StreamlinedSignUp;