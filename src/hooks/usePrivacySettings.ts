
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/auth";
import { toast } from "sonner";

export type FieldVisibility = 'private' | 'friends' | 'public';

export const FIELD_VISIBILITY_OPTIONS: FieldVisibility[] = ['private', 'friends', 'public'];

/** Human-readable label for a FieldVisibility value */
export function getReadableVisibilityLabel(level: FieldVisibility): string {
  switch (level) {
    case 'private': return 'Only Me';
    case 'friends': return 'Friends Only';
    case 'public': return 'Everyone';
    default: return 'Unknown';
  }
}

export interface PrivacySettings {
  // Social Controls
  allow_connection_requests_from: 'everyone' | 'connections_only' | 'nobody';
  profile_visibility: 'public' | 'connections_only' | 'private';
  block_list_visibility: 'hidden' | 'visible_to_connections';
  show_follower_count: boolean;
  show_following_count: boolean;
  allow_message_requests: boolean;
  auto_gift_consent: 'everyone' | 'connections_only' | 'nobody';
  gift_surprise_mode: boolean;
  wishlist_visibility: 'public' | 'connections_only' | 'private';
  // Field Visibility
  dob_visibility: FieldVisibility;
  shipping_address_visibility: FieldVisibility;
  interests_visibility: FieldVisibility;
  email_visibility: FieldVisibility;
}

const DEFAULT_SETTINGS: PrivacySettings = {
  allow_connection_requests_from: 'everyone',
  profile_visibility: 'public',
  block_list_visibility: 'hidden',
  show_follower_count: true,
  show_following_count: true,
  allow_message_requests: true,
  auto_gift_consent: 'connections_only',
  gift_surprise_mode: true,
  wishlist_visibility: 'public',
  // Field visibility defaults
  dob_visibility: 'friends',
  shipping_address_visibility: 'private',
  interests_visibility: 'public',
  email_visibility: 'friends',
};

/** Normalize legacy DB values to current terminology */
function normalizeSettings(data: Record<string, unknown>): PrivacySettings {
  const normalize = (val: string, legacyMap: Record<string, string>) =>
    legacyMap[val] ?? val;

  return {
    allow_connection_requests_from: normalize(
      data.allow_connection_requests_from as string,
      { friends_only: 'connections_only' }
    ) as PrivacySettings['allow_connection_requests_from'],
    profile_visibility: normalize(
      data.profile_visibility as string,
      { followers_only: 'connections_only' }
    ) as PrivacySettings['profile_visibility'],
    block_list_visibility: normalize(
      data.block_list_visibility as string,
      { visible_to_friends: 'visible_to_connections' }
    ) as PrivacySettings['block_list_visibility'],
    show_follower_count: !!data.show_follower_count,
    show_following_count: !!data.show_following_count,
    allow_message_requests: !!data.allow_message_requests,
    auto_gift_consent: (data.auto_gift_consent as PrivacySettings['auto_gift_consent']) ?? 'connections_only',
    gift_surprise_mode: data.gift_surprise_mode !== undefined ? !!data.gift_surprise_mode : true,
    wishlist_visibility: (data.wishlist_visibility as PrivacySettings['wishlist_visibility']) ?? 'public',
    // Field visibility
    dob_visibility: (data.dob_visibility as FieldVisibility) ?? DEFAULT_SETTINGS.dob_visibility,
    shipping_address_visibility: (data.shipping_address_visibility as FieldVisibility) ?? DEFAULT_SETTINGS.shipping_address_visibility,
    interests_visibility: (data.interests_visibility as FieldVisibility) ?? DEFAULT_SETTINGS.interests_visibility,
    email_visibility: (data.email_visibility as FieldVisibility) ?? DEFAULT_SETTINGS.email_visibility,
  };
}

/** Map UI values back to DB-compatible values */
function toDbValues(settings: Partial<PrivacySettings>): Record<string, unknown> {
  return { ...settings };
}

export const usePrivacySettings = () => {
  const { user } = useAuth();
  const [settings, setSettings] = useState<PrivacySettings>(DEFAULT_SETTINGS);
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
        setSettings(normalizeSettings(data as Record<string, unknown>));
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

      const dbValues = toDbValues({ ...settings, ...newSettings });

      const { error } = await supabase
        .from('privacy_settings')
        .upsert({
          user_id: user.id,
          ...dbValues,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
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
