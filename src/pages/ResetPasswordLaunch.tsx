import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { unifiedAuthService } from '@/services/auth/UnifiedAuthService';

const ResetPasswordLaunch: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);
  const [isAutoProcessing, setIsAutoProcessing] = useState(false);
  const attemptedRef = useRef(false); // prevent repeated auto attempts

  const resetToken = searchParams.get('token');

  // Idempotency lock to prevent duplicate processing (handles Strict Mode double mount and scanners)
  const tokenLockKey = resetToken ? `reset_processing_${resetToken}` : null;

  const lastResetEmail = typeof window !== 'undefined' ? localStorage.getItem('lastResetEmail') : null;

  // Auto-continue when token is present - only when page is visible and focused (avoid email/link preview scanners)
  useEffect(() => {
    const shouldAutoProceed = () =>
      !!resetToken && !isProcessing && !isAutoProcessing &&
      typeof document !== 'undefined' &&
      document.visibilityState === 'visible' &&
      typeof document.hasFocus === 'function' && document.hasFocus() &&
      !/bot|crawler|spider|facebookexternalhit|twitterbot|linkedinbot|slackbot|discordbot/i.test(navigator.userAgent);

    const tryProceed = () => {
      if (!shouldAutoProceed() || attemptedRef.current) return;
      attemptedRef.current = true;
      
      setIsAutoProcessing(true);
      handleContinue();
    };

    // Try immediately, otherwise wait for visibility/focus
    tryProceed();
    const onVisible = () => tryProceed();
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('focus', onVisible);
    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('focus', onVisible);
    };
  }, [resetToken, isProcessing, isAutoProcessing]);

  const handleContinue = async () => {
    if (!resetToken) {
      toast.error('Missing or invalid reset token.');
      return;
    }

    // Idempotency guard - avoid duplicate invocations
    if (tokenLockKey) {
      const locked = sessionStorage.getItem(tokenLockKey);
      if (locked) {
        
        const tokensJson = sessionStorage.getItem('password_reset_tokens');
        if (tokensJson) {
          // If tokens already exist, proceed to the reset form
          navigate('/reset-password');
          return;
        }
        // No tokens yet — clear stale lock and continue
        try { sessionStorage.removeItem(tokenLockKey); } catch {}
      }
      try { sessionStorage.setItem(tokenLockKey, '1'); } catch {}
    }

    setIsProcessing(true);
    try {
      // Use UnifiedAuthService for enhanced token validation with caching
      const tokenValidation = await unifiedAuthService.validateResetToken(resetToken);
      
      if (!tokenValidation.isValid) {
        toast.error(tokenValidation.error || 'Invalid or expired reset token.');
        if (tokenLockKey) { try { sessionStorage.removeItem(tokenLockKey); } catch {} }
        navigate('/forgot-password');
        setIsProcessing(false);
        setIsAutoProcessing(false);
        return;
      }

      // Fallback to direct edge function call for token processing
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

        // Try to extract HTTP status and body message from the error context
        let status: number | undefined = undefined;
        let bodyMsg = '' as string;
        try {
          const res = (error as any)?.context?.response as Response | undefined;
          status = res?.status;
          if (res) {
            const text = await res.text();
            try {
              const parsed = JSON.parse(text);
              bodyMsg = parsed?.error || parsed?.message || text;
            } catch {
              bodyMsg = text;
            }
          }
        } catch (parseErr) {
          console.warn('Could not parse error response body', parseErr);
        }

        const serverMsg = (error as any)?.context?.error || (error as any)?.message;
        const combinedMsg = bodyMsg || serverMsg || '';
        const isUsedOrExpired = status === 401 || /(expired|already been used)/i.test(combinedMsg);

        // Handle common token issues gracefully (401 or recognizable message)
        if (isUsedOrExpired) {
          toast.error(combinedMsg || 'This reset link is invalid or has expired.');
          if (tokenLockKey) { try { sessionStorage.removeItem(tokenLockKey); } catch {} }
          navigate('/forgot-password');
          setIsProcessing(false);
          setIsAutoProcessing(false);
          return;
        }

        // Log detailed error for debugging but show user-friendly message
        console.error('Password reset authentication failed:', {
          status,
          serverMsg,
          bodyMsg,
          combinedMsg,
          originalError: error
        });
        
        const details = combinedMsg || (error as any)?.context?.response?.statusText || (error as any)?.message;
        toast.error(`Reset service error${details ? `: ${details}` : ''}`);
        if (isUsedOrExpired) {
          if (tokenLockKey) { try { sessionStorage.removeItem(tokenLockKey); } catch {} }
          navigate('/forgot-password');
        }
        setIsProcessing(false);
        setIsAutoProcessing(false);
        return;
      }

      if (!data) {
        console.error('No response from reset service');
        toast.error('Failed to connect to reset service.');
        if (tokenLockKey) { try { sessionStorage.removeItem(tokenLockKey); } catch {} }
        setIsProcessing(false);
        setIsAutoProcessing(false);
        return;
      }


      // Enhanced response parsing - check for success flag or presence of tokens or action link
      const isSuccessResponse = data.success === true || !!data.action_link || (data.access_token && data.refresh_token);
      // If backend returns an action_link, follow it to complete Supabase recovery and get tokens via redirect
      if (data.action_link) {
        if (tokenLockKey) { try { sessionStorage.removeItem(tokenLockKey); } catch {} }
        window.location.replace(data.action_link as string);
        return;
      }

      if (!isSuccessResponse) {
        console.error('Reset service returned error:', data);
        const msg = (data && (data.error || data.message)) || '';
        toast.error(msg || 'Invalid or expired reset link.');
        if (/expired|already been used|invalid/i.test(msg)) {
          if (tokenLockKey) { try { sessionStorage.removeItem(tokenLockKey); } catch {} }
          navigate('/forgot-password');
        }
        setIsProcessing(false);
        setIsAutoProcessing(false);
        return;
      }

      const access_token = data.access_token ?? data?.tokens?.access_token;
      const refresh_token = data.refresh_token ?? data?.tokens?.refresh_token;

      if (!access_token || !refresh_token) {
        console.error('Missing tokens in response:', data);
        toast.error('Authentication tokens not received.');
        if (tokenLockKey) { try { sessionStorage.removeItem(tokenLockKey); } catch {} }
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
      
      
      
      // Clear lock and navigate without tokens in URL
      if (tokenLockKey) { try { sessionStorage.removeItem(tokenLockKey); } catch {} }
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
      // Use UnifiedAuthService for consistent error handling and security
      const result = await unifiedAuthService.initiatePasswordReset(lastResetEmail);
      if (result.success) {
        toast.success(result.message || 'New secure reset link sent. Check your inbox.');
      } else {
        toast.error(result.error || 'Failed to send new link.');
      }
    } catch (e) {
      toast.error('Unable to send a new link.');
    } finally {
      setIsProcessing(false);
    }
  };

  const canonical = `${window.location.origin}/reset-password/launch`;

  // If we have a token and auto-processing is active, show minimal loading
  if (resetToken && isAutoProcessing) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Helmet>
          <title>Verifying Reset Link | Elyphant</title>
          <meta name="description" content="Verifying your password reset link securely." />
          <link rel="canonical" href={canonical} />
        </Helmet>
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Verifying reset link...</p>
              <p className="text-xs text-muted-foreground mt-2">You'll be redirected automatically</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

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
              <Button className="w-full" onClick={handleContinue} disabled={isProcessing}>
                Continue to Secure Reset
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
