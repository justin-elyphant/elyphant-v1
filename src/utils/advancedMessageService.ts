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
  attachment_url?: string;
  attachment_type?: string;
  attachment_name?: string;
}

export interface SendMessageParams {
  recipientId: string;
  content: string;
  productLinkId?: number;
  wishlistLinkId?: string;
  replyToId?: string;
  messageType?: 'text' | 'gift';
  attachment?: File;
}

// Enhanced pagination support
export const fetchMessages = async (
  otherUserId: string, 
  page: number = 0, 
  limit: number = 50
): Promise<{ messages: Message[]; hasMore: boolean }> => {
  if (otherUserId.startsWith('mock-')) {
    return { 
      messages: generateMockMessages(otherUserId), 
      hasMore: false 
    };
  }

  const { data: user } = await supabase.auth.getUser();
  if (!user.user) {
    toast.error("You must be logged in to view messages");
    return { messages: [], hasMore: false };
  }

  const offset = page * limit;
  
  const { data, error, count } = await supabase
    .from('messages')
    .select('*', { count: 'exact' })
    .or(`and(sender_id.eq.${user.user.id},recipient_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},recipient_id.eq.${user.user.id})`)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error('Error fetching messages:', error);
    toast.error("Failed to load messages");
    return { messages: [], hasMore: false };
  }

  const messages = (data as Message[]).reverse(); // Reverse to show oldest first
  const hasMore = count ? offset + limit < count : false;

  return { messages, hasMore };
};

// Rate limiting check
export const checkRateLimit = async (): Promise<boolean> => {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) return false;

  const { data, error } = await supabase
    .rpc('check_message_rate_limit', { sender_uuid: user.user.id });

  if (error) {
    console.error('Rate limit check failed:', error);
    return true; // Allow message if check fails
  }

  return data as boolean;
};

// File upload for attachments
export const uploadAttachment = async (
  file: File,
  messageId: string
): Promise<string | null> => {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) return null;

  const fileExt = file.name.split('.').pop();
  const fileName = `${user.user.id}/${messageId}/${Date.now()}.${fileExt}`;

  const { data, error } = await supabase.storage
    .from('message-attachments')
    .upload(fileName, file);

  if (error) {
    console.error('File upload failed:', error);
    toast.error("Failed to upload attachment");
    return null;
  }

  const { data: { publicUrl } } = supabase.storage
    .from('message-attachments')
    .getPublicUrl(data.path);

  return publicUrl;
};

// Enhanced send message with rate limiting and attachments
export const sendMessage = async ({ 
  recipientId, 
  content, 
  productLinkId, 
  wishlistLinkId,
  replyToId,
  messageType = 'text',
  attachment
}: SendMessageParams): Promise<Message | null> => {
  if (recipientId.startsWith('mock-')) {
    return sendMockMessage(recipientId, content, productLinkId, wishlistLinkId, replyToId);
  }

  const { data: user } = await supabase.auth.getUser();
  if (!user.user) {
    toast.error("You must be logged in to send messages");
    return null;
  }

  // Check rate limiting
  const canSend = await checkRateLimit();
  if (!canSend) {
    toast.error("Rate limit exceeded. Please wait before sending more messages.");
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

  // Create message ID for potential attachment
  const messageId = crypto.randomUUID();
  
  // Upload attachment if provided
  let attachmentUrl = null;
  let attachmentType = null;
  let attachmentName = null;
  
  if (attachment) {
    attachmentUrl = await uploadAttachment(attachment, messageId);
    if (!attachmentUrl) {
      return null; // Upload failed
    }
    attachmentType = attachment.type;
    attachmentName = attachment.name;
  }

  const newMessage = {
    id: messageId,
    sender_id: user.user.id,
    recipient_id: recipientId,
    content,
    product_link_id: productLinkId || null,
    wishlist_link_id: wishlistLinkId || null,
    reply_to_id: replyToId || null,
    message_type: messageType,
    delivery_status: 'sent',
    is_read: false,
    reactions: {},
    attachment_url: attachmentUrl,
    attachment_type: attachmentType,
    attachment_name: attachmentName
  };

  // Try to send immediately, queue if offline
  try {
    const { data, error } = await supabase
      .from('messages')
      .insert([newMessage])
      .select()
      .single();

    if (error) {
      // Queue message for later if send fails
      await queueOfflineMessage(newMessage);
      throw error;
    }

    return data as Message;
  } catch (error) {
    console.error('Error sending message:', error);
    toast.error("Message queued for when you're back online");
    return newMessage as Message;
  }
};

// Offline message queuing
export const queueOfflineMessage = async (message: any) => {
  const { error } = await supabase
    .from('offline_message_queue')
    .insert([{
      user_id: message.sender_id,
      recipient_id: message.recipient_id,
      content: message.content,
      message_type: message.message_type,
      attachment_url: message.attachment_url,
      attachment_type: message.attachment_type,
      attachment_name: message.attachment_name
    }]);

  if (error) {
    console.error('Failed to queue message:', error);
  }
};

// Process offline message queue
export const processOfflineQueue = async () => {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) return;

  const { data: queuedMessages, error } = await supabase
    .from('offline_message_queue')
    .select('*')
    .eq('user_id', user.user.id)
    .eq('status', 'pending')
    .lt('retry_count', 3);

  if (error || !queuedMessages?.length) return;

  for (const queued of queuedMessages) {
    try {
      const { error: sendError } = await supabase
        .from('messages')
        .insert([{
          sender_id: queued.user_id,
          recipient_id: queued.recipient_id,
          content: queued.content,
          message_type: queued.message_type,
          attachment_url: queued.attachment_url,
          attachment_type: queued.attachment_type,
          attachment_name: queued.attachment_name,
          delivery_status: 'sent',
          is_read: false,
          reactions: {}
        }]);

      if (sendError) {
        // Increment retry count
        await supabase
          .from('offline_message_queue')
          .update({ 
            retry_count: queued.retry_count + 1,
            last_retry_at: new Date().toISOString(),
            error_message: sendError.message
          })
          .eq('id', queued.id);
      } else {
        // Mark as sent
        await supabase
          .from('offline_message_queue')
          .update({ status: 'sent' })
          .eq('id', queued.id);
      }
    } catch (err) {
      console.error('Failed to process queued message:', err);
    }
  }
};

// Set up online/offline listeners
export const setupOfflineSupport = () => {
  const handleOnline = () => {
    processOfflineQueue();
    toast.success("Back online! Sending queued messages...");
  };

  const handleOffline = () => {
    toast.info("You're offline. Messages will be queued and sent when you're back online.");
  };

  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);

  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
  };
};

// Enhanced subscriptions (keeping existing functionality)
export const subscribeToMessages = (
  currentUserId: string,
  otherUserId: string,
  onNewMessage: (message: Message) => void,
  onMessageUpdate: (message: Message) => void
) => {
  if (otherUserId.startsWith('mock-')) {
    return () => {};
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

// Keep all existing functions for backward compatibility
export * from "./enhancedMessageService";

// Mock functions for demo (unchanged)
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
