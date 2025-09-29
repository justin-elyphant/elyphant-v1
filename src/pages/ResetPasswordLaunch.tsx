import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';

const ResetPasswordLaunch: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);
  const [isAutoProcessing, setIsAutoProcessing] = useState(false);

  const resetToken = searchParams.get('token');

  const lastResetEmail = typeof window !== 'undefined' ? localStorage.getItem('lastResetEmail') : null;

  // Auto-continue when token is present
  useEffect(() => {
    if (resetToken && !isProcessing && !isAutoProcessing) {
      console.log('Auto-processing reset token:', resetToken.substring(0, 8) + '...');
      setIsAutoProcessing(true);
      handleContinue();
    }
  }, [resetToken]);

  const handleContinue = async () => {
    if (!resetToken) {
      toast.error('Missing or invalid reset token.');
      return;
    }

    setIsProcessing(true);
    try {
      // Invoke edge function to authenticate the reset token
      const invokeResult = await supabase.functions.invoke('authenticate-reset-token', {
        body: { token: resetToken }
      });

      let { data, error } = invokeResult as any;

      // In some environments the body may arrive as a string; try to parse
      if (typeof data === 'string') {
        try {
          data = JSON.parse(data);
        } catch (e) {
          console.warn('Could not parse function response as JSON:', data);
        }
      }

      if (error) {
        console.error('Supabase function invoke error:', error, 'raw data:', data);
        const status = (error as any)?.context?.response?.status;
        const serverMsg = (error as any)?.context?.error || (error as any)?.message;

        // Try to extract a useful message from the response body
        let bodyMsg = '' as string;
        try {
          if (typeof data === 'string') {
            const parsed = JSON.parse(data);
            bodyMsg = parsed?.error || parsed?.message || '';
          } else if (data && typeof data === 'object') {
            bodyMsg = (data as any)?.error || (data as any)?.message || '';
          }
        } catch {}

        const combinedMsg = bodyMsg || serverMsg || '';
        const isUsedOrExpired = /(expired|already been used)/i.test(combinedMsg);

        // Handle common token issues gracefully (401 or recognizable message)
        if (status === 401 || isUsedOrExpired) {
          toast.error(combinedMsg || 'This reset link is invalid or has expired.');
          // If we know the email used to request reset, proactively send a new link
          if (lastResetEmail) {
            try {
              const { error: resendError } = await supabase.functions.invoke('send-password-reset-email', {
                body: { email: lastResetEmail }
              });
              if (resendError) {
                toast.error(`Couldn't send a new link: ${resendError.message}`);
              } else {
                toast.success('A new secure reset link was sent to your email.');
              }
            } catch (e) {
              console.warn('Auto-resend failed:', e);
            }
          } else {
            // No email in storage, redirect to request a new one
            navigate('/forgot-password');
          }
          setIsProcessing(false);
          setIsAutoProcessing(false);
          return;
        }

        const details = combinedMsg || (error as any)?.context?.response?.statusText || (error as any)?.message;
        toast.error(`Reset service error${details ? `: ${details}` : ''}`);
        setIsProcessing(false);
        setIsAutoProcessing(false);
        return;
      }

      if (!data) {
        console.error('No response from reset service');
        toast.error('Failed to connect to reset service.');
        setIsProcessing(false);
        setIsAutoProcessing(false);
        return;
      }

      console.log('authenticate-reset-token response:', data);

      if (!data.success) {
        console.error('Reset service returned error:', data);
        toast.error(data.error || 'Invalid or expired reset link.');
        setIsProcessing(false);
        setIsAutoProcessing(false);
        return;
      }

      const access_token = data.access_token ?? data?.tokens?.access_token;
      const refresh_token = data.refresh_token ?? data?.tokens?.refresh_token;

      if (!access_token || !refresh_token) {
        console.error('Missing tokens in response:', data);
        toast.error('Authentication tokens not received.');
        setIsProcessing(false);
        setIsAutoProcessing(false);
        return;
      }

      // SECURITY FIX: Use session storage instead of URL hash to prevent token leakage
      const resetTokenData = {
        access_token,
        refresh_token,
        timestamp: Date.now(),
        expires: Date.now() + (5 * 60 * 1000) // 5 minute expiry
      };
      
      sessionStorage.setItem('password_reset_tokens', JSON.stringify(resetTokenData));
      
      console.log('Password reset tokens stored securely in session storage');
      
      // Navigate without tokens in URL
      navigate('/reset-password');
    } catch (error) {
      console.error('Error authenticating token:', error);
      toast.error('Failed to verify reset link.');
      setIsProcessing(false);
      setIsAutoProcessing(false);
    }
  };

  const handleResend = async () => {
    if (!lastResetEmail) {
      navigate('/forgot-password');
      return;
    }
    setIsProcessing(true);
    try {
      const { error } = await supabase.functions.invoke('send-password-reset-email', {
        body: { email: lastResetEmail }
      });
      if (error) {
        toast.error(`Failed to send new link: ${error.message}`);
      } else {
        toast.success('New secure reset link sent. Check your inbox.');
      }
    } catch (e) {
      toast.error('Unable to send a new link.');
    } finally {
      setIsProcessing(false);
    }
  };

  const canonical = `${window.location.origin}/reset-password/launch`;

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Helmet>
        <title>Secure Password Reset | Elyphant</title>
        <meta name="description" content="Launch a secure password reset for your Elyphant account." />
        <link rel="canonical" href={canonical} />
      </Helmet>
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 text-primary">
            <ShieldCheck size={48} />
          </div>
          <CardTitle>Secure Password Reset</CardTitle>
          <CardDescription>
            Click the button below to securely continue your password reset.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {resetToken ? (
            <>
              <Button className="w-full" onClick={handleContinue} disabled={isProcessing || isAutoProcessing}>
                {isAutoProcessing ? 'Verifying...' : 'Continue to Secure Reset'}
              </Button>
              <p className="text-xs text-muted-foreground mt-3 text-center">
                For your security, this link can only be used once and expires in 1 hour.
              </p>
            </>
          ) : (
            <div className="text-center">
              <div className="mx-auto mb-4 text-destructive">
                <AlertCircle size={40} />
              </div>
              <p className="text-sm mb-4">No reset token found.</p>
              <Button className="w-full" variant="default" onClick={handleResend} disabled={isProcessing}>
                {lastResetEmail ? 'Send Me a New Secure Link' : 'Request New Reset Link'}
              </Button>
            </div>
          )}
          <Button className="w-full mt-3" variant="outline" onClick={() => navigate('/auth')}>
            Back to Sign In
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default ResetPasswordLaunch;
