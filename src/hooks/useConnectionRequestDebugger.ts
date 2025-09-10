import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/auth';

/**
 * Debug hook that monitors connection request operations in real-time
 * Only active in development mode
 */
export const useConnectionRequestDebugger = () => {
  const { user } = useAuth();

  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') return;

    console.log('🔧 [ConnectionDebugger] Initializing connection request debugger');
    
    // Monitor auth state changes
    const authStateChangeHandler = (event: string, session: any) => {
      console.log('🔧 [ConnectionDebugger] Auth state change:', { event, userId: session?.user?.id });
    };

    // Set up real-time listener for user_connections table
    const channel = supabase
      .channel('connection-debug')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_connections'
        },
        (payload) => {
          console.log('🔧 [ConnectionDebugger] Database change detected:', payload);
          
          if (payload.eventType === 'INSERT') {
            console.log('🔧 [ConnectionDebugger] New connection request created:', {
              from: payload.new.user_id,
              to: payload.new.connected_user_id,
              status: payload.new.status,
              type: payload.new.relationship_type
            });
          }
        }
      )
      .subscribe((status) => {
        console.log('🔧 [ConnectionDebugger] Subscription status:', status);
      });

    // Monitor auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(authStateChangeHandler);

    // Periodic connection status check
    const intervalId = setInterval(async () => {
      if (!user) return;
      
      try {
        const { data: connections, error } = await supabase
          .from('user_connections')
          .select('*')
          .or(`user_id.eq.${user.id},connected_user_id.eq.${user.id}`)
          .order('created_at', { ascending: false })
          .limit(5);

        if (error) {
          console.error('🔧 [ConnectionDebugger] Error fetching connections:', error);
        } else {
          console.log('🔧 [ConnectionDebugger] Recent connections for user:', connections);
        }
      } catch (error) {
        console.error('🔧 [ConnectionDebugger] Unexpected error:', error);
      }
    }, 30000); // Check every 30 seconds

    return () => {
      console.log('🔧 [ConnectionDebugger] Cleaning up debugger');
      channel.unsubscribe();
      subscription.unsubscribe();
      clearInterval(intervalId);
    };
  }, [user]);

  // Debug function to manually check connection status
  const debugConnectionStatus = async (targetUserId: string) => {
    if (!user) {
      console.log('🔧 [ConnectionDebugger] No authenticated user for debug check');
      return;
    }

    console.log('🔧 [ConnectionDebugger] Manual connection status check:', { 
      currentUser: user.id, 
      targetUser: targetUserId 
    });

    try {
      // Check both directions
      const { data: outgoing } = await supabase
        .from('user_connections')
        .select('*')
        .eq('user_id', user.id)
        .eq('connected_user_id', targetUserId);

      const { data: incoming } = await supabase
        .from('user_connections')
        .select('*')
        .eq('user_id', targetUserId)
        .eq('connected_user_id', user.id);

      console.log('🔧 [ConnectionDebugger] Connection check results:', {
        outgoing: outgoing || [],
        incoming: incoming || []
      });

      // Check for blocks
      const { data: blocks } = await supabase
        .from('blocked_users')
        .select('*')
        .or(`and(blocker_id.eq.${user.id},blocked_id.eq.${targetUserId}),and(blocker_id.eq.${targetUserId},blocked_id.eq.${user.id})`);

      console.log('🔧 [ConnectionDebugger] Block check results:', blocks || []);

    } catch (error) {
      console.error('🔧 [ConnectionDebugger] Error in manual check:', error);
    }
  };

  return { debugConnectionStatus };
};