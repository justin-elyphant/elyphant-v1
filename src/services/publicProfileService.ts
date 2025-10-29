
import { supabase } from '@/integrations/supabase/client';
import { Profile } from '@/types/supabase';

export interface PublicProfileData {
  id: string;
  name: string;
  username: string;
  profile_image?: string;
  bio?: string;
  location?: string;
  email?: string;
  created_at: string;
  // Privacy-filtered fields
  connection_count?: number;
  wishlist_count?: number;
  is_public: boolean;
  can_connect: boolean;
  can_message: boolean;
  // Connection status fields
  is_connected: boolean;
  connection_status?: 'none' | 'pending' | 'accepted' | 'rejected' | 'blocked';
}

export const publicProfileService = {
  async getProfileByIdentifier(identifier: string): Promise<PublicProfileData | null> {
    try {
      console.log("🔍 Fetching public profile for identifier:", identifier);
      
      // Get current user for connection status checks
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      
      // Use secure RPC to fetch public profile (bypasses RLS, only returns safe fields)
      const { data: publicProfile, error: rpcError } = await supabase
        .rpc('get_public_profile_by_identifier', { identifier });
      
      if (rpcError) {
        console.error("❌ RPC error fetching public profile:", rpcError);
        return null;
      }
      
      // RPC returns empty array if not found or not public
      if (!publicProfile || publicProfile.length === 0) {
        console.log("❌ No public profile found for identifier:", identifier);
        return null;
      }
      
      const profile = publicProfile[0];
      console.log("✅ Public profile found:", profile.name, "- ID:", profile.id);
      
      // Profile is confirmed public by RPC (it only returns public profiles)
      console.log("🔢 Getting counts for public profile...");
      
      // Get connection counts and wishlist count
      const connectionCount = await this.getConnectionCount(profile.id);
      const wishlistCount = await this.getWishlistCount(profile.id);
      
      console.log("📊 Counts retrieved - Connections:", connectionCount, "Wishlists:", wishlistCount);
      
      // Check connection status with current user
      const connectionStatus = await this.getConnectionStatus(profile.id, currentUser?.id);
      
      // Get privacy settings for message requests setting
      const { data: privacySettings } = await supabase
        .from('privacy_settings')
        .select('allow_message_requests')
        .eq('user_id', profile.id)
        .single();
      
      const finalProfile = {
        id: profile.id,
        name: profile.name,
        username: profile.username,
        profile_image: profile.profile_image || undefined,
        bio: profile.bio || undefined,
        location: profile.location || undefined,
        created_at: profile.created_at,
        connection_count: connectionCount,
        wishlist_count: wishlistCount,
        is_public: true,
        can_connect: connectionStatus.can_connect,
        can_message: privacySettings?.allow_message_requests ?? true,
        is_connected: connectionStatus.is_connected,
        connection_status: connectionStatus.status
      };
      
      console.log("🎯 Final profile object:", finalProfile);
      return finalProfile;
      
    } catch (error) {
      console.error("💥 Exception in getProfileByIdentifier:", error);
      return null;
    }
  },
  
  async getPrivacySettings(userId: string) {
    try {
      const { data, error } = await supabase
        .from('privacy_settings')
        .select('profile_visibility, allow_message_requests')
        .eq('user_id', userId)
        .single();
      
      if (error || !data) {
        // Return default public settings
        return {
          profile_visibility: 'public',
          allow_message_requests: true
        };
      }
      
      return data;
    } catch (error) {
      console.error("Error fetching privacy settings:", error);
      return {
        profile_visibility: 'public',
        allow_message_requests: true
      };
    }
  },
  
  async getConnectionCount(userId: string): Promise<number> {
    try {
      // Count unique connections by getting distinct user pairs
      // Since connections can exist in both directions, we need to avoid double-counting
      const { data: connections, error } = await supabase
        .from('user_connections')
        .select('user_id, connected_user_id')
        .or(`and(user_id.eq.${userId},status.eq.accepted),and(connected_user_id.eq.${userId},status.eq.accepted)`);
      
      if (error) {
        console.error("Error getting connections:", error);
        return 0;
      }

      // Create a set of unique connection partner IDs to avoid double counting
      const uniqueConnections = new Set();
      connections?.forEach(conn => {
        const partnerId = conn.user_id === userId ? conn.connected_user_id : conn.user_id;
        uniqueConnections.add(partnerId);
      });
      
      return uniqueConnections.size;
    } catch (error) {
      console.error("Error getting connection count:", error);
      return 0;
    }
  },
  
  async getWishlistCount(userId: string): Promise<number> {
    try {
      console.log("🔍 Getting wishlist count for user:", userId);
      
      // Now using only the wishlists table (data has been migrated)
      const { count, error } = await supabase
        .from('wishlists')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('is_public', true); // Only count public wishlists
      
      console.log("📊 Wishlist count query result:", { count, error });
      
      if (error) {
        console.error("Error getting wishlist count from wishlists table:", error);
        return 0;
      }

      const finalCount = count || 0;
      console.log("✅ Final wishlist count:", finalCount);
      return finalCount;
    } catch (error) {
      console.error("Exception in getWishlistCount:", error);
      return 0;
    }
  },

  async getConnectionStatus(targetUserId: string, currentUserId?: string) {
    if (!currentUserId || currentUserId === targetUserId) {
      return {
        is_connected: false,
        status: 'none' as const,
        can_connect: currentUserId !== targetUserId
      };
    }

    try {
      const { data: connections, error } = await supabase
        .from('user_connections')
        .select('status')
        .or(`and(user_id.eq.${currentUserId},connected_user_id.eq.${targetUserId}),and(user_id.eq.${targetUserId},connected_user_id.eq.${currentUserId})`)
        .limit(1);

      if (error) {
        console.error("Error checking connection status:", error);
        return {
          is_connected: false,
          status: 'none' as const,
          can_connect: true
        };
      }

      const connection = connections && connections.length > 0 ? connections[0] : null;

      const status = connection?.status || 'none';
      
      return {
        is_connected: status === 'accepted',
        status: status as 'none' | 'pending' | 'accepted' | 'rejected' | 'blocked',
        can_connect: !connection || status === 'rejected'
      };
    } catch (error) {
      console.error("Error getting connection status:", error);
      return {
        is_connected: false,
        status: 'none' as const,
        can_connect: true
      };
    }
  }
};
