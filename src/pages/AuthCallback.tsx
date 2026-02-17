import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import MainLayout from '@/components/layout/MainLayout';

type VerificationStatus = 'loading' | 'success' | 'error' | 'expired';

const AuthCallback = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<VerificationStatus>('loading');
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    const handleEmailConfirmation = async () => {
      try {
        const token_hash = searchParams.get('token_hash');
        const type = searchParams.get('type');

        if (!token_hash || type !== 'email') {
          setStatus('error');
          setErrorMessage('Invalid confirmation link');
          return;
        }

        // Verify the email confirmation token
        const { data, error } = await supabase.auth.verifyOtp({
          token_hash,
          type: 'email'
        });

        if (error) {
          console.error('Email confirmation error:', error);
          setStatus('error');
          
          if (error.message.includes('expired')) {
            setErrorMessage('This confirmation link has expired. Please request a new one.');
          } else if (error.message.includes('invalid')) {
            setErrorMessage('This confirmation link is invalid or has already been used.');
          } else {
            setErrorMessage(error.message || 'Failed to verify email');
          }
        } else if (data.user) {
          console.log('Email confirmed successfully:', data.user);
          setStatus('success');
          toast.success('Email verified successfully!');
          
          // Process any stored invitation token
          const storedToken = sessionStorage.getItem('elyphant_invitation_token');
          if (storedToken) {
            console.log('[AuthCallback] Processing stored invitation token');
            try {
              const { data: rpcResult } = await supabase.rpc(
                'accept_invitation_by_token' as any,
                { p_token: storedToken, p_user_id: data.user.id }
              );
              if (rpcResult?.linked) {
                toast.success("Connection linked!", {
                  description: "You're now connected with your friend!"
                });
              }
            } catch (error) {
              console.error('[AuthCallback] Error linking invitation:', error);
            } finally {
              sessionStorage.removeItem('elyphant_invitation_token');
            }
          }
          
          // Claim any guest orders for this user (belt-and-suspenders)
          try {
            const { data: claimData, error: claimError } = await supabase.functions.invoke('claim-guest-orders');
            if (claimError) {
              console.warn('[AuthCallback] Order claim error:', claimError);
            } else if (claimData?.claimed > 0) {
              console.log(`[AuthCallback] Claimed ${claimData.claimed} guest order(s)`);
              toast.success(`${claimData.claimed} order(s) linked to your account!`);
            }
          } catch (claimErr) {
            console.warn('[AuthCallback] Order claim failed:', claimErr);
          }

          // Store completion state for streamlined profile setup
          localStorage.setItem('profileCompletionState', JSON.stringify({
            step: 'profile',
            source: 'email_verification'
          }));
          
          // After email verification, redirect to profile setup for new users
          setTimeout(() => {
            navigate('/profile-setup', { replace: true });
          }, 2000);
        } else {
          setStatus('error');
          setErrorMessage('Verification failed - no user data received');
        }
      } catch (err) {
        console.error('Unexpected error during email confirmation:', err);
        setStatus('error');
        setErrorMessage('An unexpected error occurred during verification');
      }
    };

    handleEmailConfirmation();
  }, [searchParams, navigate]);

  const handleResendVerification = async () => {
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: '', // User needs to re-enter email if resending
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      });

      if (error) {
        toast.error('Failed to resend verification email');
      } else {
        toast.success('Verification email sent! Please check your inbox.');
      }
    } catch (err) {
      toast.error('Failed to resend verification email');
    }
  };

  const renderContent = () => {
    switch (status) {
      case 'loading':
        return (
          <div className="text-center space-y-4">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
              <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
            </div>
            <CardTitle className="text-xl">Verifying your email...</CardTitle>
            <p className="text-muted-foreground">
              Please wait while we confirm your email address.
            </p>
          </div>
        );

      case 'success':
        return (
          <div className="text-center space-y-4">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <CardTitle className="text-xl text-green-700">Email Verified!</CardTitle>
            <p className="text-muted-foreground">
              Your email has been successfully verified. You'll be redirected to complete your profile setup shortly.
            </p>
          </div>
        );

      case 'error':
      case 'expired':
        return (
          <div className="text-center space-y-4">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
              <AlertCircle className="h-8 w-8 text-red-600" />
            </div>
            <CardTitle className="text-xl text-red-700">Verification Failed</CardTitle>
            <p className="text-muted-foreground mb-4">
              {errorMessage}
            </p>
            <div className="flex flex-col gap-2">
              <Button onClick={() => navigate('/sign-up')} className="w-full">
                Sign Up Again
              </Button>
              <Button onClick={() => navigate('/sign-in')} variant="outline" className="w-full">
                Back to Sign In
              </Button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <MainLayout>
      <div className="container max-w-md mx-auto py-10 px-4 flex-grow flex items-center justify-center">
        <Card className="w-full">
          <CardHeader className="text-center">
            {renderContent()}
          </CardHeader>
        </Card>
      </div>
    </MainLayout>
  );
};

export default AuthCallback;