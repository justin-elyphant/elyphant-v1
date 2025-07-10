import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface Message {
  id: string;
  sender_id: string;
  recipient_id: string;
  content: string;
  product_link_id: number | null;
  wishlist_link_id: string | null;
  reply_to_id: string | null;
  is_read: boolean;
  created_at: string;
  reactions: { [emoji: string]: string[] };
  message_type: 'text' | 'gift' | 'system';
  delivery_status: 'sending' | 'sent' | 'delivered' | 'read';
}

export interface SendMessageParams {
  recipientId: string;
  content: string;
  productLinkId?: number;
  wishlistLinkId?: string;
  replyToId?: string;
  messageType?: 'text' | 'gift';
}

export interface UserPresence {
  user_id: string;
  status: 'online' | 'offline' | 'away';
  last_seen: string;
  current_activity?: string;
  typing_in_chat_with?: string;
  updated_at: string;
}

export interface TypingIndicator {
  user_id: string;
  chat_with_user_id: string;
  is_typing: boolean;
  updated_at: string;
}

// Enhanced message fetching with proper user filtering
export const fetchMessages = async (otherUserId: string): Promise<Message[]> => {
  // Handle mock connections for demo
  if (otherUserId.startsWith('mock-')) {
    return generateMockMessages(otherUserId);
  }

  const { data: user } = await supabase.auth.getUser();
  if (!user.user) {
    toast.error("You must be logged in to view messages");
    return [];
  }

  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .or(`and(sender_id.eq.${user.user.id},recipient_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},recipient_id.eq.${user.user.id})`)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching messages:', error);
    toast.error("Failed to load messages");
    return [];
  }

  return data as Message[];
};

// Enhanced message sending with delivery status
export const sendMessage = async ({ 
  recipientId, 
  content, 
  productLinkId, 
  wishlistLinkId,
  replyToId,
  messageType = 'text'
}: SendMessageParams): Promise<Message | null> => {
  // Handle mock connections
  if (recipientId.startsWith('mock-')) {
    return sendMockMessage(recipientId, content, productLinkId, wishlistLinkId, replyToId);
  }

  const { data: user } = await supabase.auth.getUser();
  if (!user.user) {
    toast.error("You must be logged in to send messages");
    return null;
  }

  // Verify users are connected
  const { data: connection } = await supabase
    .from('user_connections')
    .select('*')
    .or(`and(user_id.eq.${user.user.id},connected_user_id.eq.${recipientId}),and(user_id.eq.${recipientId},connected_user_id.eq.${user.user.id})`)
    .eq('status', 'accepted')
    .single();

  if (!connection) {
    toast.error("You can only message connected users");
    return null;
  }

  const newMessage = {
    sender_id: user.user.id,
    recipient_id: recipientId,
    content,
    product_link_id: productLinkId || null,
    wishlist_link_id: wishlistLinkId || null,
    reply_to_id: replyToId || null,
    message_type: messageType,
    delivery_status: 'sent',
    is_read: false,
    reactions: {}
  };

  const { data, error } = await supabase
    .from('messages')
    .insert([newMessage])
    .select()
    .single();

  if (error) {
    console.error('Error sending message:', error);
    toast.error("Failed to send message");
    return null;
  }

  return data as Message;
};

// Enhanced real-time message subscription
export const subscribeToMessages = (
  currentUserId: string,
  otherUserId: string,
  onNewMessage: (message: Message) => void,
  onMessageUpdate: (message: Message) => void
) => {
  if (otherUserId.startsWith('mock-')) {
    return () => {}; // Skip for mock connections
  }

  const channel = supabase
    .channel(`messages_${currentUserId}_${otherUserId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `or(and(sender_id.eq.${currentUserId},recipient_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},recipient_id.eq.${currentUserId}))`
      },
      (payload) => {
        onNewMessage(payload.new as Message);
      }
    )
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'messages',
        filter: `or(and(sender_id.eq.${currentUserId},recipient_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},recipient_id.eq.${currentUserId}))`
      },
      (payload) => {
        onMessageUpdate(payload.new as Message);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
};

// User presence management
export const updateUserPresence = async (
  status: 'online' | 'offline' | 'away',
  activity?: string
): Promise<void> => {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) return;

  const { error } = await supabase
    .from('user_presence')
    .upsert({
      user_id: user.user.id,
      status,
      current_activity: activity,
      last_seen: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });

  if (error) {
    console.error('Error updating presence:', error);
  }
};

// Get user presence
export const getUserPresence = async (userId: string): Promise<UserPresence | null> => {
  const { data, error } = await supabase
    .from('user_presence')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error) {
    return null;
  }

  return data as UserPresence;
};

// Subscribe to user presence changes
export const subscribeToPresence = (
  userId: string,
  onPresenceChange: (presence: UserPresence) => void
) => {
  const channel = supabase
    .channel(`presence_${userId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'user_presence',
        filter: `user_id=eq.${userId}`
      },
      (payload) => {
        if (payload.new) {
          onPresenceChange(payload.new as UserPresence);
        }
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
};

// Typing indicators
export const setTypingStatus = async (
  chatWithUserId: string,
  isTyping: boolean
): Promise<void> => {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) return;

  const { error } = await supabase
    .from('typing_indicators')
    .upsert({
      user_id: user.user.id,
      chat_with_user_id: chatWithUserId,
      is_typing: isTyping,
      updated_at: new Date().toISOString()
    });

  if (error) {
    console.error('Error updating typing status:', error);
  }
};

// Subscribe to typing indicators
export const subscribeToTyping = (
  currentUserId: string,
  otherUserId: string,
  onTypingChange: (isTyping: boolean) => void
) => {
  const channel = supabase
    .channel(`typing_${currentUserId}_${otherUserId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'typing_indicators',
        filter: `and(user_id.eq.${otherUserId},chat_with_user_id.eq.${currentUserId})`
      },
      (payload) => {
        if (payload.new) {
          const indicator = payload.new as TypingIndicator;
          onTypingChange(indicator.is_typing);
        }
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
};

// Enhanced message reactions with real database support
export const addMessageReaction = async (
  messageId: string, 
  emoji: string
): Promise<boolean> => {
  if (messageId.startsWith('mock-')) {
    toast.success("Reaction added!");
    return true;
  }

  const { data: user } = await supabase.auth.getUser();
  if (!user.user) {
    toast.error("You must be logged in to react to messages");
    return false;
  }

  // Get current message
  const { data: message, error: fetchError } = await supabase
    .from('messages')
    .select('reactions')
    .eq('id', messageId)
    .single();

  if (fetchError) {
    console.error('Error fetching message:', fetchError);
    return false;
  }

  const currentReactions = message.reactions || {};
  const emojiReactions = currentReactions[emoji] || [];
  
  // Add user to reaction if not already present
  if (!emojiReactions.includes(user.user.id)) {
    emojiReactions.push(user.user.id);
    currentReactions[emoji] = emojiReactions;

    const { error } = await supabase
      .from('messages')
      .update({ reactions: currentReactions })
      .eq('id', messageId);

    if (error) {
      console.error('Error adding reaction:', error);
      return false;
    }

    toast.success("Reaction added!");
    return true;
  }

  return false;
};

// Remove message reaction
export const removeMessageReaction = async (
  messageId: string, 
  emoji: string
): Promise<boolean> => {
  if (messageId.startsWith('mock-')) {
    toast.success("Reaction removed!");
    return true;
  }

  const { data: user } = await supabase.auth.getUser();
  if (!user.user) return false;

  // Get current message
  const { data: message, error: fetchError } = await supabase
    .from('messages')
    .select('reactions')
    .eq('id', messageId)
    .single();

  if (fetchError) return false;

  const currentReactions = message.reactions || {};
  const emojiReactions = currentReactions[emoji] || [];
  
  // Remove user from reaction
  const updatedReactions = emojiReactions.filter((id: string) => id !== user.user.id);
  
  if (updatedReactions.length === 0) {
    delete currentReactions[emoji];
  } else {
    currentReactions[emoji] = updatedReactions;
  }

  const { error } = await supabase
    .from('messages')
    .update({ reactions: currentReactions })
    .eq('id', messageId);

  if (error) return false;

  toast.success("Reaction removed!");
  return true;
};

// Mark messages as read with delivery status update
export const markMessagesAsRead = async (messageIds: string[]): Promise<void> => {
  if (!messageIds.length) return;
  
  const realMessageIds = messageIds.filter(id => !id.startsWith('mock-'));
  if (!realMessageIds.length) return;

  const { error } = await supabase
    .from('messages')
    .update({ 
      is_read: true,
      delivery_status: 'read'
    })
    .in('id', realMessageIds);

  if (error) {
    console.error('Error marking messages as read:', error);
  }
};

// Mock message functions for demo purposes
const generateMockMessages = (connectionId: string): Message[] => {
  return [
    {
      id: `mock-msg-${connectionId}-1`,
      sender_id: connectionId,
      recipient_id: "current-user",
      content: "Hey! How's it going?",
      product_link_id: null,
      wishlist_link_id: null,
      reply_to_id: null,
      is_read: true,
      created_at: new Date(Date.now() - 3600000).toISOString(),
      reactions: {},
      message_type: 'text',
      delivery_status: 'read'
    },
    {
      id: `mock-msg-${connectionId}-2`,
      sender_id: "current-user",
      recipient_id: connectionId,
      content: "Good! Thanks for asking. How about you?",
      product_link_id: null,
      wishlist_link_id: null,
      reply_to_id: `mock-msg-${connectionId}-1`,
      is_read: true,
      created_at: new Date(Date.now() - 3000000).toISOString(),
      reactions: { "👍": ["current-user"] },
      message_type: 'text',
      delivery_status: 'read'
    }
  ];
};

const sendMockMessage = async (
  recipientId: string,
  content: string,
  productLinkId?: number,
  wishlistLinkId?: string,
  replyToId?: string
): Promise<Message> => {
  const mockMessage: Message = {
    id: `mock-msg-${Date.now()}`,
    sender_id: "current-user",
    recipient_id: recipientId,
    content,
    product_link_id: productLinkId || null,
    wishlist_link_id: wishlistLinkId || null,
    reply_to_id: replyToId || null,
    is_read: false,
    created_at: new Date().toISOString(),
    reactions: {},
    message_type: 'text',
    delivery_status: 'sent'
  };
  
  toast.success("Message sent!");
  return mockMessage;
};