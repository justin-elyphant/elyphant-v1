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
  message_parent_id?: string;
  is_gift_proposal?: boolean;
  proposal_data?: {
    product_id?: string;
    product_name?: string;
    product_price?: number;
    product_image?: string;
    deadline?: string;
    description?: string;
  };
  poll_data?: {
    question?: string;
    options?: string[];
  };
  votes?: GiftProposalVote[];
  replies?: GroupMessage[];
}

export interface GiftProposalVote {
  id: string;
  message_id: string;
  user_id: string;
  vote_type: 'approve' | 'reject' | 'maybe';
  created_at: string;
  voter_name?: string;
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

// Send message to group with enhanced features
export const sendGroupMessage = async (
  groupChatId: string, 
  content: string, 
  options?: {
    replyToId?: string;
    mentionedUsers?: string[];
    isGiftProposal?: boolean;
    proposalData?: any;
    productData?: any;
  }
): Promise<GroupMessage | null> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const messageData: any = {
      sender_id: user.id,
      group_chat_id: groupChatId,
      content,
      message_type: options?.isGiftProposal ? 'gift_proposal' : (options?.productData ? 'product_share' : 'text'),
      recipient_id: '', // Required field, empty for group messages
    };

    if (options?.replyToId) {
      messageData.message_parent_id = options.replyToId;
    }

    if (options?.mentionedUsers) {
      messageData.mentioned_users = options.mentionedUsers;
    }

    if (options?.isGiftProposal && options?.proposalData) {
      messageData.is_gift_proposal = true;
      messageData.proposal_data = options.proposalData;
    }

    if (options?.productData) {
      messageData.proposal_data = options.productData;
    }

    const { data: message, error } = await supabase
      .from('messages')
      .insert(messageData)
      .select()
      .single();

    if (error) throw error;

    // Handle mentions
    if (options?.mentionedUsers && options.mentionedUsers.length > 0) {
      const mentions = options.mentionedUsers.map(userId => ({
        message_id: message.id,
        mentioned_user_id: userId
      }));

      await supabase.from('message_mentions').insert(mentions);
    }

    return message;
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

// Enhanced fetch messages with votes and replies
export const fetchGroupMessagesWithEnhancements = async (groupChatId: string): Promise<GroupMessage[]> => {
  try {
    const { data, error } = await supabase
      .from('messages')
      .select(`
        *,
        sender:profiles!messages_sender_id_fkey(name, profile_image),
        votes:gift_proposal_votes(
          id,
          user_id,
          vote_type,
          created_at,
          voter:profiles!gift_proposal_votes_user_id_fkey(name)
        ),
        replies:messages!messages_message_parent_id_fkey(
          id,
          content,
          created_at,
          sender_id,
          sender:profiles!messages_sender_id_fkey(name, profile_image)
        )
      `)
      .eq('group_chat_id', groupChatId)
      .is('message_parent_id', null) // Only get top-level messages
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching enhanced group messages:', error);
    return [];
  }
};

// Vote on gift proposal
export const voteOnGiftProposal = async (messageId: string, voteType: 'approve' | 'reject' | 'maybe'): Promise<boolean> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { error } = await supabase
      .from('gift_proposal_votes')
      .upsert({
        message_id: messageId,
        user_id: user.id,
        vote_type: voteType
      });

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error voting on gift proposal:', error);
    return false;
  }
};

// Create gift proposal message
export const createGiftProposal = async (
  groupChatId: string,
  proposalData: {
    product_id: string;
    product_name: string;
    product_price: number;
    product_image?: string;
    description?: string;
    deadline?: string;
  }
): Promise<GroupMessage | null> => {
  const content = `🎁 Gift Proposal: ${proposalData.product_name}\n💰 Price: $${proposalData.product_price}\n${proposalData.description ? `📝 ${proposalData.description}\n` : ''}Please vote to approve this gift!`;

  return sendGroupMessage(groupChatId, content, {
    isGiftProposal: true,
    proposalData
  });
};

// Share product in group
export const shareProductInGroup = async (
  groupChatId: string,
  productData: {
    id: string;
    name: string;
    price: number;
    image?: string;
    brand?: string;
  }
): Promise<GroupMessage | null> => {
  const content = `🛍️ Product Share: ${productData.name}\n💰 $${productData.price}${productData.brand ? `\n🏷️ ${productData.brand}` : ''}`;

  return sendGroupMessage(groupChatId, content, {
    productData
  });
};

// Get thread replies
export const getThreadReplies = async (parentMessageId: string): Promise<GroupMessage[]> => {
  try {
    const { data, error } = await supabase
      .from('messages')
      .select(`
        *,
        sender:profiles!messages_sender_id_fkey(name, profile_image)
      `)
      .eq('message_parent_id', parentMessageId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching thread replies:', error);
    return [];
  }
};

// Send reply to message
export const replyToMessage = async (
  groupChatId: string,
  parentMessageId: string,
  content: string,
  mentionedUsers?: string[]
): Promise<GroupMessage | null> => {
  return sendGroupMessage(groupChatId, content, {
    replyToId: parentMessageId,
    mentionedUsers
  });
};

// Get user mentions
export const getUserMentions = async (userId: string): Promise<GroupMessage[]> => {
  try {
    const { data, error } = await supabase
      .from('message_mentions')
      .select(`
        message:messages(
          *,
          sender:profiles!messages_sender_id_fkey(name, profile_image),
          group_chat:group_chats(name)
        )
      `)
      .eq('mentioned_user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data?.map(item => item.message).filter(Boolean) as unknown as GroupMessage[]) || [];
  } catch (error) {
    console.error('Error fetching user mentions:', error);
    return [];
  }
};