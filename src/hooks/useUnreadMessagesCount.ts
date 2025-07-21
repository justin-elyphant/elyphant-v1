import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth';
import { supabase } from '@/integrations/supabase/client';

export const useUnreadMessagesCount = () => {
  const [unreadCount, setUnreadCount] = useState(0);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      setUnreadCount(0);
      return;
    }

    const fetchUnreadCount = async () => {
      try {
        const { data, error } = await supabase
          .from('messages')
          .select('id')
          .eq('recipient_id', user.id)
          .eq('is_read', false);

        if (error) {
          console.error('Error fetching unread messages count:', error);
          return;
        }

        setUnreadCount(data?.length || 0);
      } catch (error) {
        console.error('Error fetching unread messages count:', error);
      }
    };

    fetchUnreadCount();

    // Subscribe to real-time changes for messages
    const channel = supabase
      .channel('unread-messages-count')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
          filter: `recipient_id=eq.${user.id}`,
        },
        () => {
          fetchUnreadCount();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  return unreadCount;
};