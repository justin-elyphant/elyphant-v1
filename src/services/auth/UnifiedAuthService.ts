import { supabase } from '@/integrations/supabase/client';
import { Session, User } from '@supabase/supabase-js';
import { 
  AuthTokenData, 
  PasswordResetResult, 
  TokenValidationResult, 
  PasswordResetOptions,
  AUTH_EVENTS
} from './authTypes';
import { authCache } from './authCache';
import { authSecurity } from './authSecurity';
import { authProtection } from './authProtection';

/**
 * UNIFIED AUTH SERVICE
 * 
 * Consolidates authentication operations with enhanced security features.
 * Integrates with existing auth infrastructure while adding:
 * - Enhanced password reset flow with security logging
 * - Rate limiting and suspicious activity detection  
 * - Token validation and caching
 * - Audit logging for all auth events
 * - Backward compatibility with existing auth hooks
 * 
 * Follows the established unified service pattern from other services.
 */
class UnifiedAuthService {
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes
  private readonly TOKEN_TTL = 60 * 60 * 1000; // 1 hour

  /**
   * Enhanced password reset initiation with security features
   */
  async initiatePasswordReset(email: string): Promise<PasswordResetResult> {
    try {
      // Input validation and sanitization
      const sanitizedEmail = authProtection.sanitizeEmail(email);
      if (!authProtection.validateEmail(sanitizedEmail)) {
        return {
          success: false,
          error: 'Invalid email format'
        };
      }

      // Security checks
      const attackCheck = authProtection.detectAttackPatterns(sanitizedEmail);
      if (attackCheck.isSuspicious) {
        await authSecurity.logSecurityEvent(AUTH_EVENTS.SUSPICIOUS_RESET_ACTIVITY, {
          riskLevel: 'high',
          email: sanitizedEmail,
          attackPatterns: attackCheck.patterns
        });
        return {
          success: false,
          error: 'Invalid request'
        };
      }

      // Check for suspicious activity
      const isSuspicious = await authSecurity.detectSuspiciousActivity(sanitizedEmail);
      if (isSuspicious) {
        return {
          success: false,
          error: 'Too many reset attempts. Please try again later.'
        };
      }

      // Store email for later use in reset flow
      localStorage.setItem('lastResetEmail', sanitizedEmail);

      // Call Supabase password reset
      const { error } = await supabase.auth.resetPasswordForEmail(sanitizedEmail, {
        redirectTo: `${window.location.origin}/reset-password-launch`
      });

      if (error) {
        await authSecurity.logSecurityEvent(AUTH_EVENTS.PASSWORD_RESET_INITIATED, {
          riskLevel: 'medium',
          email: sanitizedEmail,
          success: false,
          error: error.message
        });
        return {
          success: false,
          error: error.message
        };
      }

      // Log successful initiation
      await authSecurity.logSecurityEvent(AUTH_EVENTS.PASSWORD_RESET_INITIATED, {
        riskLevel: 'low',
        email: sanitizedEmail,
        success: true
      });

      return {
        success: true,
        message: 'Password reset email sent successfully'
      };

    } catch (error: any) {
      console.error('Password reset initiation failed:', error);
      return {
        success: false,
        error: 'Failed to initiate password reset'
      };
    }
  }

  /**
   * Validate reset token with caching
   */
  async validateResetToken(token: string): Promise<TokenValidationResult> {
    try {
      // Check cache first
      const cacheKey = `token_validation_${token.substring(0, 8)}`;
      const cached = authCache.get<TokenValidationResult>(cacheKey);
      if (cached) {
        return cached;
      }

      // Validate token via edge function
      const { data, error } = await supabase.functions.invoke('authenticate-reset-token', {
        body: { token }
      });

      if (error) {
        await authSecurity.logSecurityEvent(AUTH_EVENTS.TOKEN_VALIDATION_FAILED, {
          riskLevel: 'medium',
          token: token.substring(0, 8) + '...',
          error: error.message
        });
        
        const result: TokenValidationResult = {
          isValid: false,
          error: error.message
        };
        
        // Cache negative result for short time to prevent repeated calls
        authCache.set(cacheKey, result, 60 * 1000); // 1 minute
        return result;
      }

      // Check for successful response
      const isValid = data?.success === true || !!data?.access_token;
      const result: TokenValidationResult = {
        isValid,
        error: isValid ? undefined : 'Invalid token'
      };

      // Cache result
      const cacheDuration = isValid ? this.CACHE_TTL : 60 * 1000;
      authCache.set(cacheKey, result, cacheDuration);

      return result;

    } catch (error: any) {
      console.error('Token validation failed:', error);
      return {
        isValid: false,
        error: 'Token validation failed'
      };
    }
  }

  /**
   * Complete password reset with enhanced security
   */
  async completePasswordReset(
    newPassword: string, 
    options: PasswordResetOptions = {}
  ): Promise<PasswordResetResult> {
    try {
      // Validate password strength
      const passwordValidation = authProtection.validatePasswordStrength(newPassword);
      if (!passwordValidation.isValid) {
        return {
          success: false,
          error: `Password requirements not met: ${passwordValidation.feedback.join(', ')}`
        };
      }

      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        return {
          success: false,
          error: 'Invalid session. Please request a new reset link.'
        };
      }

      // Update password
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) {
        await authSecurity.logSecurityEvent(AUTH_EVENTS.PASSWORD_RESET_COMPLETED, {
          riskLevel: 'medium',
          userId: user.id,
          success: false,
          error: error.message
        });
        return {
          success: false,
          error: error.message
        };
      }

      // Invalidate other sessions for security (default behavior)
      if (options.invalidateOtherSessions !== false) {
        try {
          await supabase.auth.signOut({ scope: 'others' });
        } catch (signOutError) {
          console.warn('Could not invalidate other sessions:', signOutError);
        }
      }

      // Send security notification (default behavior)
      if (options.sendNotification !== false) {
        const lastResetEmail = localStorage.getItem('lastResetEmail');
        if (lastResetEmail) {
          try {
            await supabase.functions.invoke('ecommerce-email-orchestrator', {
              body: { 
                eventType: 'password_changed',
                recipientEmail: lastResetEmail,
                data: { email: lastResetEmail }
              }
            });
          } catch (notificationError) {
            console.warn('Could not send security notification:', notificationError);
          }
        }
      }

      // Log successful completion
      await authSecurity.logSecurityEvent(AUTH_EVENTS.PASSWORD_RESET_COMPLETED, {
        riskLevel: 'low',
        userId: user.id,
        success: true,
        invalidatedOtherSessions: options.invalidateOtherSessions !== false,
        sentNotification: options.sendNotification !== false
      });

      // Cleanup storage
      this.cleanupPasswordResetData();

      return {
        success: true,
        message: 'Password reset successfully'
      };

    } catch (error: any) {
      console.error('Password reset completion failed:', error);
      return {
        success: false,
        error: 'Failed to complete password reset'
      };
    }
  }

  /**
   * Process tokens from session storage (for reset flow)
   */
  async processStoredTokens(): Promise<TokenValidationResult> {
    try {
      const storedTokensJson = sessionStorage.getItem('password_reset_tokens');
      if (!storedTokensJson) {
        return { isValid: false, error: 'No stored tokens found' };
      }

      const tokenData = JSON.parse(storedTokensJson);
      
      // Validate stored data
      if (!authProtection.validateStorageData(tokenData)) {
        sessionStorage.removeItem('password_reset_tokens');
        return { isValid: false, error: 'Invalid or expired stored tokens' };
      }

      // Set session using stored tokens
      const { error } = await supabase.auth.setSession({
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token
      });

      // Clear tokens after use (one-time use)
      sessionStorage.removeItem('password_reset_tokens');

      if (error) {
        return { isValid: false, error: error.message };
      }

      return { isValid: true };

    } catch (error: any) {
      console.error('Error processing stored tokens:', error);
      sessionStorage.removeItem('password_reset_tokens');
      return { isValid: false, error: 'Failed to process stored tokens' };
    }
  }

  /**
   * Process URL hash tokens (from Supabase recovery link)
   */
  async processUrlTokens(): Promise<TokenValidationResult> {
    try {
      const hash = window.location.hash;
      if (!hash || !/access_token=/.test(hash)) {
        return { isValid: false, error: 'No URL tokens found' };
      }

      const params = new URLSearchParams(hash.replace('#', ''));
      const access_token = params.get('access_token');
      const refresh_token = params.get('refresh_token');

      if (!access_token || !refresh_token) {
        return { isValid: false, error: 'Incomplete token data in URL' };
      }

      // Clean URL immediately to avoid token leakage
      window.history.replaceState({}, document.title, window.location.pathname + window.location.search);

      // Set session
      const { error } = await supabase.auth.setSession({ access_token, refresh_token });

      if (error) {
        return { isValid: false, error: error.message };
      }

      return { isValid: true };

    } catch (error: any) {
      console.error('Error processing URL tokens:', error);
      return { isValid: false, error: 'Failed to process URL tokens' };
    }
  }

  /**
   * Cleanup expired tokens and cache
   */
  async cleanupExpiredTokens(): Promise<void> {
    try {
      // Cleanup cache
      authCache.cleanup();

      // Cleanup storage
      this.cleanupPasswordResetData();

      // Cleanup security logs
      await authSecurity.cleanupExpiredLogs();

    } catch (error) {
      console.error('Token cleanup failed:', error);
    }
  }

  /**
   * Clean up password reset related data
   */
  private cleanupPasswordResetData(): void {
    const keysToCleanup = [
      'password_reset_tokens',
      'lastResetEmail'
    ];
    
    authProtection.cleanupStorage(keysToCleanup);
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return authCache.getStats();
  }

  /**
   * Clear all auth cache
   */
  clearCache(): void {
    authCache.clear();
  }

  /**
   * Get rate limit status for current user
   */
  async getRateLimitStatus(): Promise<any> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      return await authSecurity.getRateLimitStatus(user.id);
    } catch (error) {
      console.error('Failed to get rate limit status:', error);
      return null;
    }
  }
}

// Export singleton instance
export const unifiedAuthService = new UnifiedAuthService();
export { UnifiedAuthService };