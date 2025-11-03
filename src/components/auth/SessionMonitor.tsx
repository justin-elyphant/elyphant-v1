import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

/**
 * SessionMonitor - Real-time session validation component
 * Monitors for account switching bugs and session mismatches
 * Runs validation every 5 seconds
 */
export const SessionMonitor = () => {
  const navigate = useNavigate();
  const [lastCheckedUserId, setLastCheckedUserId] = useState<string | null>(null);

  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    const checkSessionIntegrity = async () => {
      try {
        // Get current session from Supabase
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Session check error:', error);
          return;
        }

        // No session - user is logged out, this is fine
        if (!session?.user) {
          setLastCheckedUserId(null);
          return;
        }

        const sessionUserId = session.user.id;
        const storedUserId = localStorage.getItem('userId');

        // First check - just record the user ID
        if (!lastCheckedUserId) {
          setLastCheckedUserId(sessionUserId);
          return;
        }

        // Detect user ID change without proper sign out
        if (lastCheckedUserId !== sessionUserId) {
          console.error('CRITICAL: Unexpected user account switch detected!', {
            previous: lastCheckedUserId,
            current: sessionUserId,
            stored: storedUserId,
            timestamp: new Date().toISOString()
          });

          // Log critical security event
          await supabase.from('security_logs').insert({
            user_id: sessionUserId,
            event_type: 'unexpected_account_switch',
            details: {
              previous_user_id: lastCheckedUserId,
              current_user_id: sessionUserId,
              stored_user_id: storedUserId,
              detection_time: new Date().toISOString()
            },
            user_agent: navigator.userAgent,
            risk_level: 'critical'
          });

          // Force sign out and reload
          toast.error('Session security issue detected. Please sign in again.');
          await supabase.auth.signOut();
          localStorage.clear();
          navigate('/auth');
          window.location.reload();
          return;
        }

        // Validate localStorage matches session
        if (storedUserId && storedUserId !== sessionUserId) {
          console.error('CRITICAL: localStorage user mismatch!', {
            stored: storedUserId,
            session: sessionUserId
          });

          // Log and fix
          await supabase.from('security_logs').insert({
            user_id: sessionUserId,
            event_type: 'localstorage_mismatch',
            details: {
              stored_user_id: storedUserId,
              session_user_id: sessionUserId,
              detection_time: new Date().toISOString()
            },
            user_agent: navigator.userAgent,
            risk_level: 'high'
          });

          toast.error('Session sync issue detected. Refreshing...');
          await supabase.auth.signOut();
          localStorage.clear();
          window.location.reload();
        }
      } catch (error) {
        console.error('Session monitor error:', error);
      }
    };

    // Check immediately on mount
    checkSessionIntegrity();

    // Then check every 5 seconds
    intervalId = setInterval(checkSessionIntegrity, 5000);

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [lastCheckedUserId, navigate]);

  // This component doesn't render anything
  return null;
};
