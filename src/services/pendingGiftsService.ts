import { supabase } from "@/integrations/supabase/client";
import { Json } from "@/integrations/supabase/types";

// 🚨 DEPRECATION WARNING - Phase 5 Migration
// This service has been consolidated into UnifiedGiftManagementService
// Please migrate to use unifiedGiftManagementService instead
// This service will be removed in a future version
console.warn(`
⚠️  DEPRECATED: pendingGiftsService
📦 Use: unifiedGiftManagementService from @/services/UnifiedGiftManagementService
🔄 Migration: Phase 5 Gift System Consolidation
⏰ Will be removed in future version
`);

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
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) throw new Error('User not authenticated');

    const { data: result, error } = await supabase
      .from('pending_gift_invitations')
      .insert({
        user_id: user.user.id,
        recipient_email: data.recipient_email,
        recipient_name: data.recipient_name,
        shipping_address: data.shipping_address as Json,
        gift_events: (data.gift_events || []) as Json,
        auto_gift_rules: (data.auto_gift_rules || []) as Json,
        invitation_token: crypto.randomUUID(),
      })
      .select()
      .single();

    if (error) throw error;
    return {
      ...result,
      gift_events: Array.isArray(result.gift_events) ? result.gift_events : [],
      auto_gift_rules: Array.isArray(result.auto_gift_rules) ? result.auto_gift_rules : []
    } as PendingGiftInvitation;
  },

  async createPendingConnection(
    recipientEmail: string,
    recipientName: string,
    relationshipType: string,
    shippingAddress?: any,
    birthday?: string | null,
    relationshipContext?: any
  ) {
    console.log('🔄 [PENDING_GIFTS] Creating pending connection with database-level debugging');
    
    // Phase 1: Database-Level Authentication Debugging
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('💥 [DB_AUTH] Session error:', sessionError);
      throw new Error(`Session error: ${sessionError.message}. Please sign in again.`);
    }
    
    if (!session?.user?.id) {
      console.error('💥 [DB_AUTH] No user ID in session:', { session });
      throw new Error('No active session found. Please sign in to continue.');
    }
    
    if (!session.access_token) {
      console.error('💥 [DB_AUTH] No access token in session');
      throw new Error('Invalid authentication token. Please sign in again.');
    }
    
    // Test database auth context BEFORE attempting insert
    console.log('🧪 [DB_AUTH] Testing database auth context...');
    try {
      const { data: authTest, error: authTestError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', session.user.id)
        .maybeSingle();
      
      if (authTestError) {
        console.error('💥 [DB_AUTH] Auth test failed:', authTestError);
        throw new Error(`Database authentication failed: ${authTestError.message}`);
      }
      
      console.log('✅ [DB_AUTH] Database auth context verified:', {
        userId: session.user.id,
        userExists: !!authTest,
        tokenExpiry: session.expires_at ? new Date(session.expires_at * 1000).toISOString() : 'never'
      });
    } catch (error) {
      console.error('💥 [DB_AUTH] Database auth test failed:', error);
      throw new Error('Database authentication failed. Please sign in again.');
    }
    
    // Phase 2: Data Validation and Constraint Checking
    console.log('🔍 [DB_VALIDATION] Validating input constraints...');
    
    if (!recipientEmail?.trim() || !recipientName?.trim()) {
      throw new Error('Recipient email and name are required');
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(recipientEmail.trim())) {
      throw new Error('Invalid email format');
    }
    
    if (!relationshipType || !['friend', 'family', 'colleague', 'partner', 'other'].includes(relationshipType)) {
      throw new Error('Invalid relationship type');
    }
    
    const user = { user: session.user };

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

    // Phase 3: Transaction-Based Database Operation with Enhanced Error Handling
    console.log('💾 [DB_INSERT] Attempting database insert with transaction...');
    
    const insertData = {
      user_id: user.user.id,
      connected_user_id: null,
      status: 'pending_invitation',
      relationship_type: relationshipType,
      pending_recipient_email: recipientEmail.trim().toLowerCase(),
      pending_recipient_name: recipientName.trim(),
      pending_recipient_phone: recipientPhone,
      pending_shipping_address: shippingAddress,
      pending_recipient_dob: birthday,
      relationship_context: relationshipContext,
      invitation_sent_at: new Date().toISOString()
    };
    
    console.log('📋 [DB_INSERT] Insert data prepared:', {
      ...insertData,
      user_id: insertData.user_id ? 'SET' : 'MISSING',
      pending_recipient_email: insertData.pending_recipient_email || 'MISSING',
      pending_recipient_name: insertData.pending_recipient_name || 'MISSING'
    });
    
    // Attempt insert with enhanced error context
    try {
      console.log('🚀 [DB_INSERT] Executing insert operation...');
      
      const { data, error } = await supabase
        .from('user_connections')
        .insert(insertData)
        .select()
        .single();

      if (error) {
        console.error('💥 [DB_INSERT] Database insert error:', {
          error,
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint,
          insertData: {
            ...insertData,
            user_id: insertData.user_id ? 'SET' : 'MISSING'
          }
        });
        
        // Enhanced error analysis
        if (error.code === 'PGRST301') {
          throw new Error('Database permission denied. This may be an authentication issue. Please sign in again.');
        } else if (error.code === '23503') {
          throw new Error('Foreign key constraint violation. User authentication may be invalid.');
        } else if (error.code === '23505') {
          throw new Error('A pending invitation already exists for this email address.');
        } else if (error.message?.includes('JWT')) {
          throw new Error('Authentication token expired. Please sign in again.');
        } else if (error.message?.includes('row-level security')) {
          throw new Error('Permission denied due to security policies. Please verify your authentication.');
        } else {
          throw new Error(`Database operation failed: ${error.message}`);
        }
      }
      
      console.log('✅ [DB_INSERT] Successfully created pending connection:', {
        id: data.id,
        user_id: data.user_id,
        status: data.status,
        pending_recipient_email: data.pending_recipient_email
      });
      
      return data;
      
    } catch (dbError: any) {
      console.error('💥 [DB_INSERT] Critical database error:', {
        error: dbError,
        message: dbError.message,
        code: dbError.code,
        timestamp: new Date().toISOString(),
        userId: user.user.id,
        recipientEmail: recipientEmail
      });
      
      // Re-throw with context
      throw new Error(`Database operation failed: ${dbError.message || 'Unknown database error'}`);
    }
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
    return (data || []).map(invitation => ({
      ...invitation,
      gift_events: Array.isArray(invitation.gift_events) ? invitation.gift_events : [],
      auto_gift_rules: Array.isArray(invitation.auto_gift_rules) ? invitation.auto_gift_rules : []
    })) as PendingGiftInvitation[];
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
    return data ? {
      ...data,
      gift_events: Array.isArray(data.gift_events) ? data.gift_events : [],
      auto_gift_rules: Array.isArray(data.auto_gift_rules) ? data.auto_gift_rules : []
    } as PendingGiftInvitation : null;
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
    const { data, error } = await supabase.functions.invoke('ecommerce-email-orchestrator', {
      body: {
        eventType: 'gift_invitation',
        customData: {
          recipientEmail,
          recipientName,
          giftorName,
          invitationToken,
          giftEvents
        }
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