/**
 * Anomaly Detection Service
 * Detects suspicious security patterns and calculates risk scores
 */

import { supabase } from '@/integrations/supabase/client';
import { SessionFingerprintService, DeviceFingerprint } from '../auth/sessionFingerprint';

export interface AnomalyDetection {
  detected: boolean;
  anomalyType: 'device_change' | 'location_change' | 'unusual_time' | 'unusual_frequency' | 'concurrent_sessions' | 'failed_login_attempts';
  riskScore: number;
  details: Record<string, any>;
}

export class AnomalyDetectionService {
  /**
   * Detect device fingerprint changes
   */
  static async detectDeviceChange(
    userId: string,
    currentFingerprint: DeviceFingerprint
  ): Promise<AnomalyDetection | null> {
    try {
      // Get user's recent sessions
      const { data: recentSessions } = await supabase
        .from('user_sessions')
        .select('device_fingerprint, location_data, created_at')
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(5);

      if (!recentSessions || recentSessions.length === 0) {
        return null; // First session, no anomaly
      }

      // Check if current fingerprint matches any recent session
      const fingerprintMatch = recentSessions.some(
        session => session.device_fingerprint === currentFingerprint.hash
      );

      if (!fingerprintMatch) {
        // New device detected
        const lastSession = recentSessions[0];
        const timeSinceLastLogin = Math.floor(
          (Date.now() - new Date(lastSession.created_at).getTime()) / (1000 * 60 * 60 * 24)
        );

        return {
          detected: true,
          anomalyType: 'device_change',
          riskScore: 60 + (timeSinceLastLogin > 30 ? 15 : 0),
          details: {
            previous_device: (lastSession.location_data as any)?.deviceDescription || 'Unknown',
            current_device: SessionFingerprintService.getDeviceDescription(currentFingerprint),
            time_since_last_login: timeSinceLastLogin,
            previous_fingerprint: lastSession.device_fingerprint,
            current_fingerprint: currentFingerprint.hash,
          },
        };
      }

      return null;
    } catch (error) {
      console.error('Error detecting device change:', error);
      return null;
    }
  }

  /**
   * Detect location/timezone changes
   */
  static async detectLocationChange(
    userId: string,
    currentLocation: { timezone: string; region?: string }
  ): Promise<AnomalyDetection | null> {
    try {
      const { data: recentSessions } = await supabase
        .from('user_sessions')
        .select('location_data, created_at')
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(5);

      if (!recentSessions || recentSessions.length === 0) {
        return null;
      }

      // Check if timezone changed
      const lastSession = recentSessions[0];
      const lastLocationData = lastSession.location_data as any;
      const lastTimezone = lastLocationData?.timezone;

      if (lastTimezone && lastTimezone !== currentLocation.timezone) {
        return {
          detected: true,
          anomalyType: 'location_change',
          riskScore: 40,
          details: {
            previous_timezone: lastTimezone,
            current_timezone: currentLocation.timezone,
            previous_region: lastLocationData?.region || 'Unknown',
            current_region: currentLocation.region || 'Unknown',
          },
        };
      }

      return null;
    } catch (error) {
      console.error('Error detecting location change:', error);
      return null;
    }
  }

  /**
   * Detect unusual login time patterns
   */
  static async detectUnusualTime(userId: string): Promise<AnomalyDetection | null> {
    try {
      const currentHour = new Date().getHours();

      // Get user's login history
      const { data: loginHistory } = await supabase
        .from('security_logs')
        .select('created_at')
        .eq('user_id', userId)
        .eq('event_type', 'session_created')
        .order('created_at', { ascending: false })
        .limit(20);

      if (!loginHistory || loginHistory.length < 5) {
        return null; // Not enough data
      }

      // Calculate typical login hours
      const loginHours = loginHistory.map(log => new Date(log.created_at).getHours());
      const avgHour = loginHours.reduce((a, b) => a + b, 0) / loginHours.length;
      const hourDeviation = Math.abs(currentHour - avgHour);

      // If logging in more than 6 hours outside typical pattern
      if (hourDeviation > 6) {
        return {
          detected: true,
          anomalyType: 'unusual_time',
          riskScore: 20,
          details: {
            current_hour: currentHour,
            typical_hour_range: `${Math.floor(avgHour - 2)}-${Math.floor(avgHour + 2)}`,
            deviation_hours: Math.floor(hourDeviation),
          },
        };
      }

      return null;
    } catch (error) {
      console.error('Error detecting unusual time:', error);
      return null;
    }
  }

  /**
   * Detect concurrent active sessions
   */
  static async detectConcurrentSessions(userId: string): Promise<AnomalyDetection | null> {
    try {
      const { count } = await supabase
        .from('user_sessions')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('is_active', true);

      // Alert if more than 3 active sessions
      if (count && count > 3) {
        return {
          detected: true,
          anomalyType: 'concurrent_sessions',
          riskScore: 50,
          details: {
            active_session_count: count,
            threshold: 3,
          },
        };
      }

      return null;
    } catch (error) {
      console.error('Error detecting concurrent sessions:', error);
      return null;
    }
  }

  /**
   * Run all anomaly detection checks
   */
  static async runAllChecks(
    userId: string,
    currentFingerprint: DeviceFingerprint,
    currentLocation: { timezone: string; region?: string }
  ): Promise<AnomalyDetection[]> {
    const detections = await Promise.all([
      this.detectDeviceChange(userId, currentFingerprint),
      this.detectLocationChange(userId, currentLocation),
      this.detectUnusualTime(userId),
      this.detectConcurrentSessions(userId),
    ]);

    return detections.filter((d): d is AnomalyDetection => d !== null);
  }

  /**
   * Log detected anomaly to database
   */
  static async logAnomaly(
    userId: string,
    sessionId: string | null,
    anomaly: AnomalyDetection
  ): Promise<void> {
    try {
      await supabase.from('security_anomalies').insert({
        user_id: userId,
        session_id: sessionId,
        anomaly_type: anomaly.anomalyType,
        risk_score: anomaly.riskScore,
        details: anomaly.details,
      });

      console.log(`🚨 Security anomaly logged: ${anomaly.anomalyType} (risk: ${anomaly.riskScore})`);
    } catch (error) {
      console.error('Error logging anomaly:', error);
    }
  }
}
