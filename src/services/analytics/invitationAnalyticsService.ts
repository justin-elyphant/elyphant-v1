import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/auth";
import { getRelationshipCategory } from "@/config/relationshipTypes";

export interface InvitationAnalytics {
  id?: string;
  user_id: string;
  recipient_email: string;
  recipient_name: string;
  relationship_type: string;
  occasion?: string;
  conversion_status: string;
  metadata?: any;
}

export interface ConversionEvent {
  invitation_id: string;
  event_type: string;
  event_data?: any;
}

export const invitationAnalyticsService = {
  // Create invitation analytics record when invitation is sent
  async trackInvitationSent(data: {
    recipient_email: string;
    recipient_name: string;
    relationship_type: string;
    occasion?: string;
    metadata?: any;
  }): Promise<string | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data: analytics, error } = await supabase
        .from('gift_invitation_analytics')
        .insert({
          user_id: user.id,
          recipient_email: data.recipient_email,
          recipient_name: data.recipient_name,
          relationship_type: data.relationship_type,
          occasion: data.occasion,
          conversion_status: 'sent',
          metadata: data.metadata || {}
        })
        .select()
        .single();

      if (error) throw error;

      // Track the initial event
      await this.trackConversionEvent(analytics.id, 'email_sent');

      return analytics.id;
    } catch (error) {
      console.error('Error tracking invitation sent:', error);
      return null;
    }
  },

  // Track conversion events throughout the funnel
  async trackConversionEvent(invitationId: string, eventType: string, eventData?: any): Promise<void> {
    try {
      const { error } = await supabase
        .from('invitation_conversion_events')
        .insert({
          invitation_id: invitationId,
          event_type: eventType,
          event_data: eventData || {}
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error tracking conversion event:', error);
    }
  },

  // Track when user opens invitation email (called via email tracking pixel)
  async trackEmailOpened(invitationId: string): Promise<void> {
    await this.trackConversionEvent(invitationId, 'email_opened');
  },

  // Track when user clicks invitation link
  async trackEmailClicked(invitationId: string): Promise<void> {
    await this.trackConversionEvent(invitationId, 'email_clicked');
  },

  // Track when user starts signup
  async trackSignupStarted(invitationId: string): Promise<void> {
    await this.trackConversionEvent(invitationId, 'signup_started');
  },

  // Track when user completes signup
  async trackSignupCompleted(email: string): Promise<void> {
    try {
      // Find the invitation by email
      const { data: invitation } = await supabase
        .from('gift_invitation_analytics')
        .select('id')
        .eq('recipient_email', email)
        .eq('conversion_status', 'clicked')
        .single();

      if (invitation) {
        await this.trackConversionEvent(invitation.id, 'signup_completed');
      }
    } catch (error) {
      console.error('Error tracking signup completed:', error);
    }
  },

  // Track when user starts profile setup
  async trackProfileSetupStarted(email: string): Promise<void> {
    try {
      const { data: invitation } = await supabase
        .from('gift_invitation_analytics')
        .select('id')
        .eq('recipient_email', email)
        .eq('conversion_status', 'signed_up')
        .single();

      if (invitation) {
        await this.trackConversionEvent(invitation.id, 'profile_setup_started');
      }
    } catch (error) {
      console.error('Error tracking profile setup started:', error);
    }
  },

  // Track when user completes profile setup
  async trackProfileSetupCompleted(email: string): Promise<void> {
    try {
      const { data: invitation } = await supabase
        .from('gift_invitation_analytics')
        .select('id')
        .eq('recipient_email', email)
        .eq('conversion_status', 'signed_up')
        .single();

      if (invitation) {
        await this.trackConversionEvent(invitation.id, 'profile_setup_completed');
      }
    } catch (error) {
      console.error('Error tracking profile setup completed:', error);
    }
  },

  // Track when preference collection starts (Nicole popup)
  async trackPreferenceCollectionStarted(email: string): Promise<void> {
    try {
      const { data: invitation } = await supabase
        .from('gift_invitation_analytics')
        .select('id')
        .eq('recipient_email', email)
        .eq('conversion_status', 'profile_completed')
        .single();

      if (invitation) {
        await this.trackConversionEvent(invitation.id, 'preference_collection_started');
      }
    } catch (error) {
      console.error('Error tracking preference collection started:', error);
    }
  },

  // Track when auto-gifting is activated
  async trackAutoGiftActivated(email: string): Promise<void> {
    try {
      const { data: invitation } = await supabase
        .from('gift_invitation_analytics')
        .select('id')
        .eq('recipient_email', email)
        .eq('conversion_status', 'profile_completed')
        .single();

      if (invitation) {
        await this.trackConversionEvent(invitation.id, 'auto_gift_activated');
      }
    } catch (error) {
      console.error('Error tracking auto gift activated:', error);
    }
  },

  // Get analytics for a user's invitations
  async getUserInvitationAnalytics(userId?: string): Promise<InvitationAnalytics[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const targetUserId = userId || user?.id;
      
      if (!targetUserId) return [];

      const { data, error } = await supabase
        .from('gift_invitation_analytics')
        .select('*')
        .eq('user_id', targetUserId)
        .order('invitation_sent_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting user invitation analytics:', error);
      return [];
    }
  },

  // Get conversion funnel data
  async getConversionFunnel(userId?: string): Promise<any> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const targetUserId = userId || user?.id;
      
      if (!targetUserId) return null;

      const { data, error } = await supabase
        .from('gift_invitation_analytics')
        .select('conversion_status, relationship_type')
        .eq('user_id', targetUserId);

      if (error) throw error;

      // Calculate funnel metrics
      const total = data.length;
      const sent = data.filter(d => d.conversion_status === 'sent').length;
      const opened = data.filter(d => d.conversion_status === 'opened').length;
      const clicked = data.filter(d => d.conversion_status === 'clicked').length;
      const signedUp = data.filter(d => d.conversion_status === 'signed_up').length;
      const profileCompleted = data.filter(d => d.conversion_status === 'profile_completed').length;
      const autoGiftActive = data.filter(d => d.conversion_status === 'auto_gift_active').length;

      // Calculate conversion rates by relationship category
      const byRelationship = data.reduce((acc: any, record) => {
        const category = getRelationshipCategory(record.relationship_type as any) || 'other';
        if (!acc[category]) {
          acc[category] = { total: 0, converted: 0 };
        }
        acc[category].total++;
        if (['signed_up', 'profile_completed', 'auto_gift_active'].includes(record.conversion_status)) {
          acc[category].converted++;
        }
        return acc;
      }, {});

      // Calculate conversion rate percentage for each category
      const relationshipStats = Object.entries(byRelationship).map(([category, stats]: [string, any]) => ({
        category,
        total: stats.total,
        converted: stats.converted,
        conversionRate: stats.total > 0 ? (stats.converted / stats.total) * 100 : 0
      }));

      return {
        total,
        funnel: {
          sent: { count: sent, rate: total > 0 ? (sent / total) * 100 : 0 },
          opened: { count: opened, rate: sent > 0 ? (opened / sent) * 100 : 0 },
          clicked: { count: clicked, rate: opened > 0 ? (clicked / opened) * 100 : 0 },
          signed_up: { count: signedUp, rate: clicked > 0 ? (signedUp / clicked) * 100 : 0 },
          profile_completed: { count: profileCompleted, rate: signedUp > 0 ? (profileCompleted / signedUp) * 100 : 0 },
          auto_gift_active: { count: autoGiftActive, rate: profileCompleted > 0 ? (autoGiftActive / profileCompleted) * 100 : 0 }
        },
        byRelationship: relationshipStats
      };
    } catch (error) {
      console.error('Error getting conversion funnel:', error);
      return null;
    }
  }
};

// Hook for easy usage in components
export const useInvitationAnalytics = () => {
  const { user } = useAuth();

  return {
    trackInvitationSent: invitationAnalyticsService.trackInvitationSent,
    trackConversionEvent: invitationAnalyticsService.trackConversionEvent,
    trackEmailOpened: invitationAnalyticsService.trackEmailOpened,
    trackEmailClicked: invitationAnalyticsService.trackEmailClicked,
    trackSignupStarted: invitationAnalyticsService.trackSignupStarted,
    trackSignupCompleted: invitationAnalyticsService.trackSignupCompleted,
    trackProfileSetupStarted: invitationAnalyticsService.trackProfileSetupStarted,
    trackProfileSetupCompleted: invitationAnalyticsService.trackProfileSetupCompleted,
    trackPreferenceCollectionStarted: invitationAnalyticsService.trackPreferenceCollectionStarted,
    trackAutoGiftActivated: invitationAnalyticsService.trackAutoGiftActivated,
    getUserInvitationAnalytics: () => invitationAnalyticsService.getUserInvitationAnalytics(user?.id),
    getConversionFunnel: () => invitationAnalyticsService.getConversionFunnel(user?.id)
  };
};