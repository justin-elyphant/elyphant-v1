import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/auth";
import { 
  updateUserPresence, 
  getUserPresence, 
  subscribeToPresence,
  type UserPresence 
} from "@/utils/enhancedMessageService";

// ⚠️ DEPRECATED: Use useUnifiedPresence from @/hooks/useUnifiedMessaging instead
console.warn("useEnhancedPresence is deprecated. Use useUnifiedPresence from @/hooks/useUnifiedMessaging instead.");

export type UserStatus = "online" | "offline" | "away";

interface EnhancedPresenceState {
  [userId: string]: UserPresence;
}

export const useEnhancedPresence = () => {
  const { user } = useAuth();
  const [presenceStates, setPresenceStates] = useState<EnhancedPresenceState>({});
  const [myStatus, setMyStatus] = useState<UserStatus>("online");
  const [isInitialized, setIsInitialized] = useState(false);

  // Update user's own presence
  const updateMyPresence = useCallback(async (
    status: UserStatus, 
    activity?: string
  ) => {
    if (!user) return;

    await updateUserPresence(status, activity);
    setMyStatus(status);
  }, [user]);

  // Get presence for a specific user
  const getUserStatus = useCallback((userId: string): {
    status: UserStatus;
    lastSeen?: string;
    activity?: string;
    isTyping?: boolean;
  } => {
    const presence = presenceStates[userId];
    
    if (presence) {
      // Consider user offline if last seen is more than 5 minutes ago
      const lastSeenTime = new Date(presence.last_seen).getTime();
      const now = new Date().getTime();
      const fiveMinutes = 5 * 60 * 1000;
      
      const isRecentlyActive = now - lastSeenTime < fiveMinutes;
      const effectiveStatus = isRecentlyActive ? presence.status : 'offline';
      
      return {
        status: effectiveStatus,
        lastSeen: presence.last_seen,
        activity: presence.current_activity,
        isTyping: !!presence.typing_in_chat_with
      };
    }
    
    return { status: "offline" };
  }, [presenceStates]);

  // Get all online users
  const getOnlineUsers = useCallback(() => {
    return Object.values(presenceStates)
      .filter(presence => {
        const lastSeenTime = new Date(presence.last_seen).getTime();
        const now = new Date().getTime();
        const fiveMinutes = 5 * 60 * 1000;
        
        return presence.status === "online" && (now - lastSeenTime < fiveMinutes);
      })
      .map(presence => presence.user_id);
  }, [presenceStates]);

  // Subscribe to a specific user's presence
  const subscribeToUserPresence = useCallback((userId: string) => {
    // Don't subscribe to mock users
    if (userId.startsWith('mock-')) {
      // Set mock presence
      setPresenceStates(prev => ({
        ...prev,
        [userId]: {
          user_id: userId,
          status: Math.random() > 0.3 ? 'online' : 'offline',
          last_seen: new Date().toISOString(),
          current_activity: undefined,
          typing_in_chat_with: undefined,
          updated_at: new Date().toISOString()
        }
      }));
      return () => {};
    }

    // Get initial presence
    getUserPresence(userId).then(presence => {
      if (presence) {
        setPresenceStates(prev => ({
          ...prev,
          [userId]: presence
        }));
      }
    });

    // Subscribe to real-time updates
    return subscribeToPresence(userId, (presence) => {
      setPresenceStates(prev => ({
        ...prev,
        [userId]: presence
      }));
    });
  }, []);

  // Initialize presence system
  useEffect(() => {
    if (!user || isInitialized) return;

    // Set initial online status
    updateMyPresence("online", "Active");

    // Handle page visibility changes
    const handleVisibilityChange = () => {
      const newStatus: UserStatus = document.hidden ? "away" : "online";
      updateMyPresence(newStatus, document.hidden ? "Away" : "Active");
    };

    // Handle beforeunload to set offline status
    const handleBeforeUnload = () => {
      // Use sendBeacon for reliable offline status update
      navigator.sendBeacon && navigator.sendBeacon('/api/user-offline', JSON.stringify({ userId: user.id }));
      updateMyPresence("offline");
    };

    // Set up event listeners
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);

    // Update presence every 2 minutes to show activity
    const presenceInterval = setInterval(() => {
      if (!document.hidden) {
        updateMyPresence(myStatus, "Active");
      }
    }, 2 * 60 * 1000);

    setIsInitialized(true);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      clearInterval(presenceInterval);
      updateMyPresence("offline");
    };
  }, [user, updateMyPresence, myStatus, isInitialized]);

  return {
    getUserStatus,
    getOnlineUsers,
    myStatus,
    updateMyPresence,
    subscribeToUserPresence,
    presenceStates,
    isInitialized
  };
};