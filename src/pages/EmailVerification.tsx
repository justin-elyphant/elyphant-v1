
import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/auth";
import MainLayout from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mail, CheckCircle } from "lucide-react";

const EmailVerification = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  React.useEffect(() => {
    if (user) {
      navigate("/dashboard", { replace: true });
    }
  }, [user, navigate]);

  return (
    <MainLayout>
      <div className="container max-w-md mx-auto py-10 px-4 flex-grow flex items-center justify-center">
        <Card className="w-full">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
              <Mail className="h-8 w-8 text-blue-600" />
            </div>
            <CardTitle className="text-2xl font-bold">Check your email</CardTitle>
            <p className="text-muted-foreground">
              We've sent a verification link to your email address.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CheckCircle className="h-4 w-4" />
              <span>Click the link in your email to verify your account</span>
            </div>
            <Button
              onClick={() => navigate("/sign-in")}
              variant="outline"
              className="w-full"
            >
              Back to Sign In
            </Button>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
};

export default EmailVerification;
