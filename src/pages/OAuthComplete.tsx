import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/auth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, Loader2 } from 'lucide-react';
import MainLayout from '@/components/layout/MainLayout';

const OAuthComplete = () => {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');

  useEffect(() => {
    if (isLoading) return;

    if (user) {
      
      setStatus('success');
      
      // Redirect to home after successful OAuth sign-in
      setTimeout(() => {
        navigate('/home', { replace: true });
      }, 2000);
    } else {
      console.error('OAuth authentication failed - no user found');
      setStatus('error');
      
      // Redirect to auth page after delay
      setTimeout(() => {
        navigate('/auth', { replace: true });
      }, 3000);
    }
  }, [user, isLoading, navigate]);

  const renderContent = () => {
    switch (status) {
      case 'processing':
        return (
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
            <h2 className="text-xl font-semibold mb-2">Completing Sign In</h2>
            <p className="text-muted-foreground">
              Please wait while we finish setting up your account...
            </p>
          </div>
        );
        
      case 'success':
        return (
          <div className="text-center">
            <CheckCircle className="h-8 w-8 mx-auto mb-4 text-green-500" />
            <h2 className="text-xl font-semibold mb-2">Sign In Successful!</h2>
            <p className="text-muted-foreground">
              Redirecting you to your home page...
            </p>
          </div>
        );
        
      case 'error':
        return (
          <div className="text-center">
            <div className="h-8 w-8 mx-auto mb-4 rounded-full bg-destructive/10 flex items-center justify-center">
              <span className="text-destructive font-bold">!</span>
            </div>
            <h2 className="text-xl font-semibold mb-2">Sign In Failed</h2>
            <p className="text-muted-foreground">
              There was an issue completing your sign in. Redirecting you to try again...
            </p>
          </div>
        );
    }
  };

  return (
    <MainLayout>
      <div className="container max-w-md mx-auto py-20 px-4 flex-grow flex items-center justify-center">
        <Card className="w-full">
          <CardHeader>
            <CardTitle className="text-center">OAuth Authentication</CardTitle>
          </CardHeader>
          <CardContent>
            {renderContent()}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
};

export default OAuthComplete;