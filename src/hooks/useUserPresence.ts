
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/auth";
import type { RealtimePresenceState } from "@supabase/supabase-js";

export type UserStatus = "online" | "offline" | "away";

interface PresenceState {
  user_id: string;
  status: UserStatus;
  last_seen: string;
  username?: string;
}

export const useUserPresence = () => {
  const { user } = useAuth();
  const [presenceStates, setPresenceStates] = useState<RealtimePresenceState<PresenceState>>({});
  const [myStatus, setMyStatus] = useState<UserStatus>("online");

  useEffect(() => {
    if (!user) return;

    const channel = supabase.channel('user_presence');

    // Track current user's presence
    const trackPresence = async () => {
      const presenceData: PresenceState = {
        user_id: user.id,
        status: myStatus,
        last_seen: new Date().toISOString(),
        username: user.email?.split('@')[0] || 'Unknown'
      };

      await channel.track(presenceData);
    };

    // Listen for presence changes
    channel
      .on('presence', { event: 'sync' }, () => {
        const newState = channel.presenceState<PresenceState>();
        setPresenceStates(newState);
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        console.log('User joined:', key, newPresences);
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        console.log('User left:', key, leftPresences);
      });

    // Subscribe and track presence
    channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        await trackPresence();
      }
    });

    // Handle page visibility changes
    const handleVisibilityChange = () => {
      const newStatus: UserStatus = document.hidden ? "away" : "online";
      setMyStatus(newStatus);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Handle beforeunload to set offline status
    const handleBeforeUnload = () => {
      setMyStatus("offline");
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      supabase.removeChannel(channel);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [user, myStatus]);

  // Get status for a specific user
  const getUserStatus = (userId: string): { status: UserStatus; lastSeen?: string } => {
    const userPresences = Object.values(presenceStates).flat();
    const userPresence = userPresences.find(p => p.user_id === userId);
    
    if (userPresence) {
      return {
        status: userPresence.status,
        lastSeen: userPresence.last_seen
      };
    }
    
    return { status: "offline" };
  };

  // Get all online users
  const getOnlineUsers = () => {
    return Object.values(presenceStates)
      .flat()
      .filter(p => p.status === "online")
      .map(p => p.user_id);
  };

  return {
    getUserStatus,
    getOnlineUsers,
    myStatus,
    setMyStatus,
    presenceStates
  };
};
