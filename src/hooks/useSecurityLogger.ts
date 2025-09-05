import { supabase } from '@/integrations/supabase/client';

interface SecurityEventDetails {
  riskLevel?: 'low' | 'medium' | 'high' | 'critical';
  description?: string;
  metadata?: Record<string, any>;
  [key: string]: any;
}

export const useSecurityLogger = () => {
  const logSecurityEvent = async (
    eventType: string, 
    details: SecurityEventDetails = {}
  ) => {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        console.warn('Security event logged without user context:', eventType, details);
        return;
      }

      const logEntry = {
        user_id: user.id,
        event_type: eventType,
        details: {
          ...details,
          timestamp: new Date().toISOString(),
          url: window.location.href,
          referrer: document.referrer || null
        },
        user_agent: navigator.userAgent,
        risk_level: details.riskLevel || 'low'
      };

      await supabase.from('security_logs').insert([logEntry]);
      
      // Console log for development
      if (details.riskLevel === 'critical' || details.riskLevel === 'high') {
        console.error(`HIGH RISK Security Event: ${eventType}`, details);
      } else {
        console.log(`Security Event: ${eventType}`, details);
      }
    } catch (error) {
      console.error('Failed to log security event:', error);
    }
  };

  const logAuthEvent = (eventType: 'login_success' | 'login_failure' | 'logout' | 'password_change', details?: SecurityEventDetails) => {
    return logSecurityEvent(`auth_${eventType}`, { 
      ...details, 
      riskLevel: eventType === 'login_failure' ? 'medium' : 'low' 
    });
  };

  const logDataAccess = (resourceType: string, resourceId: string, action: string, details?: SecurityEventDetails) => {
    return logSecurityEvent('data_access', {
      ...details,
      resourceType,
      resourceId,
      action,
      riskLevel: 'low'
    });
  };

  const logRateLimitHit = (limitType: string, details?: SecurityEventDetails) => {
    return logSecurityEvent('rate_limit_exceeded', {
      ...details,
      limitType,
      riskLevel: 'medium'
    });
  };

  const logSuspiciousActivity = (activityType: string, details?: SecurityEventDetails) => {
    return logSecurityEvent('suspicious_activity', {
      ...details,
      activityType,
      riskLevel: 'high'
    });
  };

  return {
    logSecurityEvent,
    logAuthEvent,
    logDataAccess,
    logRateLimitHit,
    logSuspiciousActivity
  };
};