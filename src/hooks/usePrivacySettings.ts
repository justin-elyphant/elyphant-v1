
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/auth";
import { toast } from "sonner";

export interface PrivacySettings {
  allow_connection_requests_from: 'everyone' | 'friends_only' | 'nobody';
  profile_visibility: 'public' | 'followers_only' | 'private';
  block_list_visibility: 'hidden' | 'visible_to_friends';
  show_follower_count: boolean;
  show_following_count: boolean;
  allow_message_requests: boolean;
}

export const usePrivacySettings = () => {
  const { user } = useAuth();
  const [settings, setSettings] = useState<PrivacySettings>({
    allow_connection_requests_from: 'everyone',
    profile_visibility: 'public',
    block_list_visibility: 'hidden',
    show_follower_count: true,
    show_following_count: true,
    allow_message_requests: true
  });
  const [loading, setLoading] = useState(false);

  const fetchSettings = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('privacy_settings')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setSettings({
          allow_connection_requests_from: data.allow_connection_requests_from,
          profile_visibility: data.profile_visibility,
          block_list_visibility: data.block_list_visibility,
          show_follower_count: data.show_follower_count,
          show_following_count: data.show_following_count,
          allow_message_requests: data.allow_message_requests
        });
      }
    } catch (error) {
      console.error('Error fetching privacy settings:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const updateSettings = useCallback(async (newSettings: Partial<PrivacySettings>) => {
    if (!user) return;

    try {
      setLoading(true);

      const { error } = await supabase
        .from('privacy_settings')
        .upsert({
          user_id: user.id,
          ...settings,
          ...newSettings,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      setSettings(prev => ({ ...prev, ...newSettings }));
      toast.success("Privacy settings updated");
    } catch (error) {
      console.error('Error updating privacy settings:', error);
      toast.error("Failed to update privacy settings");
    } finally {
      setLoading(false);
    }
  }, [user, settings]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  return {
    settings,
    loading,
    updateSettings,
    refetchSettings: fetchSettings
  };
};
