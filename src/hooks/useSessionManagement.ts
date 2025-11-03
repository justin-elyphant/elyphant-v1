import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface UserSession {
  id: string;
  device_fingerprint: string;
  user_agent: string | null;
  ip_address: unknown;
  location_data: any;
  is_active: boolean;
  last_activity_at: string;
  created_at: string;
  expires_at: string;
  session_token: string;
}

export const useSessionManagement = (userId: string | undefined) => {
  const [sessions, setSessions] = useState<UserSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentSessionToken, setCurrentSessionToken] = useState<string | null>(null);

  // Get current session token
  useEffect(() => {
    const getCurrentToken = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setCurrentSessionToken(session?.access_token || null);
    };
    getCurrentToken();
  }, []);

  // Fetch all active sessions
  const fetchSessions = async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('user_sessions')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('last_activity_at', { ascending: false });

      if (error) throw error;

      setSessions(data || []);
    } catch (error) {
      console.error('Error fetching sessions:', error);
      toast.error('Failed to load sessions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, [userId]);

  /**
   * Sign out a specific session
   */
  const signOutSession = async (sessionId: string) => {
    try {
      const { error } = await supabase.rpc('terminate_session', {
        target_session_id: sessionId,
      });

      if (error) throw error;

      toast.success('Session terminated');
      fetchSessions(); // Refresh list

      // Log security event
      await supabase.from('security_logs').insert({
        user_id: userId,
        event_type: 'session_terminated',
        details: {
          session_id: sessionId,
          terminated_at: new Date().toISOString(),
          method: 'manual',
        },
        user_agent: navigator.userAgent,
        risk_level: 'low',
      });
    } catch (error) {
      console.error('Error terminating session:', error);
      toast.error('Failed to sign out session');
    }
  };

  /**
   * Sign out all other sessions except current
   */
  const signOutAllOtherSessions = async () => {
    if (!userId || !currentSessionToken) return;

    try {
      const { error } = await supabase.rpc('terminate_other_sessions', {
        target_user_id: userId,
        current_session_token: currentSessionToken,
      });

      if (error) throw error;

      toast.success('All other sessions signed out');
      fetchSessions(); // Refresh list

      // Log security event
      await supabase.from('security_logs').insert({
        user_id: userId,
        event_type: 'all_sessions_terminated',
        details: {
          terminated_at: new Date().toISOString(),
          method: 'sign_out_all_others',
          current_session_preserved: true,
        },
        user_agent: navigator.userAgent,
        risk_level: 'low',
      });
    } catch (error) {
      console.error('Error terminating other sessions:', error);
      toast.error('Failed to sign out other sessions');
    }
  };

  /**
   * Check if session is the current one
   */
  const isCurrentSession = (sessionToken: string): boolean => {
    return sessionToken === currentSessionToken;
  };

  return {
    sessions,
    loading,
    signOutSession,
    signOutAllOtherSessions,
    isCurrentSession,
    refetch: fetchSessions,
  };
};
