import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// =============================================================================
// UNIFIED MESSAGE TYPES
// =============================================================================

export interface UnifiedMessage {
  id: string;
  sender_id: string;
  recipient_id?: string;
  group_chat_id?: string;
  content: string;
  created_at: string;
  is_read: boolean;
  message_type: 'text' | 'gift' | 'system' | 'product_share' | 'gift_proposal';
  delivery_status: 'sending' | 'sent' | 'delivered' | 'read';
  reactions: { [emoji: string]: string[] };
  
  // Enhanced fields
  reply_to_id?: string;
  message_parent_id?: string;
  mentioned_users?: string[];
  product_link_id?: number;
  wishlist_link_id?: string;
  attachment_url?: string;
  attachment_type?: string;
  attachment_name?: string;
  
  // Group chat specific
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
  
  // Metadata
  votes?: GiftProposalVote[];
  replies?: UnifiedMessage[];
  sender?: {
    name: string;
    profile_image?: string;
  };
}

export interface GiftProposalVote {
  id: string;
  message_id: string;
  user_id: string;
  vote_type: 'approve' | 'reject' | 'maybe';
  created_at: string;
  voter_name?: string;
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

export interface SendMessageOptions {
  recipientId?: string;
  groupChatId?: string;
  content: string;
  messageType?: 'text' | 'gift' | 'product_share' | 'gift_proposal';
  replyToId?: string;
  mentionedUsers?: string[];
  productLinkId?: number;
  wishlistLinkId?: string;
  attachment?: File;
  proposalData?: any;
  productData?: any;
}

// =============================================================================
// UNIFIED MESSAGING SERVICE
// =============================================================================

class UnifiedMessagingService {
  private static instance: UnifiedMessagingService;
  
  // Connection management
  private activeChannels = new Map<string, any>();
  private presenceChannels = new Map<string, any>();
  private typingChannels = new Map<string, any>();
  
  // Rate limiting
  private rateLimitMap = new Map<string, { count: number; resetTime: number }>();
  private readonly RATE_LIMIT_PER_MINUTE = 10;
  private readonly RATE_LIMIT_PER_DAY = 500;
  
  // Offline support
  private offlineQueue: SendMessageOptions[] = [];
  
  private constructor() {
    this.setupOfflineSupport();
    this.initializePresenceHeartbeat();
  }

  public static getInstance(): UnifiedMessagingService {
    if (!UnifiedMessagingService.instance) {
      UnifiedMessagingService.instance = new UnifiedMessagingService();
    }
    return UnifiedMessagingService.instance;
  }

  // =============================================================================
  // MESSAGE SENDING - DIRECT & GROUP
  // =============================================================================

  public async sendMessage(options: SendMessageOptions): Promise<UnifiedMessage | null> {
    try {
      // Validate input
      if (!options.content?.trim()) {
        toast.error("Message content cannot be empty");
        return null;
      }

      if (!options.recipientId && !options.groupChatId) {
        toast.error("Must specify either recipient or group chat");
        return null;
      }

      // Check rate limiting
      if (!(await this.checkRateLimit())) {
        toast.error("Rate limit exceeded. Please wait before sending more messages.");
        return null;
      }

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("You must be logged in to send messages");
        return null;
      }

      // For direct messages, verify connection
      if (options.recipientId && !options.recipientId.startsWith('mock-')) {
        const isConnected = await this.verifyConnection(user.id, options.recipientId);
        if (!isConnected) {
          toast.error("You can only message connected users");
          return null;
        }
      }

      // Handle attachment upload
      let attachmentUrl = null;
      let attachmentType = null;
      let attachmentName = null;
      
      if (options.attachment) {
        const messageId = crypto.randomUUID();
        attachmentUrl = await this.uploadAttachment(options.attachment, messageId);
        if (!attachmentUrl) {
          return null; // Upload failed
        }
        attachmentType = options.attachment.type;
        attachmentName = options.attachment.name;
      }

      // Build message object
      const messageData: any = {
        sender_id: user.id,
        content: options.content,
        message_type: options.messageType || 'text',
        delivery_status: 'sent',
        is_read: false,
        reactions: {},
        attachment_url: attachmentUrl,
        attachment_type: attachmentType,
        attachment_name: attachmentName
      };

      // Set recipient or group
      if (options.groupChatId) {
        messageData.group_chat_id = options.groupChatId;
        messageData.recipient_id = ''; // Required field for DB
      } else {
        messageData.recipient_id = options.recipientId;
      }

      // Add optional fields
      if (options.replyToId) {
        messageData.message_parent_id = options.replyToId;
      }
      if (options.mentionedUsers) {
        messageData.mentioned_users = options.mentionedUsers;
      }
      if (options.productLinkId) {
        messageData.product_link_id = options.productLinkId;
      }
      if (options.wishlistLinkId) {
        messageData.wishlist_link_id = options.wishlistLinkId;
      }
      if (options.proposalData && (options.messageType === 'gift_proposal' || options.productData)) {
        messageData.is_gift_proposal = options.messageType === 'gift_proposal';
        messageData.proposal_data = options.proposalData || options.productData;
      }

      // Try to send message
      const { data, error } = await supabase
        .from('messages')
        .insert([messageData])
        .select()
        .single();

      if (error) {
        // Queue for offline if send fails
        await this.queueOfflineMessage(messageData);
        throw error;
      }

      // Handle mentions
      if (options.mentionedUsers && options.mentionedUsers.length > 0) {
        const mentions = options.mentionedUsers.map(userId => ({
          message_id: data.id,
          mentioned_user_id: userId
        }));
        await supabase.from('message_mentions').insert(mentions);
      }

      return data as UnifiedMessage;

    } catch (error) {
      console.error('Error sending message:', error);
      toast.error("Message queued for when you're back online");
      
      // Return optimistic message for UI
      return this.createOptimisticMessage(options);
    }
  }

  // =============================================================================
  // MESSAGE FETCHING - DIRECT & GROUP
  // =============================================================================

  public async fetchDirectMessages(
    otherUserId: string, 
    page: number = 0, 
    limit: number = 50
  ): Promise<{ messages: UnifiedMessage[]; hasMore: boolean }> {
    // Handle mock users
    if (otherUserId.startsWith('mock-')) {
      return { 
        messages: this.generateMockMessages(otherUserId), 
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
      .select('*, sender:profiles!messages_sender_id_fkey(name, profile_image)', { count: 'exact' })
      .or(`and(sender_id.eq.${user.user.id},recipient_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},recipient_id.eq.${user.user.id})`)
      .is('group_chat_id', null) // Only direct messages
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Error fetching direct messages:', error);
      toast.error("Failed to load messages");
      return { messages: [], hasMore: false };
    }

    const messages = (data as UnifiedMessage[]).reverse();
    const hasMore = count ? offset + limit < count : false;

    return { messages, hasMore };
  }

  public async fetchGroupMessages(groupChatId: string): Promise<UnifiedMessage[]> {
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
      return data as UnifiedMessage[] || [];
    } catch (error) {
      console.error('Error fetching group messages:', error);
      toast.error("Failed to load group messages");
      return [];
    }
  }

  // =============================================================================
  // REAL-TIME SUBSCRIPTIONS
  // =============================================================================

  public subscribeToDirectMessages(
    currentUserId: string,
    otherUserId: string,
    onNewMessage: (message: UnifiedMessage) => void,
    onMessageUpdate: (message: UnifiedMessage) => void
  ): () => void {
    if (otherUserId.startsWith('mock-')) {
      return () => {}; // Skip for mock connections
    }

    const channelKey = `direct_${currentUserId}_${otherUserId}`;
    
    // Close existing channel if any
    this.closeChannel(channelKey);

    const channel = supabase
      .channel(channelKey)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `and(group_chat_id.is.null,or(and(sender_id.eq.${currentUserId},recipient_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},recipient_id.eq.${currentUserId})))`
        },
        (payload) => {
          onNewMessage(payload.new as UnifiedMessage);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `and(group_chat_id.is.null,or(and(sender_id.eq.${currentUserId},recipient_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},recipient_id.eq.${currentUserId})))`
        },
        (payload) => {
          onMessageUpdate(payload.new as UnifiedMessage);
        }
      )
      .subscribe();

    this.activeChannels.set(channelKey, channel);

    return () => this.closeChannel(channelKey);
  }

  public subscribeToGroupMessages(
    groupChatId: string,
    onNewMessage: (message: UnifiedMessage) => void
  ): () => void {
    const channelKey = `group_${groupChatId}`;
    
    // Close existing channel if any
    this.closeChannel(channelKey);

    const channel = supabase
      .channel(channelKey)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `group_chat_id=eq.${groupChatId}`
        },
        (payload) => onNewMessage(payload.new as UnifiedMessage)
      )
      .subscribe();

    this.activeChannels.set(channelKey, channel);

    return () => this.closeChannel(channelKey);
  }

  // =============================================================================
  // PRESENCE MANAGEMENT
  // =============================================================================

  public async updatePresence(
    status: 'online' | 'offline' | 'away',
    activity?: string
  ): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    try {
      await supabase
        .from('user_presence')
        .upsert({
          user_id: user.id,
          status,
          current_activity: activity,
          last_seen: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
    } catch (error) {
      console.error('Error updating presence:', error);
    }
  }

  public async getUserPresence(userId: string): Promise<UserPresence | null> {
    try {
      const { data, error } = await supabase
        .from('user_presence')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) return null;
      return data as UserPresence;
    } catch (error) {
      console.error('Error fetching user presence:', error);
      return null;
    }
  }

  public subscribeToPresence(
    userId: string,
    onPresenceChange: (presence: UserPresence) => void
  ): () => void {
    const channelKey = `presence_${userId}`;
    
    this.closePresenceChannel(channelKey);

    const channel = supabase
      .channel(channelKey)
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

    this.presenceChannels.set(channelKey, channel);

    return () => this.closePresenceChannel(channelKey);
  }

  // =============================================================================
  // TYPING INDICATORS
  // =============================================================================

  public async setTypingStatus(
    chatWithUserId: string,
    isTyping: boolean
  ): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    try {
      await supabase
        .from('typing_indicators')
        .upsert({
          user_id: user.id,
          chat_with_user_id: chatWithUserId,
          is_typing: isTyping,
          updated_at: new Date().toISOString()
        });
    } catch (error) {
      console.error('Error updating typing status:', error);
    }
  }

  public subscribeToTyping(
    currentUserId: string,
    otherUserId: string,
    onTypingChange: (isTyping: boolean) => void
  ): () => void {
    const channelKey = `typing_${currentUserId}_${otherUserId}`;
    
    this.closeTypingChannel(channelKey);

    const channel = supabase
      .channel(channelKey)
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

    this.typingChannels.set(channelKey, channel);

    return () => this.closeTypingChannel(channelKey);
  }

  // =============================================================================
  // MESSAGE ACTIONS
  // =============================================================================

  public async markMessagesAsRead(messageIds: string[]): Promise<void> {
    if (!messageIds.length) return;
    
    const realMessageIds = messageIds.filter(id => !id.startsWith('mock-'));
    if (!realMessageIds.length) return;

    try {
      await supabase
        .from('messages')
        .update({ 
          is_read: true,
          delivery_status: 'read'
        })
        .in('id', realMessageIds);
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  }

  public async addReaction(messageId: string, emoji: string): Promise<boolean> {
    if (messageId.startsWith('mock-')) {
      toast.success("Reaction added!");
      return true;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error("You must be logged in to react to messages");
      return false;
    }

    try {
      // Get current message
      const { data: message, error: fetchError } = await supabase
        .from('messages')
        .select('reactions')
        .eq('id', messageId)
        .single();

      if (fetchError) throw fetchError;

      const currentReactions = message.reactions || {};
      const emojiReactions = currentReactions[emoji] || [];
      
      // Add user to reaction if not already present
      if (!emojiReactions.includes(user.id)) {
        emojiReactions.push(user.id);
        currentReactions[emoji] = emojiReactions;

        await supabase
          .from('messages')
          .update({ reactions: currentReactions })
          .eq('id', messageId);

        toast.success("Reaction added!");
        return true;
      }

      return false;
    } catch (error) {
      console.error('Error adding reaction:', error);
      return false;
    }
  }

  // =============================================================================
  // PRIVATE HELPER METHODS
  // =============================================================================

  private async checkRateLimit(): Promise<boolean> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    try {
      const { data, error } = await supabase
        .rpc('check_message_rate_limit', { sender_uuid: user.id });

      if (error) {
        console.error('Rate limit check failed:', error);
        return true; // Allow message if check fails
      }

      return data as boolean;
    } catch (error) {
      console.error('Rate limit check error:', error);
      return true; // Allow message if check fails
    }
  }

  private async verifyConnection(userId: string, recipientId: string): Promise<boolean> {
    try {
      const { data: connection } = await supabase
        .from('user_connections')
        .select('*')
        .or(`and(user_id.eq.${userId},connected_user_id.eq.${recipientId}),and(user_id.eq.${recipientId},connected_user_id.eq.${userId})`)
        .eq('status', 'accepted')
        .single();

      return !!connection;
    } catch (error) {
      console.error('Error verifying connection:', error);
      return false;
    }
  }

  private async uploadAttachment(file: File, messageId: string): Promise<string | null> {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) return null;

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.user.id}/${messageId}/${Date.now()}.${fileExt}`;

      const { data, error } = await supabase.storage
        .from('message-attachments')
        .upload(fileName, file);

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('message-attachments')
        .getPublicUrl(data.path);

      return publicUrl;
    } catch (error) {
      console.error('File upload failed:', error);
      toast.error("Failed to upload attachment");
      return null;
    }
  }

  private async queueOfflineMessage(messageData: any): Promise<void> {
    try {
      await supabase
        .from('offline_message_queue')
        .insert([{
          user_id: messageData.sender_id,
          recipient_id: messageData.recipient_id || null,
          content: messageData.content,
          message_type: messageData.message_type,
          attachment_url: messageData.attachment_url,
          attachment_type: messageData.attachment_type,
          attachment_name: messageData.attachment_name
        }]);
    } catch (error) {
      console.error('Failed to queue message:', error);
    }
  }

  private createOptimisticMessage(options: SendMessageOptions): UnifiedMessage {
    return {
      id: `optimistic-${Date.now()}`,
      sender_id: "current-user",
      recipient_id: options.recipientId,
      group_chat_id: options.groupChatId,
      content: options.content,
      created_at: new Date().toISOString(),
      is_read: false,
      message_type: options.messageType || 'text',
      delivery_status: 'sending',
      reactions: {}
    };
  }

  private generateMockMessages(connectionId: string): UnifiedMessage[] {
    return [
      {
        id: `mock-msg-${connectionId}-1`,
        sender_id: connectionId,
        recipient_id: "current-user",
        content: "Hey! How's it going?",
        created_at: new Date(Date.now() - 3600000).toISOString(),
        is_read: true,
        message_type: 'text',
        delivery_status: 'read',
        reactions: {}
      }
    ];
  }

  private closeChannel(channelKey: string): void {
    const channel = this.activeChannels.get(channelKey);
    if (channel) {
      supabase.removeChannel(channel);
      this.activeChannels.delete(channelKey);
    }
  }

  private closePresenceChannel(channelKey: string): void {
    const channel = this.presenceChannels.get(channelKey);
    if (channel) {
      supabase.removeChannel(channel);
      this.presenceChannels.delete(channelKey);
    }
  }

  private closeTypingChannel(channelKey: string): void {
    const channel = this.typingChannels.get(channelKey);
    if (channel) {
      supabase.removeChannel(channel);
      this.typingChannels.delete(channelKey);
    }
  }

  private setupOfflineSupport(): void {
    const handleOnline = () => {
      this.processOfflineQueue();
      toast.success("Back online! Sending queued messages...");
    };

    const handleOffline = () => {
      toast.info("You're offline. Messages will be queued and sent when you're back online.");
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
  }

  private async processOfflineQueue(): Promise<void> {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) return;

    try {
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
    } catch (error) {
      console.error('Error processing offline queue:', error);
    }
  }

  private initializePresenceHeartbeat(): void {
    // Update presence every 30 seconds when online
    setInterval(async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user && navigator.onLine) {
        await this.updatePresence('online');
      }
    }, 30000);

    // Set offline when page unloads
    window.addEventListener('beforeunload', async () => {
      await this.updatePresence('offline');
    });

    // Handle visibility changes
    document.addEventListener('visibilitychange', async () => {
      if (document.hidden) {
        await this.updatePresence('away');
      } else {
        await this.updatePresence('online');
      }
    });
  }

  // =============================================================================
  // PUBLIC CLEANUP
  // =============================================================================

  public cleanup(): void {
    // Close all active channels
    this.activeChannels.forEach((channel) => {
      supabase.removeChannel(channel);
    });
    this.activeChannels.clear();

    this.presenceChannels.forEach((channel) => {
      supabase.removeChannel(channel);
    });
    this.presenceChannels.clear();

    this.typingChannels.forEach((channel) => {
      supabase.removeChannel(channel);
    });
    this.typingChannels.clear();
  }
}

// Export singleton instance
export const unifiedMessagingService = UnifiedMessagingService.getInstance();