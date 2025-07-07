import React from "react";
import ErrorBoundary from "@/components/common/ErrorBoundary";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";

interface ProfileErrorFallbackProps {
  error: Error;
  resetError: () => void;
}

const ProfileErrorFallback: React.FC<ProfileErrorFallbackProps> = ({ error, resetError }) => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <AlertTriangle className="w-6 h-6 text-red-600" />
          </div>
          <CardTitle className="text-red-900">Profile Loading Error</CardTitle>
          <CardDescription>
            We encountered an issue loading this profile. This might be a temporary problem.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button 
              onClick={resetError}
              variant="outline"
              className="flex-1"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
            <Button 
              onClick={() => navigate('/dashboard')}
              className="flex-1"
            >
              <Home className="w-4 h-4 mr-2" />
              Go Home
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

interface ProfileErrorBoundaryProps {
  children: React.ReactNode;
}

const ProfileErrorBoundary: React.FC<ProfileErrorBoundaryProps> = ({ children }) => {
  return (
    <ErrorBoundary
      fallback={<ProfileErrorFallback error={new Error("Profile error")} resetError={() => window.location.reload()} />}
      onError={(error, errorInfo) => {
        console.error('Profile Error Boundary caught an error:', error, errorInfo);
      }}
    >
      {children}
    </ErrorBoundary>
  );
};

export default ProfileErrorBoundary;