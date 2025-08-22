import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/auth';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle, ExternalLink } from 'lucide-react';

interface TrunklineGuardProps {
  children: React.ReactNode;
}

export const TrunklineGuard: React.FC<TrunklineGuardProps> = ({ children }) => {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  const [accessStatus, setAccessStatus] = useState<'checking' | 'allowed' | 'denied' | 'invalid-domain'>('checking');

  useEffect(() => {
    const checkTrunklineAccess = async () => {
      console.log('🔒 TrunklineGuard: Checking access...', { user: user?.email, isLoading });
      
      if (isLoading) return;
      
      if (!user) {
        console.log('🔒 TrunklineGuard: No user, redirecting to login');
        navigate('/trunkline-login');
        return;
      }

      try {
        console.log('🔒 TrunklineGuard: User email:', user.email);
        
        // Check if user has @elyphant.com domain
        if (!user.email?.endsWith('@elyphant.com')) {
          console.log('🔒 TrunklineGuard: Invalid domain, should show redirect screen');
          setAccessStatus('invalid-domain');
          return;
        }

        // Check if user can access Trunkline via database function
        console.log('🔒 TrunklineGuard: Checking database access for user:', user.id);
        const { data, error } = await supabase.rpc('can_access_trunkline', {
          user_uuid: user.id
        });

        if (error) {
          console.error('🔒 TrunklineGuard: Error checking Trunkline access:', error);
          setAccessStatus('denied');
          return;
        }

        console.log('🔒 TrunklineGuard: Database access result:', data);
        if (data) {
          console.log('🔒 TrunklineGuard: Access granted');
          setAccessStatus('allowed');
        } else {
          console.log('🔒 TrunklineGuard: Access denied by database');
          setAccessStatus('denied');
        }
      } catch (error) {
        console.error('🔒 TrunklineGuard: Error in access check:', error);
        setAccessStatus('denied');
      }
    };

    checkTrunklineAccess();
  }, [user, isLoading, navigate]);

  // Show loading while checking access
  if (isLoading || accessStatus === 'checking') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Verifying access...</p>
        </div>
      </div>
    );
  }

  // Show error for non-elyphant.com domains
  if (accessStatus === 'invalid-domain') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <Card className="w-full max-w-md mx-4">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mb-4">
              <ExternalLink className="w-6 h-6 text-orange-600" />
            </div>
            <CardTitle className="text-xl text-slate-800">Looking for Elyphant?</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-slate-600">
              Trunkline is for Elyphant employees only. If you're looking to shop on Elyphant, 
              you're in the wrong place!
            </p>
            <Button 
              onClick={() => window.location.href = 'https://elyphant.com'}
              className="w-full"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Go to Elyphant.com
            </Button>
            <p className="text-xs text-slate-500 mt-4">
              Elyphant employees should use their @elyphant.com email to access Trunkline.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show error for denied access
  if (accessStatus === 'denied') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <Card className="w-full max-w-md mx-4">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            <CardTitle className="text-xl text-slate-800">Access Denied</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-slate-600">
              You don't have permission to access Trunkline. Please contact your administrator 
              if you believe this is an error.
            </p>
            <div className="space-y-2">
              <Button 
                variant="outline"
                onClick={() => navigate('/trunkline-login')}
                className="w-full"
              >
                Back to Login
              </Button>
              <Button 
                variant="ghost"
                onClick={() => window.location.href = 'https://elyphant.com'}
                className="w-full"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Go to Elyphant.com
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // User has access, render children
  return <>{children}</>;
};