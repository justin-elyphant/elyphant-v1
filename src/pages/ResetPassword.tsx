import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Eye, EyeOff, CheckCircle, AlertCircle } from 'lucide-react';
import { z } from 'zod';
import { unifiedAuthService } from '@/services/auth/UnifiedAuthService';

const passwordSchema = z.object({
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type PasswordForm = z.infer<typeof passwordSchema>;

const ResetPassword = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState<PasswordForm>({
    password: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState<Partial<PasswordForm>>({});
  const [isValidToken, setIsValidToken] = useState<boolean | null>(null);

  // SECURITY FIX: Get tokens from secure session storage instead of URL
  const lastResetEmail = typeof window !== 'undefined' ? localStorage.getItem('lastResetEmail') : null;

  useEffect(() => {
    const verifyTokenOrSession = async () => {
      // 1) Try to process URL tokens using UnifiedAuthService
      const urlResult = await unifiedAuthService.processUrlTokens();
      if (urlResult.isValid) {
        toast.success('Reset link verified successfully!');
        setIsValidToken(true);
        return;
      }

      // 2) Try to process stored tokens using UnifiedAuthService
      const storedResult = await unifiedAuthService.processStoredTokens();
      if (storedResult.isValid) {
        toast.success('Reset link verified successfully!');
        setIsValidToken(true);
        return;
      }

      // 3) Fallback: Check if there's already an active session
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        console.log('Using existing session for password reset');
        setIsValidToken(true);
      } else {
        console.warn('No valid tokens or session found for password reset');
        toast.error('Invalid or missing reset tokens');
        setIsValidToken(false);
      }
    };

    verifyTokenOrSession();
  }, []);

  const validateForm = () => {
    try {
      passwordSchema.parse(formData);
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Partial<PasswordForm> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            fieldErrors[err.path[0] as keyof PasswordForm] = err.message;
          }
        });
        setErrors(fieldErrors);
      }
      return false;
    }
  };

  const handleInputChange = (field: keyof PasswordForm, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear specific field error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Please fix the errors below');
      return;
    }

    if (!isValidToken) {
      toast.error('Invalid reset session. Please request a new password reset.');
      return;
    }

    setLoading(true);

    try {
      // Use UnifiedAuthService for enhanced password reset with security features
      const result = await unifiedAuthService.completePasswordReset(formData.password, {
        validateToken: true,
        sendNotification: true,
        invalidateOtherSessions: true
      });

      if (result.success) {
        toast.success(result.message || 'Password reset successfully! For security, all other sessions have been signed out.');
        
        // Navigate directly to main app after successful password reset
        navigate('/dashboard?tab=auto-gifts', { replace: true });
      } else {
        toast.error(result.error || 'Failed to reset password. Please try again.');
      }
    } catch (error: any) {
      toast.error('An unexpected error occurred. Please try again.');
      console.error('Password reset error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPasswordStrength = (password: string) => {
    let strength = 0;
    const checks = [
      password.length >= 8,
      /[a-z]/.test(password),
      /[A-Z]/.test(password),
      /\d/.test(password),
      /[!@#$%^&*(),.?":{}|<>]/.test(password)
    ];
    
    strength = checks.filter(Boolean).length;
    
    if (strength < 3) return { label: 'Weak', color: 'text-red-500' };
    if (strength < 4) return { label: 'Fair', color: 'text-yellow-500' };
    if (strength < 5) return { label: 'Good', color: 'text-blue-500' };
    return { label: 'Strong', color: 'text-green-500' };
  };

  // Show loading state while verifying token
  if (isValidToken === null) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Helmet>
          <title>Verifying Reset | Elyphant</title>
          <meta name="description" content="Verifying your password reset link." />
          <link rel="canonical" href={`${window.location.origin}/reset-password`} />
        </Helmet>
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Verifying reset link...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show error state for invalid token
  if (isValidToken === false) {
    const handleResend = async () => {
      if (!lastResetEmail) {
        navigate('/forgot-password');
        return;
      }
      setLoading(true);
      try {
        // Use UnifiedAuthService for consistent error handling
        const result = await unifiedAuthService.initiatePasswordReset(lastResetEmail);
        if (result.success) {
          toast.success(result.message || 'New secure reset link sent. Check your email.');
        } else {
          toast.error(result.error || 'Failed to send new link.');
        }
      } catch (e) {
        toast.error('Unable to send a new link.');
      } finally {
        setLoading(false);
      }
    };

    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Helmet>
          <title>Invalid Reset Link | Elyphant</title>
          <meta name="description" content="Your password reset link is invalid or expired. Request a new secure link." />
          <link rel="canonical" href={`${window.location.origin}/reset-password`} />
        </Helmet>
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 text-red-500">
              <AlertCircle size={48} />
            </div>
            <CardTitle>Invalid Reset Link</CardTitle>
            <CardDescription>
              This password reset link is invalid or has expired. Please request a new one.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Button 
                onClick={handleResend}
                className="w-full"
                disabled={loading}
              >
                {lastResetEmail ? 'Send Me a New Secure Link' : 'Request New Reset Link'}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => {
                  // SECURITY: Clear all auth state when going back
                  sessionStorage.removeItem('password_reset_tokens');
                  window.history.replaceState({}, document.title, window.location.pathname);
                  navigate('/auth');
                }}
              >
                Back to Sign In
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const passwordStrength = getPasswordStrength(formData.password);

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Helmet>
        <title>Reset Password | Elyphant</title>
        <meta name="description" content="Reset your Elyphant account password securely." />
        <link rel="canonical" href={`${window.location.origin}/reset-password`} />
      </Helmet>
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 text-green-500">
            <CheckCircle size={48} />
          </div>
          <CardTitle>Reset Your Password</CardTitle>
          <CardDescription>
            Enter your new password below
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium">
                New Password
              </label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  placeholder="Enter your new password"
                  className={errors.password ? 'border-red-500' : ''}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </Button>
              </div>
              {formData.password && (
                <div className="text-xs">
                  Password strength: <span className={passwordStrength.color}>{passwordStrength.label}</span>
                </div>
              )}
              {errors.password && (
                <p className="text-xs text-red-500">{errors.password}</p>
              )}
            </div>

            <div className="space-y-2">
              <label htmlFor="confirmPassword" className="text-sm font-medium">
                Confirm New Password
              </label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                  placeholder="Confirm your new password"
                  className={errors.confirmPassword ? 'border-red-500' : ''}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </Button>
              </div>
              {errors.confirmPassword && (
                <p className="text-xs text-red-500">{errors.confirmPassword}</p>
              )}
            </div>

            <div className="space-y-3 pt-2">
              <Button
                type="submit"
                className="w-full"
                disabled={loading || !formData.password || !formData.confirmPassword}
              >
                {loading ? 'Updating Password...' : 'Change Password'}
              </Button>
              
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => {
                  // SECURITY: Clear all auth state when going back
                  sessionStorage.removeItem('password_reset_tokens');
                  window.history.replaceState({}, document.title, window.location.pathname);
                  navigate('/auth');
                }}
              >
                Back to Sign In
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ResetPassword;