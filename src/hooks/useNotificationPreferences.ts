import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface NotificationPreferences {
  id?: string;
  user_id: string;
  email_notifications: boolean;
  device_change_alerts: boolean;
  location_change_alerts: boolean;
  suspicious_activity_alerts: boolean;
  new_session_alerts: boolean;
}

export const useNotificationPreferences = (userId: string | undefined) => {
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchPreferences = async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('user_notification_preferences')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setPreferences(data);
      } else {
        // Create default preferences
        const { data: newPrefs, error: insertError } = await supabase
          .from('user_notification_preferences')
          .insert({
            user_id: userId,
            email_notifications: true,
            device_change_alerts: true,
            location_change_alerts: true,
            suspicious_activity_alerts: true,
            new_session_alerts: false,
          })
          .select()
          .single();

        if (insertError) throw insertError;
        setPreferences(newPrefs);
      }
    } catch (error) {
      console.error('Error fetching notification preferences:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPreferences();
  }, [userId]);

  const updatePreferences = async (updates: Partial<NotificationPreferences>) => {
    if (!userId || !preferences) return;

    try {
      const { error } = await supabase
        .from('user_notification_preferences')
        .update(updates)
        .eq('user_id', userId);

      if (error) throw error;

      setPreferences({ ...preferences, ...updates });
      toast.success('Notification preferences updated');
    } catch (error) {
      console.error('Error updating preferences:', error);
      toast.error('Failed to update preferences');
      throw error;
    }
  };

  return {
    preferences,
    loading,
    updatePreferences,
    refetch: fetchPreferences,
  };
};
