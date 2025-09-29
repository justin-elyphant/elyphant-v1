import React, { useMemo, useState } from 'react';
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

  const decodedLink = useMemo(() => {
    try {
      const linkParam = searchParams.get('link');
      if (!linkParam) return null;
      const decoded = atob(decodeURIComponent(linkParam));
      return decoded;
    } catch (_) {
      return null;
    }
  }, [searchParams]);

  const lastResetEmail = typeof window !== 'undefined' ? localStorage.getItem('lastResetEmail') : null;

  const handleContinue = () => {
    if (!decodedLink) {
      toast.error('Missing or invalid reset link.');
      return;
    }
    // Navigate to Supabase verification URL (consumes the OTP token)
    window.location.href = decodedLink;
  };

  const handleResend = async () => {
    if (!lastResetEmail) {
      navigate('/forgot-password');
      return;
    }
    setIsProcessing(true);
    try {
      const resetLink = `${window.location.origin}/reset-password?email=${encodeURIComponent(lastResetEmail)}&type=recovery`;
      const { error } = await supabase.functions.invoke('send-password-reset-email', {
        body: { email: lastResetEmail, resetLink }
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
          {decodedLink ? (
            <>
              <Button className="w-full" onClick={handleContinue} disabled={isProcessing}>
                Continue to Secure Reset
              </Button>
              <p className="text-xs text-muted-foreground mt-3 text-center">
                For your security, this link can only be used once and may expire soon.
              </p>
            </>
          ) : (
            <div className="text-center">
              <div className="mx-auto mb-4 text-destructive">
                <AlertCircle size={40} />
              </div>
              <p className="text-sm mb-4">This launch link is invalid or missing.</p>
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
