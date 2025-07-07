
import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, Info } from "lucide-react";
import MainLayout from "@/components/layout/MainLayout";

const ProfileSetup = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // If user is not authenticated, redirect to streamlined signup
    if (!user) {
      navigate("/signup", { replace: true });
      return;
    }

    // Auto-redirect after 3 seconds to streamlined flow
    const timer = setTimeout(() => {
      navigate("/signup?intent=complete-profile", { replace: true });
    }, 3000);

    return () => clearTimeout(timer);
  }, [user, navigate]);

  const handleContinue = () => {
    navigate("/signup?intent=complete-profile", { replace: true });
  };

  const handleBackToDashboard = () => {
    navigate("/dashboard", { replace: true });
  };

  return (
    <MainLayout>
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
              <Info className="h-6 w-6 text-blue-600" />
            </div>
            <CardTitle>Profile Setup Moved</CardTitle>
            <CardDescription>
              We've streamlined the profile setup process. You'll be redirected to our new and improved flow.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm text-muted-foreground">
              <p>Our new setup process includes:</p>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Faster profile creation</li>
                <li>Better intent discovery</li>
                <li>Seamless onboarding</li>
              </ul>
            </div>
            <div className="space-y-2">
              <Button onClick={handleContinue} className="w-full">
                Continue Setup <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button variant="outline" onClick={handleBackToDashboard} className="w-full">
                Back to Dashboard
              </Button>
            </div>
            <p className="text-xs text-muted-foreground text-center">
              You'll be redirected automatically in a few seconds...
            </p>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
};

export default ProfileSetup;
