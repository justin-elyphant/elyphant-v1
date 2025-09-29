import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Eye, EyeOff, CheckCircle, AlertCircle } from 'lucide-react';
import { z } from 'zod';

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

  // Get token and type from URL parameters (Supabase format)
  const accessToken = searchParams.get('access_token');
  const refreshToken = searchParams.get('refresh_token');
  const type = searchParams.get('type') || 'recovery';
  const email = searchParams.get('email');

  useEffect(() => {
    const verifyTokenOrSession = async () => {
      // Check if we have Supabase auth tokens (preferred method)
      if (accessToken && refreshToken) {
        try {
          // Set the session using the tokens from the URL
          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken
          });

          if (error) {
            console.error('Session setup error:', error);
            setIsValidToken(false);
            toast.error('Invalid or expired reset link');
          } else {
            setIsValidToken(true);
            toast.success('Reset link verified successfully!');
          }
        } catch (error) {
          console.error('Session verification failed:', error);
          setIsValidToken(false);
          toast.error('Failed to verify reset link');
        }
      } 
      // Fallback: Check if we have at least an email (from custom reset link)
      else if (email && type === 'recovery') {
        // For custom reset links, we'll allow the reset but require the user to be careful
        setIsValidToken(true);
        toast.success('Reset link verified! Please set your new password.');
      } 
      // No valid tokens or email
      else {
        setIsValidToken(false);
        toast.error('Invalid or missing reset tokens');
      }
    };

    verifyTokenOrSession();
  }, [accessToken, refreshToken, email, type]);

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
      // If we have auth tokens, use updateUser (preferred method)
      if (accessToken && refreshToken) {
        const { error } = await supabase.auth.updateUser({
          password: formData.password
        });

        if (error) {
          toast.error(`Failed to reset password: ${error.message}`);
        } else {
          toast.success('Password reset successfully! You can now sign in with your new password.');
          // Redirect to auth page after a short delay
          setTimeout(() => {
            navigate('/auth', { replace: true });
          }, 2000);
        }
      } 
      // Fallback: If we only have email, use admin reset (requires user to confirm via email)
      else if (email) {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/auth`,
        });

        if (error) {
          toast.error(`Failed to send new reset link: ${error.message}`);
        } else {
          toast.success('A new password reset link has been sent to your email. Please check your inbox and follow the link to complete the reset.');
          setTimeout(() => {
            navigate('/auth', { replace: true });
          }, 3000);
        }
      } else {
        toast.error('Unable to reset password. Please request a new reset link.');
        navigate('/forgot-password');
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
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
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
            <Button 
              onClick={() => navigate('/forgot-password')} 
              className="w-full"
            >
              Request New Reset Link
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const passwordStrength = getPasswordStrength(formData.password);

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 text-green-500">
            <CheckCircle size={48} />
          </div>
          <CardTitle>Reset Your Password</CardTitle>
          <CardDescription>
            {accessToken && refreshToken 
              ? (email ? `Resetting password for ${email}` : 'Enter your new password below')
              : email 
                ? `We'll send a secure reset link to ${email}` 
                : 'Enter your new password below'
            }
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
                {loading 
                  ? (accessToken && refreshToken ? 'Resetting Password...' : 'Sending Reset Link...') 
                  : (accessToken && refreshToken ? 'Reset Password' : 'Send New Reset Link')
                }
              </Button>
              
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => navigate('/auth')}
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