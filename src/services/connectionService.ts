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
        isAutoGiftEnabled: !!(autoGiftData as any)?.canAutoGift,
        canRemoveConnection: true,
        status: connection.status
      };
    } catch (error) {
      console.error('Error fetching connection data:', error);
      return null;
    }
  },

  /**
   * Fetch a connection profile (profile + connection data) with retry logic
   */
  async getConnectionProfile(currentUserId: string, profileIdentifier: string): Promise<ConnectionProfile | null> {
    // Retry logic to handle auth state transitions
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        // First, get the profile data
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .or(`username.eq.${profileIdentifier},id.eq.${profileIdentifier}`)
          .maybeSingle();

        if (profileError) {
          console.log(`Profile fetch error (attempt ${attempt + 1}):`, { profileIdentifier, profileError });
          if (attempt === 2) return null; // Last attempt failed
          await new Promise(resolve => setTimeout(resolve, 500)); // Wait before retry
          continue;
        }

        if (!profile) {
          console.log('Profile not found:', { profileIdentifier });
          return null;
        }

        // Then get the connection data
        const connectionData = await this.getConnectionData(currentUserId, profile.id);
        
        if (!connectionData) {
          console.log('No connection found between current user and profile owner');
          return null;
        }

        // Finally, get public wishlists for this profile from the proper wishlists table
        const { data: wishlists, error: wishlistError } = await supabase
          .from('wishlists')
          .select(`
            id,
            user_id,
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
          `)
          .eq('user_id', profile.id)
          .eq('is_public', true)
          .order('created_at', { ascending: false });

        if (wishlistError) {
          console.error('Error fetching wishlists:', wishlistError);
        }

        // Add wishlists to profile - now using consistent data source
        const normalizedGiftPreferences = Array.isArray((profile as any).gift_preferences)
          ? (profile as any).gift_preferences.map((p: any) => typeof p === 'string' ? ({ category: p }) : p)
          : [];
        const normalizedInterests = Array.isArray((profile as any).interests)
          ? (profile as any).interests.filter((x: any) => typeof x === 'string')
          : [];

        const profileWithWishlists = {
          ...profile,
          gift_preferences: normalizedGiftPreferences,
          interests: normalizedInterests,
          // Normalize important_dates to proper shape if present
          important_dates: Array.isArray((profile as any).important_dates)
            ? (profile as any).important_dates.map((d: any) => ({
                title: d?.title ?? 'Important Date',
                date: typeof d?.date === 'string' ? d.date : (d?.date ? new Date(d.date).toISOString() : new Date().toISOString()),
                type: d?.type ?? 'custom'
              }))
            : [],
          wishlists: wishlists || [],
          wishlist_count: wishlists?.length || 0
        };

        console.log('✅ Connection profile loaded successfully:', { 
          profileId: profile.id, 
          profileName: profile.name,
          connectionId: connectionData.id,
          wishlistCount: wishlists?.length || 0,
          publicWishlists: wishlists?.map(w => w.title)
        });

        return {
          profile: profileWithWishlists as unknown as Profile,
          connectionData
        };
      } catch (error) {
        console.error(`Connection profile fetch error (attempt ${attempt + 1}):`, error);
        if (attempt === 2) return null; // Last attempt failed
        await new Promise(resolve => setTimeout(resolve, 500)); // Wait before retry
      }
    }
    
    return null;
  }
};