import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Session } from '@supabase/supabase-js';
import { SessionFingerprintService } from '@/services/auth/sessionFingerprint';

/**
 * Hook to track user sessions in the database
 * Creates/updates session records with device fingerprint
 */
export const useSessionTracking = (session: Session | null) => {
  const [sessionTracked, setSessionTracked] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);

  useEffect(() => {
    if (!session?.user || sessionTracked) return;

    const trackSession = async () => {
      try {
        // Generate device fingerprint
        const fingerprint = await SessionFingerprintService.generateFingerprint();
        const deviceDescription = SessionFingerprintService.getDeviceDescription(fingerprint);
        const location = SessionFingerprintService.getApproximateLocation();

        // Create session token (using access token as unique identifier)
        const sessionToken = session.access_token;

        // Calculate expiration (30 days from now - absolute timeout)
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 30);

        // Check if session already exists
        const { data: existingSession } = await supabase
          .from('user_sessions')
          .select('id')
          .eq('session_token', sessionToken)
          .eq('user_id', session.user.id)
          .single();

        if (existingSession) {
          // Update existing session
          await supabase
            .from('user_sessions')
            .update({
              last_activity_at: new Date().toISOString(),
              is_active: true,
            })
            .eq('id', existingSession.id);
          
          setSessionId(existingSession.id);
        } else {
          // Create new session record
          const { data: newSession, error } = await supabase
            .from('user_sessions')
            .insert({
              user_id: session.user.id,
              session_token: sessionToken,
              device_fingerprint: fingerprint.hash,
              user_agent: fingerprint.raw.userAgent,
              location_data: {
                timezone: location.timezone,
                region: location.region,
                deviceDescription: deviceDescription,
              },
              expires_at: expiresAt.toISOString(),
            })
            .select('id')
            .single();

          if (error) {
            console.error('Error creating session record:', error);
            return;
          }

          setSessionId(newSession.id);

          // Log security event
          await supabase.from('security_logs').insert({
            user_id: session.user.id,
            event_type: 'session_created',
            details: {
              device_fingerprint: fingerprint.hash,
              device_description: deviceDescription,
              timezone: location.timezone,
              session_id: newSession.id,
            },
            user_agent: fingerprint.raw.userAgent,
            risk_level: 'low',
          });
        }

        setSessionTracked(true);
      } catch (error) {
        console.error('Session tracking error:', error);
      }
    };

    trackSession();
  }, [session, sessionTracked]);

  // Update activity timestamp periodically (every 5 minutes)
  useEffect(() => {
    if (!sessionId || !session) return;

    const interval = setInterval(async () => {
      try {
        await supabase
          .from('user_sessions')
          .update({
            last_activity_at: new Date().toISOString(),
          })
          .eq('id', sessionId);
      } catch (error) {
        console.error('Failed to update session activity:', error);
      }
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(interval);
  }, [sessionId, session]);

  return {
    sessionTracked,
    sessionId,
  };
};
