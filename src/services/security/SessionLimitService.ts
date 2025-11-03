import { supabase } from '@/integrations/supabase/client';

/**
 * Session Limit Service
 * Manages concurrent session limits per user
 */

export const MAX_CONCURRENT_SESSIONS = 5;

export interface SessionInfo {
  id: string;
  deviceFingerprint: string;
  userAgent: string | null;
  ipAddress: string | null;
  locationData: any;
  lastActivityAt: string;
  createdAt: string;
  isCurrent: boolean;
}

interface DbSession {
  id: string;
  device_fingerprint: string;
  user_agent: string | null;
  ip_address: unknown;
  location_data: any;
  last_activity_at: string;
  created_at: string;
  session_token: string;
}

/**
 * Get user's active sessions
 */
export async function getUserSessions(userId: string): Promise<SessionInfo[]> {
  try {
    const { data: sessions, error } = await supabase
      .from('user_sessions')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('last_activity_at', { ascending: false });

    if (error) {
      console.error('Failed to fetch user sessions:', error);
      return [];
    }

    // Get current session token to mark current session
    const { data: { session } } = await supabase.auth.getSession();
    const currentToken = session?.access_token;

    return ((sessions || []) as DbSession[]).map(s => ({
      id: s.id,
      deviceFingerprint: s.device_fingerprint,
      userAgent: s.user_agent,
      ipAddress: s.ip_address && typeof s.ip_address === 'string' ? s.ip_address : null,
      locationData: s.location_data,
      lastActivityAt: s.last_activity_at,
      createdAt: s.created_at,
      isCurrent: s.session_token === currentToken
    }));
  } catch (error) {
    console.error('Error fetching sessions:', error);
    return [];
  }
}

/**
 * Check and enforce concurrent session limit
 * Returns true if session can be created, false if limit exceeded
 */
export async function checkSessionLimit(userId: string): Promise<boolean> {
  try {
    const { count, error } = await supabase
      .from('user_sessions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_active', true);

    if (error) {
      console.error('Failed to check session count:', error);
      return true; // Fail open
    }

    return (count || 0) < MAX_CONCURRENT_SESSIONS;
  } catch (error) {
    console.error('Error checking session limit:', error);
    return true; // Fail open
  }
}

/**
 * Remove oldest session when limit is reached
 */
export async function removeOldestSession(userId: string): Promise<boolean> {
  try {
    // Get oldest session (excluding current)
    const { data: sessions, error } = await supabase
      .from('user_sessions')
      .select('id, session_token')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('last_activity_at', { ascending: true })
      .limit(1);

    if (error || !sessions || sessions.length === 0) {
      return false;
    }

    const oldestSession = sessions[0];

    // Mark as inactive
    const { error: updateError } = await supabase
      .from('user_sessions')
      .update({ is_active: false })
      .eq('id', oldestSession.id);

    if (updateError) {
      console.error('Failed to remove oldest session:', updateError);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error removing oldest session:', error);
    return false;
  }
}

/**
 * Terminate a specific session
 */
export async function terminateSession(sessionId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('user_sessions')
      .update({ is_active: false })
      .eq('id', sessionId);

    if (error) {
      console.error('Failed to terminate session:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error terminating session:', error);
    return false;
  }
}

/**
 * Terminate all sessions except current
 */
export async function terminateAllOtherSessions(userId: string): Promise<number> {
  try {
    // Get current session
    const { data: { session } } = await supabase.auth.getSession();
    const currentToken = session?.access_token;

    if (!currentToken) {
      return 0;
    }

    // Mark all other sessions as inactive
    const { data, error } = await supabase
      .from('user_sessions')
      .update({ is_active: false })
      .eq('user_id', userId)
      .eq('is_active', true)
      .neq('session_token', currentToken)
      .select();

    if (error) {
      console.error('Failed to terminate sessions:', error);
      return 0;
    }

    return data?.length || 0;
  } catch (error) {
    console.error('Error terminating sessions:', error);
    return 0;
  }
}

/**
 * Get session count for user
 */
export async function getSessionCount(userId: string): Promise<number> {
  try {
    const { count, error } = await supabase
      .from('user_sessions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_active', true);

    if (error) {
      console.error('Failed to get session count:', error);
      return 0;
    }

    return count || 0;
  } catch (error) {
    console.error('Error getting session count:', error);
    return 0;
  }
}
