import { supabase } from "@/integrations/supabase/client";

export interface GroupChat {
  id: string;
  name: string;
  description?: string;
  creator_id: string;
  chat_type: string;
  is_active: boolean;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
  members?: GroupChatMember[];
  last_message?: {
    content: string;
    created_at: string;
    sender_name: string;
  };
}

export interface GroupChatMember {
  id: string;
  group_chat_id: string;
  user_id: string;
  role: 'admin' | 'member' | 'viewer';
  can_invite: boolean;
  can_manage_gifts: boolean;
  joined_at: string;
  last_seen_at?: string;
  profile?: {
    name: string;
    profile_image?: string;
  };
}

export interface CreateGroupChatParams {
  name: string;
  description?: string;
  chat_type?: string;
  member_ids: string[];
}

export interface GroupMessage extends Omit<Message, 'recipient_id'> {
  group_chat_id: string;
  message_thread_id?: string;
  mentioned_users?: string[];
}

export interface Message {
  id: string;
  sender_id: string;
  recipient_id?: string;
  content: string;
  created_at: string;
  is_read: boolean;
  reactions?: Record<string, string[]>;
  message_type?: string;
  group_chat_id?: string;
  message_thread_id?: string;
  mentioned_users?: string[];
}

// Create a new group chat
export const createGroupChat = async ({ name, description, chat_type = 'general', member_ids }: CreateGroupChatParams): Promise<GroupChat | null> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // Create the group chat
    const { data: groupChat, error: chatError } = await supabase
      .from('group_chats')
      .insert({
        name,
        description,
        chat_type,
        creator_id: user.id
      })
      .select()
      .single();

    if (chatError) throw chatError;

    // Add creator as admin
    const members = [
      {
        group_chat_id: groupChat.id,
        user_id: user.id,
        role: 'admin',
        can_invite: true,
        can_manage_gifts: true
      },
      // Add other members
      ...member_ids.filter(id => id !== user.id).map(user_id => ({
        group_chat_id: groupChat.id,
        user_id,
        role: 'member',
        can_invite: false,
        can_manage_gifts: false
      }))
    ];

    const { error: membersError } = await supabase
      .from('group_chat_members')
      .insert(members);

    if (membersError) throw membersError;

    return groupChat;
  } catch (error) {
    console.error('Error creating group chat:', error);
    return null;
  }
};

// Get user's group chats
export const getUserGroupChats = async (): Promise<GroupChat[]> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    const { data, error } = await supabase
      .from('group_chats')
      .select(`
        *,
        members:group_chat_members(
          id,
          user_id,
          role,
          can_invite,
          can_manage_gifts,
          joined_at,
          profile:profiles(name, profile_image)
        )
      `)
      .eq('group_chat_members.user_id', user.id)
      .eq('is_active', true)
      .order('updated_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching group chats:', error);
    return [];
  }
};

// Send message to group
export const sendGroupMessage = async (groupChatId: string, content: string, replyToId?: string, mentionedUsers?: string[]): Promise<GroupMessage | null> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('messages')
      .insert({
        sender_id: user.id,
        group_chat_id: groupChatId,
        content,
        message_thread_id: replyToId,
        mentioned_users: mentionedUsers,
        message_type: 'text'
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error sending group message:', error);
    return null;
  }
};

// Get group messages
export const fetchGroupMessages = async (groupChatId: string): Promise<GroupMessage[]> => {
  try {
    const { data, error } = await supabase
      .from('messages')
      .select(`
        *,
        sender:profiles!messages_sender_id_fkey(name, profile_image)
      `)
      .eq('group_chat_id', groupChatId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching group messages:', error);
    return [];
  }
};

// Subscribe to group messages
export const subscribeToGroupMessages = (groupChatId: string, onNewMessage: (message: GroupMessage) => void): (() => void) => {
  const channel = supabase
    .channel(`group-messages-${groupChatId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `group_chat_id=eq.${groupChatId}`
      },
      (payload) => onNewMessage(payload.new as GroupMessage)
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
};

// Add member to group
export const addGroupMember = async (groupChatId: string, userId: string, role: 'member' | 'admin' = 'member'): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('group_chat_members')
      .insert({
        group_chat_id: groupChatId,
        user_id: userId,
        role,
        can_invite: role === 'admin',
        can_manage_gifts: role === 'admin'
      });

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error adding group member:', error);
    return false;
  }
};

// Update member role
export const updateMemberRole = async (memberId: string, role: 'admin' | 'member' | 'viewer', canInvite?: boolean, canManageGifts?: boolean): Promise<boolean> => {
  try {
    const updates: any = { role };
    if (canInvite !== undefined) updates.can_invite = canInvite;
    if (canManageGifts !== undefined) updates.can_manage_gifts = canManageGifts;

    const { error } = await supabase
      .from('group_chat_members')
      .update(updates)
      .eq('id', memberId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error updating member role:', error);
    return false;
  }
};

// Leave group
export const leaveGroup = async (groupChatId: string): Promise<boolean> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { error } = await supabase
      .from('group_chat_members')
      .delete()
      .eq('group_chat_id', groupChatId)
      .eq('user_id', user.id);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error leaving group:', error);
    return false;
  }
};

// Get group members
export const getGroupMembers = async (groupChatId: string): Promise<GroupChatMember[]> => {
  try {
    const { data, error } = await supabase
      .from('group_chat_members')
      .select(`
        *,
        profile:profiles(name, profile_image)
      `)
      .eq('group_chat_id', groupChatId);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching group members:', error);
    return [];
  }
};