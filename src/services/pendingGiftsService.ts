import { supabase } from "@/integrations/supabase/client";

export interface PendingGiftInvitation {
  id: string;
  user_id: string;
  recipient_email: string;
  recipient_name: string;
  shipping_address?: any;
  invitation_token: string;
  gift_events: any[];
  auto_gift_rules: any[];
  invitation_sent_at: string;
  expires_at: string;
  status: 'pending' | 'accepted' | 'expired';
  created_at: string;
  updated_at: string;
}

export interface CreatePendingGiftData {
  recipient_email: string;
  recipient_name: string;
  shipping_address?: any;
  gift_events?: any[];
  auto_gift_rules?: any[];
}

export const pendingGiftsService = {
  async createPendingInvitation(data: CreatePendingGiftData): Promise<PendingGiftInvitation> {
    const { data: result, error } = await supabase
      .from('pending_gift_invitations')
      .insert({
        user_id: (await supabase.auth.getUser()).data.user?.id,
        ...data
      })
      .select()
      .single();

    if (error) throw error;
    return result;
  },

  async createPendingConnection(
    recipientEmail: string,
    recipientName: string,
    relationshipType: string,
    shippingAddress?: any,
    birthday?: string | null,
    relationshipContext?: any
  ) {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error('User not authenticated');

    // Extract phone number from shipping address if provided
    const recipientPhone = shippingAddress?.phone || null;

    // Check if a pending connection already exists for this email
    const { data: existingConnection } = await supabase
      .from('user_connections')
      .select('*')
      .eq('user_id', user.user.id)
      .eq('pending_recipient_email', recipientEmail)
      .eq('status', 'pending_invitation')
      .maybeSingle();

    if (existingConnection) {
      // Update the existing connection instead of creating a new one
      const { data, error } = await supabase
        .from('user_connections')
        .update({
          relationship_type: relationshipType,
          pending_recipient_name: recipientName,
          pending_recipient_phone: recipientPhone,
          pending_shipping_address: shippingAddress,
          pending_recipient_dob: birthday,
          relationship_context: relationshipContext,
          invitation_sent_at: new Date().toISOString()
        })
        .eq('id', existingConnection.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    }

    // Create a new connection if none exists
    const { data, error } = await supabase
      .from('user_connections')
      .insert({
        user_id: user.user.id,
        connected_user_id: null, // Will be set when invitation is accepted
        status: 'pending_invitation',
        relationship_type: relationshipType,
        pending_recipient_email: recipientEmail,
        pending_recipient_name: recipientName,
        pending_recipient_phone: recipientPhone,
        pending_shipping_address: shippingAddress,
        pending_recipient_dob: birthday,
        relationship_context: relationshipContext,
        invitation_sent_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async createAutoGiftRuleForPending(
    connectionId: string,
    recipientEmail: string,
    dateType: string,
    budgetLimit?: number,
    giftSelectionCriteria?: any,
    notificationPreferences?: any,
    paymentMethodId?: string,
    eventId?: string
  ) {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('auto_gifting_rules')
      .insert({
        user_id: user.user.id,
        recipient_id: null, // Will be set when invitation is accepted
        pending_recipient_email: recipientEmail,
        date_type: dateType,
        event_id: eventId, // Link to the specific event
        budget_limit: budgetLimit,
        gift_selection_criteria: giftSelectionCriteria || {
          source: "ai",
          categories: [],
          exclude_items: []
        },
        notification_preferences: notificationPreferences || {
          enabled: true,
          days_before: [7, 3, 1],
          email: true,
          push: false
        },
        payment_method_id: paymentMethodId,
        is_active: true
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async createEventForPending(
    connectionId: string,
    recipientEmail: string,
    dateType: string,
    date: string,
    recurring?: boolean
  ) {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error('User not authenticated');

    // Check if this date type already exists for this user
    const { data: existingDate } = await supabase
      .from('user_special_dates')
      .select('id')
      .eq('user_id', user.user.id)
      .eq('date_type', dateType)
      .maybeSingle();

    // If it exists, return it instead of creating a new one
    if (existingDate) {
      return existingDate;
    }

    const { data, error } = await supabase
      .from('user_special_dates')
      .insert({
        user_id: user.user.id,
        connection_id: connectionId,
        date_type: dateType,
        date: date,
        is_recurring: recurring || false,
        recurring_type: recurring ? 'yearly' : null,
        visibility: 'private'
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getUserPendingInvitations(): Promise<PendingGiftInvitation[]> {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('pending_gift_invitations')
      .select('*')
      .eq('user_id', user.user.id)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async getPendingConnectionsWithInvitations() {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('user_connections')
      .select('*')
      .eq('user_id', user.user.id)
      .eq('status', 'pending_invitation')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async getInvitationByToken(token: string): Promise<PendingGiftInvitation | null> {
    const { data, error } = await supabase
      .from('pending_gift_invitations')
      .select('*')
      .eq('invitation_token', token)
      .eq('status', 'pending')
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  async acceptInvitation(token: string) {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error('User not authenticated');

    // Get the invitation
    const invitation = await this.getInvitationByToken(token);
    if (!invitation) throw new Error('Invitation not found or expired');

    // Update the connection to link to the actual user
    const { error: connectionError } = await supabase
      .from('user_connections')
      .update({
        connected_user_id: user.user.id,
        status: 'accepted'
      })
      .eq('user_id', invitation.user_id)
      .eq('pending_recipient_email', invitation.recipient_email);

    if (connectionError) throw connectionError;

    // Update auto gift rules
    const { error: rulesError } = await supabase
      .from('auto_gifting_rules')
      .update({
        recipient_id: user.user.id
      })
      .eq('user_id', invitation.user_id)
      .eq('pending_recipient_email', invitation.recipient_email);

    if (rulesError) throw rulesError;

    // Mark invitation as accepted
    const { error: invitationError } = await supabase
      .from('pending_gift_invitations')
      .update({ status: 'accepted' })
      .eq('invitation_token', token);

    if (invitationError) throw invitationError;

    return true;
  },

  async sendInvitationEmail(
    recipientEmail: string,
    recipientName: string,
    giftorName: string,
    invitationToken: string,
    giftEvents: any[] = []
  ) {
    const { data, error } = await supabase.functions.invoke('send-gift-invitation', {
      body: {
        recipientEmail,
        recipientName,
        giftorName,
        invitationToken,
        giftEvents
      }
    });

    if (error) throw error;
    return data;
  },

  async updateAutoGiftingSettings(settings: { auto_approve_gifts?: boolean; has_payment_method?: boolean }): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('Not authenticated');
    }

    const { error } = await supabase
      .from('auto_gifting_settings')
      .upsert({
        user_id: user.id,
        ...settings,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id' });

    if (error) {
      console.error('Error updating auto-gifting settings:', error);
      throw error;
    }
  }
};