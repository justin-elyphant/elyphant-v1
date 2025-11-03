import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { 
  checkRateLimit, 
  resetRateLimit, 
  getRateLimitErrorMessage,
  type RateLimitEventType 
} from '@/services/auth/rateLimitService';
import { authSecurity } from '@/services/auth/authSecurity';

/**
 * Enhanced auth hook with rate limiting and security features
 */
export function useAuthWithRateLimit() {
  const [isLoading, setIsLoading] = useState(false);

  /**
   * Sign in with rate limiting
   */
  const signIn = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    try {
      // Check rate limit
      const rateLimitCheck = await checkRateLimit(email, 'login');
      
      if (rateLimitCheck.isBlocked) {
        const errorMsg = getRateLimitErrorMessage(rateLimitCheck);
        toast.error('Too Many Attempts', { description: errorMsg });
        
        // Log security event
        await authSecurity.logSecurityEvent('rate_limit_exceeded', {
          riskLevel: 'medium',
          operation: 'login',
          email,
          attemptsRemaining: rateLimitCheck.attemptsRemaining
        });
        
        return { data: null, error: { message: errorMsg } };
      }

      // Attempt sign in
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        // Log failed attempt
        await authSecurity.logSecurityEvent('login_failure', {
          riskLevel: 'medium',
          email,
          error: error.message,
          attemptsRemaining: rateLimitCheck.attemptsRemaining - 1
        });
        
        // Show attempts remaining if getting close to limit
        if (rateLimitCheck.attemptsRemaining <= 2) {
          toast.warning('Warning', {
            description: `${rateLimitCheck.attemptsRemaining - 1} attempts remaining before temporary lockout`
          });
        }
        
        return { data: null, error };
      }

      // Success - reset rate limit and log
      await resetRateLimit(email, 'login');
      await authSecurity.logSecurityEvent('login_success', {
        riskLevel: 'low',
        email,
        userId: data.user?.id
      });

      return { data, error: null };
    } catch (error: any) {
      return { data: null, error };
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Sign up with rate limiting
   */
  const signUp = useCallback(async (email: string, password: string, metadata?: any) => {
    setIsLoading(true);
    try {
      // Check rate limit
      const rateLimitCheck = await checkRateLimit(email, 'signup');
      
      if (rateLimitCheck.isBlocked) {
        const errorMsg = getRateLimitErrorMessage(rateLimitCheck);
        toast.error('Too Many Attempts', { description: errorMsg });
        return { data: null, error: { message: errorMsg } };
      }

      // Attempt sign up
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: metadata ? { data: metadata } : undefined
      });

      if (error) {
        await authSecurity.logSecurityEvent('signup_failure', {
          riskLevel: 'medium',
          email,
          error: error.message
        });
        return { data: null, error };
      }

      // Success - reset rate limit
      await resetRateLimit(email, 'signup');
      await authSecurity.logSecurityEvent('signup_success', {
        riskLevel: 'low',
        email,
        userId: data.user?.id
      });

      return { data, error: null };
    } catch (error: any) {
      return { data: null, error };
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Password reset with rate limiting
   */
  const resetPassword = useCallback(async (email: string) => {
    setIsLoading(true);
    try {
      // Check rate limit
      const rateLimitCheck = await checkRateLimit(email, 'password_reset');
      
      if (rateLimitCheck.isBlocked) {
        const errorMsg = getRateLimitErrorMessage(rateLimitCheck);
        toast.error('Too Many Attempts', { description: errorMsg });
        return { error: { message: errorMsg } };
      }

      // Attempt password reset
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password-launch`
      });

      if (error) {
        await authSecurity.logSecurityEvent('password_reset_failed', {
          riskLevel: 'medium',
          email,
          error: error.message
        });
        return { error };
      }

      // Success - reset rate limit
      await resetRateLimit(email, 'password_reset');
      await authSecurity.logSecurityEvent('password_reset_initiated', {
        riskLevel: 'low',
        email
      });

      return { error: null };
    } catch (error: any) {
      return { error };
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    signIn,
    signUp,
    resetPassword,
    isLoading
  };
}
