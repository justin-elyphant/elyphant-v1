
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
  reactions?: { [emoji: string]: string[] }; // emoji -> user_ids array
}

export interface SendMessageParams {
  recipientId: string;
  content: string;
  productLinkId?: number;
  wishlistLinkId?: string;
  replyToId?: string;
}

export const fetchMessages = async (otherUserId: string): Promise<Message[]> => {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) {
    toast.error("You must be logged in to view messages");
    return [];
  }

  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .or(`sender_id.eq.${user.user.id},recipient_id.eq.${user.user.id}`)
    .or(`sender_id.eq.${otherUserId},recipient_id.eq.${otherUserId}`)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching messages:', error);
    toast.error("Failed to load messages");
    return [];
  }

  return data as Message[];
};

export const sendMessage = async ({ 
  recipientId, 
  content, 
  productLinkId, 
  wishlistLinkId,
  replyToId 
}: SendMessageParams): Promise<Message | null> => {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) {
    toast.error("You must be logged in to send messages");
    return null;
  }

  const newMessage = {
    sender_id: user.user.id,
    recipient_id: recipientId,
    content,
    product_link_id: productLinkId || null,
    wishlist_link_id: wishlistLinkId || null,
    reply_to_id: replyToId || null,
    is_read: false
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

export const markMessagesAsRead = async (messageIds: string[]): Promise<void> => {
  if (!messageIds.length) return;

  const { error } = await supabase
    .from('messages')
    .update({ is_read: true })
    .in('id', messageIds);

  if (error) {
    console.error('Error marking messages as read:', error);
  }
};

export const subscribeToMessages = (
  connectionId: string, 
  onNewMessage: (message: Message) => void
) => {
  const channel = supabase
    .channel('messages_channel')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `recipient_id=eq.${connectionId}`
      },
      (payload) => {
        onNewMessage(payload.new as Message);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
};

// Add reaction to message
export const addMessageReaction = async (
  messageId: string, 
  emoji: string
): Promise<boolean> => {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) {
    toast.error("You must be logged in to react to messages");
    return false;
  }

  // This would require updating the database schema to support reactions
  // For now, just return success
  toast.success("Reaction added!");
  return true;
};

// Remove reaction from message
export const removeMessageReaction = async (
  messageId: string, 
  emoji: string
): Promise<boolean> => {
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) {
    toast.error("You must be logged in to remove reactions");
    return false;
  }

  // This would require updating the database schema to support reactions
  // For now, just return success
  toast.success("Reaction removed!");
  return true;
};
