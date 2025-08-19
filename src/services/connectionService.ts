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
      const { data: connection, error } = await supabase
        .from('user_connections')
        .select('*')
        .or(`and(user_id.eq.${userId},connected_user_id.eq.${connectedUserId}),and(user_id.eq.${connectedUserId},connected_user_id.eq.${userId})`)
        .eq('status', 'accepted')
        .single();

      if (error || !connection) {
        console.log('No connection found between users:', { userId, connectedUserId, error });
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
      // First, get the profile data
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .or(`username.eq.${profileIdentifier},id.eq.${profileIdentifier}`)
        .single();

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