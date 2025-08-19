import { supabase } from "@/integrations/supabase/client";

export interface ConnectionData {
  id: string;
  user_id: string;
  connected_user_id: string;
  status: string;
  relationship_type?: string;
  connected_at: string;
  created_at: string;
  updated_at: string;
  profile?: {
    id: string;
    name: string;
    username?: string;
    profile_image?: string;
    bio?: string;
  };
}

export interface ConnectionWithAutoGift extends ConnectionData {
  auto_gift_enabled: boolean;
  auto_gift_settings?: any;
}

export const connectionService = {
  async getConnectionData(userId: string, connectionId: string): Promise<ConnectionWithAutoGift | null> {
    try {
      // First get the connection data
      const { data: connectionData, error: connectionError } = await supabase
        .from('user_connections')
        .select(`
          *,
          connected_user:profiles!user_connections_connected_user_id_fkey(
            id,
            name,
            username,
            profile_image,
            bio
          )
        `)
        .or(`and(user_id.eq.${userId},connected_user_id.eq.${connectionId}),and(user_id.eq.${connectionId},connected_user_id.eq.${userId})`)
        .eq('status', 'accepted')
        .single();

      if (connectionError || !connectionData) {
        console.error("Error fetching connection:", connectionError);
        return null;
      }

      // Check if there's an auto-gift rule for this connection
      const { data: autoGiftRule, error: autoGiftError } = await supabase
        .from('auto_gifting_rules')
        .select('*')
        .eq('user_id', userId)
        .eq('recipient_id', connectionId)
        .eq('is_active', true)
        .maybeSingle();

      if (autoGiftError) {
        console.error("Error fetching auto-gift rule:", autoGiftError);
      }

      return {
        ...connectionData,
        profile: connectionData.connected_user,
        auto_gift_enabled: !!autoGiftRule,
        auto_gift_settings: autoGiftRule || null
      } as ConnectionWithAutoGift;
    } catch (error) {
      console.error("Error in getConnectionData:", error);
      return null;
    }
  },

  async checkMutualConnection(userId: string, connectionId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('user_connections')
        .select('id')
        .or(`and(user_id.eq.${userId},connected_user_id.eq.${connectionId}),and(user_id.eq.${connectionId},connected_user_id.eq.${userId})`)
        .eq('status', 'accepted')
        .maybeSingle();

      return !error && !!data;
    } catch (error) {
      console.error("Error checking mutual connection:", error);
      return false;
    }
  }
};