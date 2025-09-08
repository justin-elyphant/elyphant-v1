import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface EmailReminderData {
  lastEmailSent: string | null;
  emailCampaignStage: string | null;
  emailsEnabled: boolean;
  emailOpens: number;
  emailClicks: number;
  profileUpdatedAfterEmail: boolean;
}

export function useProfileCompletionEmails() {
  const { user } = useAuth();
  const [emailData, setEmailData] = useState<EmailReminderData>({
    lastEmailSent: null,
    emailCampaignStage: null,
    emailsEnabled: true,
    emailOpens: 0,
    emailClicks: 0,
    profileUpdatedAfterEmail: false
  });
  const [loading, setLoading] = useState(false);

  // Fetch email reminder data
  useEffect(() => {
    if (!user) return;

    const fetchEmailData = async () => {
      try {
        // Get analytics data
        const { data: analytics } = await supabase
          .from('profile_completion_analytics')
          .select('*')
          .eq('user_id', user.id)
          .single();

        // Get email preferences
        const { data: preferences } = await supabase
          .from('email_preferences')
          .select('is_enabled')
          .eq('user_id', user.id)
          .eq('email_type', 'profile_completion_reminders')
          .single();

        setEmailData({
          lastEmailSent: analytics?.last_email_sent_at || null,
          emailCampaignStage: analytics?.email_campaign_stage || null,
          emailsEnabled: preferences?.is_enabled ?? true,
          emailOpens: analytics?.email_opens || 0,
          emailClicks: analytics?.email_clicks || 0,
          profileUpdatedAfterEmail: analytics?.profile_updated_after_email || false
        });
      } catch (error) {
        console.error('Error fetching email data:', error);
      }
    };

    fetchEmailData();
  }, [user]);

  const updateEmailPreference = async (enabled: boolean) => {
    if (!user) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('email_preferences')
        .upsert({
          user_id: user.id,
          email_type: 'profile_completion_reminders',
          is_enabled: enabled,
          frequency: 'smart_timing'
        }, {
          onConflict: 'user_id,email_type'
        });

      if (error) throw error;

      setEmailData(prev => ({ ...prev, emailsEnabled: enabled }));
      toast.success(enabled ? 'Email reminders enabled' : 'Email reminders disabled');
    } catch (error) {
      console.error('Error updating email preference:', error);
      toast.error('Failed to update email preference');
    } finally {
      setLoading(false);
    }
  };

  const getNextEmailSchedule = () => {
    if (!user?.created_at) return null;

    const createdAt = new Date(user.created_at);
    const now = new Date();
    const daysSinceSignup = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24));

    // Determine next email based on campaign schedule
    if (daysSinceSignup < 1) return { stage: 'welcome', daysUntil: 1 - daysSinceSignup };
    if (daysSinceSignup < 3) return { stage: 'interests', daysUntil: 3 - daysSinceSignup };
    if (daysSinceSignup < 7) return { stage: 'events', daysUntil: 7 - daysSinceSignup };
    if (daysSinceSignup < 14) return { stage: 'final', daysUntil: 14 - daysSinceSignup };

    return null; // No more scheduled emails
  };

  const getEmailStageInfo = (stage: string | null) => {
    const stages = {
      'profile_reminder_welcome': { 
        name: 'Welcome Email', 
        description: 'Introduction to AI-powered gifting',
        icon: '👋'
      },
      'profile_reminder_interests': { 
        name: 'Interests Focus', 
        description: 'Encourage adding interests and hobbies',
        icon: '🎯'
      },
      'profile_reminder_events': { 
        name: 'Events Focus', 
        description: 'Remind to add important dates',
        icon: '📅'
      },
      'profile_reminder_final': { 
        name: 'Final Nudge', 
        description: 'Last reminder to complete profile',
        icon: '🚀'
      }
    };

    return stage ? stages[stage as keyof typeof stages] || null : null;
  };

  return {
    emailData,
    loading,
    updateEmailPreference,
    getNextEmailSchedule,
    getEmailStageInfo
  };
}