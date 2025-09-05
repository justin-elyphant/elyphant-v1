import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/auth";
import { supabase } from "@/integrations/supabase/client";

export const useUnreadMessagesCount = () => {
  const [count, setCount] = useState(0);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      setCount(0);
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
          console.error('Error fetching unread messages:', error);
          setCount(0);
          return;
        }

        setCount(data?.length || 0);
      } catch (error) {
        console.error('Error fetching unread messages:', error);
        setCount(0);
      }
    };

    // Initial fetch
    fetchUnreadCount();

    // Set up real-time subscription for new messages
    const channel = supabase
      .channel(`unread-messages-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `recipient_id=eq.${user.id}`
        },
        (payload) => {
          console.log('🔔 New message received:', payload);
          // Increment count for new unread message
          setCount(prev => prev + 1);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `recipient_id=eq.${user.id}`
        },
        (payload) => {
          console.log('📖 Message read status updated:', payload);
          // Refetch count when messages are marked as read
          fetchUnreadCount();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  return count;
};
