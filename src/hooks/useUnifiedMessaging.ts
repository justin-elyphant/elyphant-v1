import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/contexts/auth';
import { 
  unifiedMessagingService, 
  type UnifiedMessage, 
  type SendMessageOptions, 
  type UserPresence 
} from '@/services/UnifiedMessagingService';

// =============================================================================
// UNIFIED MESSAGING HOOK
// =============================================================================

interface UseUnifiedMessagingOptions {
  type: 'direct' | 'group';
  chatId: string; // userId for direct, groupChatId for group
}

export const useUnifiedMessaging = ({ type, chatId }: UseUnifiedMessagingOptions) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<UnifiedMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(0);
  const [presence, setPresence] = useState<UserPresence | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  
  // Refs for cleanup
  const messageUnsubscribeRef = useRef<(() => void) | null>(null);
  const presenceUnsubscribeRef = useRef<(() => void) | null>(null);
  const typingUnsubscribeRef = useRef<(() => void) | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // =============================================================================
  // MESSAGE LOADING
  // =============================================================================

  const loadMessages = useCallback(async (pageNum: number = 0, append: boolean = false) => {
    console.log('🚀 loadMessages called', { user: user?.id, chatId, type, pageNum, append });
    
    if (!user || !chatId) {
      console.log('❌ Missing user or chatId', { user: user?.id, chatId });
      return;
    }

    try {
      setLoading(true);
      console.log('📡 Starting message fetch...', { type, chatId, pageNum });
      
      let result;
      if (type === 'direct') {
        console.log('🔄 Calling fetchDirectMessages...', { chatId, pageNum });
        result = await unifiedMessagingService.fetchDirectMessages(chatId, pageNum);
        console.log('✅ fetchDirectMessages result:', result);
      } else {
        console.log('🔄 Calling fetchGroupMessages...', { chatId });
        const groupMessages = await unifiedMessagingService.fetchGroupMessages(chatId);
        result = { messages: groupMessages, hasMore: false };
        console.log('✅ fetchGroupMessages result:', result);
      }

      console.log('📝 Setting messages in state...', { 
        resultCount: result.messages.length, 
        append, 
        currentMessageCount: messages.length 
      });

      if (append) {
        setMessages(prev => [...result.messages, ...prev]);
      } else {
        setMessages(result.messages);
      }
      
      setHasMore(result.hasMore);
      setPage(pageNum);
      
      console.log('✅ Messages loaded successfully', { 
        newCount: result.messages.length, 
        hasMore: result.hasMore 
      });
    } catch (error) {
      console.error('❌ Error loading messages:', error);
    } finally {
      setLoading(false);
    }
  }, [user, chatId, type]);

  const loadMoreMessages = useCallback(() => {
    if (hasMore && !loading) {
      loadMessages(page + 1, true);
    }
  }, [hasMore, loading, page, loadMessages]);

  // =============================================================================
  // MESSAGE SENDING
  // =============================================================================

  const sendMessage = useCallback(async (options: Omit<SendMessageOptions, 'recipientId' | 'groupChatId'>) => {
    if (!user || !chatId) return null;

    const fullOptions: SendMessageOptions = {
      ...options,
      [type === 'direct' ? 'recipientId' : 'groupChatId']: chatId
    };

    try {
      const message = await unifiedMessagingService.sendMessage(fullOptions);
      
      if (message) {
        // Add optimistic message to UI
        setMessages(prev => [...prev, message]);
      }
      
      return message;
    } catch (error) {
      console.error('Error sending message:', error);
      return null;
    }
  }, [user, chatId, type]);

  // =============================================================================
  // MESSAGE ACTIONS
  // =============================================================================

  const markAsRead = useCallback(async (messageIds: string[]) => {
    await unifiedMessagingService.markMessagesAsRead(messageIds);
  }, []);

  const addReaction = useCallback(async (messageId: string, emoji: string) => {
    return await unifiedMessagingService.addReaction(messageId, emoji);
  }, []);

  // =============================================================================
  // PRESENCE & TYPING
  // =============================================================================

  const updatePresence = useCallback(async (status: 'online' | 'offline' | 'away', activity?: string) => {
    await unifiedMessagingService.updatePresence(status, activity);
  }, []);

  const startTyping = useCallback(async () => {
    if (type === 'direct' && user) {
      await unifiedMessagingService.setTypingStatus(chatId, true);
      
      // Auto-stop typing after 3 seconds
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      typingTimeoutRef.current = setTimeout(async () => {
        await unifiedMessagingService.setTypingStatus(chatId, false);
      }, 3000);
    }
  }, [type, user, chatId]);

  const stopTyping = useCallback(async () => {
    if (type === 'direct' && user) {
      await unifiedMessagingService.setTypingStatus(chatId, false);
      
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }
    }
  }, [type, user, chatId]);

  // =============================================================================
  // REAL-TIME SUBSCRIPTIONS
  // =============================================================================

  useEffect(() => {
    if (!user || !chatId) return;

    // Load initial messages
    loadMessages();

    // Set up real-time subscriptions
    if (type === 'direct') {
      // Direct message subscription
      messageUnsubscribeRef.current = unifiedMessagingService.subscribeToDirectMessages(
        user.id,
        chatId,
        (newMessage) => {
          setMessages(prev => {
            // Avoid duplicates
            if (prev.some(msg => msg.id === newMessage.id)) return prev;
            return [...prev, newMessage];
          });
        },
        (updatedMessage) => {
          setMessages(prev => 
            prev.map(msg => msg.id === updatedMessage.id ? updatedMessage : msg)
          );
        }
      );

      // Presence subscription
      presenceUnsubscribeRef.current = unifiedMessagingService.subscribeToPresence(
        chatId,
        setPresence
      );

      // Typing subscription
      typingUnsubscribeRef.current = unifiedMessagingService.subscribeToTyping(
        user.id,
        chatId,
        setIsTyping
      );
    } else {
      // Group message subscription
      messageUnsubscribeRef.current = unifiedMessagingService.subscribeToGroupMessages(
        chatId,
        (newMessage) => {
          setMessages(prev => {
            // Avoid duplicates
            if (prev.some(msg => msg.id === newMessage.id)) return prev;
            return [...prev, newMessage];
          });
        }
      );
    }

    // Cleanup function
    return () => {
      messageUnsubscribeRef.current?.();
      presenceUnsubscribeRef.current?.();
      typingUnsubscribeRef.current?.();
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [user, chatId, type, loadMessages]);

  // =============================================================================
  // ONLINE/OFFLINE HANDLING
  // =============================================================================

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      updatePresence('online');
    };

    const handleOffline = () => {
      setIsOnline(false);
      updatePresence('offline');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [updatePresence]);

  // =============================================================================
  // RETURN INTERFACE
  // =============================================================================

  return {
    // Message data
    messages,
    loading,
    hasMore,
    
    // Message actions
    sendMessage,
    loadMoreMessages,
    markAsRead,
    addReaction,
    
    // Presence & typing
    presence,
    isTyping,
    updatePresence,
    startTyping,
    stopTyping,
    
    // Connection status
    isOnline,
    
    // Utils
    refresh: () => loadMessages()
  };
};

// =============================================================================
// SPECIALIZED HOOKS
// =============================================================================

export const useDirectMessaging = (userId: string) => {
  return useUnifiedMessaging({ type: 'direct', chatId: userId });
};

export const useGroupMessaging = (groupChatId: string) => {
  return useUnifiedMessaging({ type: 'group', chatId: groupChatId });
};

// =============================================================================
// UNIFIED PRESENCE HOOK
// =============================================================================

export const useUnifiedPresence = () => {
  const { user } = useAuth();
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const [userStatuses, setUserStatuses] = useState<Map<string, UserPresence>>(new Map());

  const getUserStatus = useCallback((userId: string) => {
    const status = userStatuses.get(userId);
    if (!status) return { status: 'offline' as const, lastSeen: undefined };

    // Consider user online if last seen within 5 minutes
    const lastSeenTime = new Date(status.last_seen).getTime();
    const now = Date.now();
    const isRecent = now - lastSeenTime < 5 * 60 * 1000; // 5 minutes

    return {
      status: isRecent ? status.status : 'offline' as const,
      lastSeen: status.last_seen,
      activity: status.current_activity
    };
  }, [userStatuses]);

  const getOnlineUsers = useCallback(() => {
    return Array.from(onlineUsers);
  }, [onlineUsers]);

  const subscribeToUserPresence = useCallback((userId: string) => {
    return unifiedMessagingService.subscribeToPresence(userId, (presence) => {
      setUserStatuses(prev => new Map(prev.set(userId, presence)));
      
      if (presence.status === 'online') {
        setOnlineUsers(prev => new Set(prev.add(userId)));
      } else {
        setOnlineUsers(prev => {
          const newSet = new Set(prev);
          newSet.delete(userId);
          return newSet;
        });
      }
    });
  }, []);

  const updateMyPresence = useCallback(async (status: 'online' | 'offline' | 'away', activity?: string) => {
    await unifiedMessagingService.updatePresence(status, activity);
  }, []);

  // Initialize presence on mount
  useEffect(() => {
    if (user) {
      updateMyPresence('online');
    }
  }, [user, updateMyPresence]);

  return {
    getUserStatus,
    getOnlineUsers,
    subscribeToUserPresence,
    updateMyPresence,
    onlineUsers: getOnlineUsers(),
    userStatuses: userStatuses
  };
};