import { supabase } from "@/integrations/supabase/client";
import type { Profile } from "@/types/profile";

export interface ConnectionData {
  id: string;
  relationship?: string;
  customRelationship?: string;
  connectionDate?: string;
  isAutoGiftEnabled?: boolean;
  canRemoveConnection?: boolean;
  status?: string;
}

export interface ConnectionProfile {
  profile: Profile;
  connectionData: ConnectionData;
}

export const connectionService = {
  /**
   * Fetch connection data between current user and another user
   */
  async getConnectionData(userId: string, connectedUserId: string): Promise<ConnectionData | null> {
    try {
      let connection = null;
      
      // Try first direction: current user -> target user
      const { data: conn1 } = await supabase
        .from('user_connections')
        .select('*')
        .eq('user_id', userId)
        .eq('connected_user_id', connectedUserId)
        .eq('status', 'accepted')
        .maybeSingle();

      console.log('🔍 Connection lookup (direction 1):', { userId, connectedUserId, found: !!conn1 });

      if (conn1) {
        connection = conn1;
      } else {
        // Try second direction: target user -> current user
        const { data: conn2 } = await supabase
          .from('user_connections')
          .select('*')
          .eq('user_id', connectedUserId)
          .eq('connected_user_id', userId)
          .eq('status', 'accepted')
          .maybeSingle();

        console.log('🔍 Connection lookup (direction 2):', { connectedUserId, userId, found: !!conn2 });

        if (conn2) {
          connection = conn2;
        }
      }

      if (!connection) {
        console.log('No connection found between users:', { userId, connectedUserId });
        return null;
      }

      // Check auto-gift permissions
      const { data: autoGiftData } = await supabase
        .rpc('check_auto_gift_permission', {
          p_user_id: userId,
          p_connection_id: connectedUserId
        });

      return {
        id: connection.id,
        relationship: connection.relationship_type || 'friend',
        customRelationship: connection.custom_relationship,
        connectionDate: connection.created_at,
        isAutoGiftEnabled: autoGiftData?.canAutoGift || false,
        canRemoveConnection: true,
        status: connection.status
      };
    } catch (error) {
      console.error('Error fetching connection data:', error);
      return null;
    }
  },

  /**
   * Fetch a connection profile (profile + connection data)
   */
  async getConnectionProfile(currentUserId: string, profileIdentifier: string): Promise<ConnectionProfile | null> {
    try {
      // First, get the profile data with public wishlists
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select(`
          *,
          wishlists:wishlists!inner(
            id,
            title,
            description,
            is_public,
            created_at,
            updated_at,
            category,
            tags,
            priority,
            items:wishlist_items(
              id,
              product_id,
              title,
              created_at,
              name,
              brand,
              price,
              image_url
            )
          )
        `)
        .or(`username.eq.${profileIdentifier},id.eq.${profileIdentifier}`)
        .eq('wishlists.is_public', true)
        .maybeSingle();

      if (profileError || !profile) {
        console.log('Profile not found:', { profileIdentifier, profileError });
        return null;
      }

      // Then get the connection data
      const connectionData = await this.getConnectionData(currentUserId, profile.id);
      
      if (!connectionData) {
        console.log('No connection found between current user and profile owner');
        return null;
      }

      return {
        profile: profile as Profile,
        connectionData
      };
    } catch (error) {
      console.error('Error fetching connection profile:', error);
      return null;
    }
  }
};