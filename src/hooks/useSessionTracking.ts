import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Session } from '@supabase/supabase-js';
import { SessionFingerprintService } from '@/services/auth/sessionFingerprint';
import { AnomalyDetectionService } from '@/services/security/AnomalyDetectionService';

/**
 * Hook to track user sessions in the database
 * Creates/updates session records with device fingerprint
 */
export const useSessionTracking = (session: Session | null) => {
  const [sessionTracked, setSessionTracked] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);

  useEffect(() => {
    // Guard against rapid re-renders during auth initialization
    if (!session?.user || sessionTracked) return;
    
    // Capture session values to avoid stale closures
    const currentSession = session;
    const userId = session.user.id;
    const accessToken = session.access_token;
    
    // Add a small delay to ensure auth state is stable
    const timeoutId = setTimeout(async () => {
      // Double-check session is still valid
      if (!currentSession?.user) return;
      
      try {
        // Generate device fingerprint
        const fingerprint = await SessionFingerprintService.generateFingerprint();
        const deviceDescription = SessionFingerprintService.getDeviceDescription(fingerprint);
        const location = SessionFingerprintService.getApproximateLocation();

        // Calculate expiration (30 days from now - absolute timeout)
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 30);

        // Check if session already exists for this device (dedupe by fingerprint, not token)
        const { data: existingSession } = await supabase
          .from('user_sessions')
          .select('id')
          .eq('device_fingerprint', fingerprint.hash)
          .eq('user_id', userId)
          .eq('is_active', true)
          .single();

        if (existingSession) {
          // Update existing session (same device) - just refresh activity and token
          await supabase
            .from('user_sessions')
            .update({
              session_token: accessToken, // Update to current token
              last_activity_at: new Date().toISOString(),
              is_active: true,
              expires_at: expiresAt.toISOString(),
            })
            .eq('id', existingSession.id);
          
          setSessionId(existingSession.id);
        } else {
          // Create new session record (new device)
          const { data: newSession, error } = await supabase
            .from('user_sessions')
            .insert({
              user_id: userId,
              session_token: accessToken,
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
            user_id: userId,
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

          // Run anomaly detection (Phase 3)
          setTimeout(async () => {
            try {
              const anomalies = await AnomalyDetectionService.runAllChecks(
                userId,
                fingerprint,
                location
              );

              // Log detected anomalies
              for (const anomaly of anomalies) {
                await AnomalyDetectionService.logAnomaly(userId, newSession.id, anomaly);
              }
            } catch (error) {
              console.error('Anomaly detection failed:', error);
            }
          }, 0);
        }

        setSessionTracked(true);
      } catch (error) {
        console.error('Session tracking error:', error);
      }
    }, 100); // 100ms delay to ensure auth state is stable

    return () => clearTimeout(timeoutId);
  }, [session?.user?.id, sessionTracked]); // Use stable user ID instead of whole session object

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
