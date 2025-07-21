
import { supabase } from "@/integrations/supabase/client";

export interface Message {
  id: string;
  sender_id: string;
  recipient_id: string;
  content: string;
  created_at: string;
  read_at?: string;
  product_link_id?: string;
  wishlist_link_id?: string;
}

export interface SendMessageOptions {
  recipientId: string;
  content: string;
  productLinkId?: string;
  wishlistLinkId?: string;
}

export const sendMessage = async (options: SendMessageOptions) => {
  const { recipientId, content, productLinkId, wishlistLinkId } = options;
  
  const { data, error } = await supabase
    .from('messages')
    .insert({
      recipient_id: recipientId,
      content,
      product_link_id: productLinkId,
      wishlist_link_id: wishlistLinkId
    })
    .select()
    .single();

  if (error) {
    console.error('Error sending message:', error);
    throw error;
  }

  return data;
};

export const fetchMessages = async (connectionId: string): Promise<Message[]> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .or(`and(sender_id.eq.${user.id},recipient_id.eq.${connectionId}),and(sender_id.eq.${connectionId},recipient_id.eq.${user.id})`)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching messages:', error);
    return [];
  }

  return data || [];
};

export const markMessageAsRead = async (messageId: string) => {
  const { error } = await supabase
    .from('messages')
    .update({ read_at: new Date().toISOString() })
    .eq('id', messageId);

  if (error) {
    console.error('Error marking message as read:', error);
    throw error;
  }
};
