import { supabase } from '@/integrations/supabase/client';
import { SecurityEventDetails, RateLimitStatus } from './authTypes';

/**
 * AuthSecurity - Security layer for authentication operations
 * Integrates with existing security infrastructure
 */
export class AuthSecurity {
  /**
   * Log authentication security event
   */
  async logSecurityEvent(
    eventType: string, 
    details: SecurityEventDetails = {}
  ): Promise<void> {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        console.warn('Auth security event logged without user context:', eventType, details);
        return;
      }

      const logEntry = {
        user_id: user.id,
        event_type: `auth_${eventType}`,
        details: {
          ...details,
          timestamp: new Date().toISOString(),
          url: window.location.href,
          referrer: document.referrer || null,
          service: 'UnifiedAuthService'
        },
        user_agent: navigator.userAgent,
        risk_level: details.riskLevel || 'low'
      };

      await supabase.from('security_logs').insert([logEntry]);
      
      // Console log for development
      if (details.riskLevel === 'critical' || details.riskLevel === 'high') {
        console.error(`HIGH RISK Auth Event: ${eventType}`, details);
      } else {
        console.log(`Auth Security Event: ${eventType}`, details);
      }
    } catch (error) {
      console.error('Failed to log auth security event:', error);
    }
  }

  /**
   * Check rate limit for authentication operations
   */
  async checkRateLimit(userId: string, operation: string = 'password_reset'): Promise<boolean> {
    try {
      // Use existing rate limiting infrastructure
      const { data: canProceed } = await supabase
        .rpc('check_message_rate_limit', { sender_uuid: userId });

      if (!canProceed) {
        await this.logSecurityEvent('rate_limit_exceeded', {
          riskLevel: 'medium',
          operation,
          userId
        });
      }

      return canProceed || false;
    } catch (error) {
      console.error('Rate limit check failed:', error);
      return false;
    }
  }

  /**
   * Detect suspicious password reset activity
   */
  async detectSuspiciousActivity(email: string): Promise<boolean> {
    try {
      // Check for multiple reset attempts in short time
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
      
      const { data: recentAttempts, error } = await supabase
        .from('security_logs')
        .select('id')
        .eq('event_type', 'auth_password_reset_initiated')
        .gte('created_at', oneHourAgo)
        .like('details->>email', `%${email}%`);

      if (error) {
        console.error('Error checking suspicious activity:', error);
        return false;
      }

      const attemptCount = recentAttempts?.length || 0;
      const isSuspicious = attemptCount >= 3;

      if (isSuspicious) {
        await this.logSecurityEvent('suspicious_reset_activity', {
          riskLevel: 'high',
          email,
          attemptCount,
          description: `Multiple password reset attempts detected for ${email}`
        });
      }

      return isSuspicious;
    } catch (error) {
      console.error('Suspicious activity detection failed:', error);
      return false;
    }
  }

  /**
   * Get rate limit status for user
   */
  async getRateLimitStatus(userId: string): Promise<RateLimitStatus> {
    try {
      const { data: rateLimitData } = await supabase
        .from('message_rate_limits')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (!rateLimitData) {
        return {
          isLimited: false,
          dailyCount: 0,
          resetTime: null
        };
      }

      return {
        isLimited: rateLimitData.is_rate_limited || false,
        dailyCount: rateLimitData.messages_sent_today || 0,
        resetTime: rateLimitData.rate_limit_expires_at ? new Date(rateLimitData.rate_limit_expires_at) : null
      };
    } catch (error) {
      console.error('Failed to get rate limit status:', error);
      return {
        isLimited: false,
        dailyCount: 0,
        resetTime: null
      };
    }
  }

  /**
   * Cleanup expired security logs
   */
  async cleanupExpiredLogs(): Promise<void> {
    try {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      
      await supabase
        .from('security_logs')
        .delete()
        .lt('created_at', thirtyDaysAgo)
        .like('event_type', 'auth_%');

      console.log('Cleaned up expired auth security logs');
    } catch (error) {
      console.error('Failed to cleanup expired security logs:', error);
    }
  }
}

export const authSecurity = new AuthSecurity();