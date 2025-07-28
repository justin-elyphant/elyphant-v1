import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface RateLimitStatus {
  isLimited: boolean;
  dailyCount: number;
  resetTime: Date | null;
}

export const useSecurityRateLimit = () => {
  const [rateLimitStatus, setRateLimitStatus] = useState<RateLimitStatus>({
    isLimited: false,
    dailyCount: 0,
    resetTime: null
  });

  const checkRateLimit = async (userId: string): Promise<boolean> => {
    try {
      const { data: canSend } = await supabase
        .rpc('check_message_rate_limit', { sender_uuid: userId });
      
      // Get current rate limit status
      const { data: rateLimitData } = await supabase
        .from('message_rate_limits')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (rateLimitData) {
        setRateLimitStatus({
          isLimited: rateLimitData.is_rate_limited || false,
          dailyCount: rateLimitData.messages_sent_today || 0,
          resetTime: rateLimitData.rate_limit_expires_at ? new Date(rateLimitData.rate_limit_expires_at) : null
        });
      }

      return canSend;
    } catch (error) {
      console.error('Rate limit check failed:', error);
      return false;
    }
  };

  const logSecurityEvent = async (eventType: string, details: any) => {
    try {
      // Log security events for monitoring
      console.warn(`Security Event: ${eventType}`, details);
      
      // In production, you might want to send this to a security monitoring service
      // await supabase.from('security_logs').insert([{
      //   event_type: eventType,
      //   details: details,
      //   timestamp: new Date().toISOString(),
      //   user_agent: navigator.userAgent,
      //   ip_address: await getClientIP()
      // }]);
    } catch (error) {
      console.error('Failed to log security event:', error);
    }
  };

  return {
    rateLimitStatus,
    checkRateLimit,
    logSecurityEvent
  };
};