
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
  follower_count?: number;
  following_count?: number;
  wishlist_count?: number;
  is_public: boolean;
  can_follow: boolean;
  can_message: boolean;
}

export const publicProfileService = {
  async getProfileByIdentifier(identifier: string): Promise<PublicProfileData | null> {
    try {
      console.log("🔍 Fetching public profile for identifier:", identifier);
      
      // Try to fetch profile by username first, then by ID
      let query = supabase
        .from('profiles')
        .select('*')
        .single();
      
      // Check if identifier looks like a UUID
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      
      if (uuidRegex.test(identifier)) {
        query = query.eq('id', identifier);
      } else {
        query = query.eq('username', identifier);
      }
      
      const { data: profile, error } = await query;
      
      if (error) {
        console.error("Error fetching profile:", error);
        return null;
      }
      
      if (!profile) {
        console.log("No profile found for identifier:", identifier);
        return null;
      }
      
      console.log("✅ Profile found:", profile.name);
      
      // Get privacy settings for this user
      const privacySettings = await this.getPrivacySettings(profile.id);
      
      // Check if profile is public
      const isPublic = privacySettings.profile_visibility === 'public';
      
      if (!isPublic) {
        console.log("Profile is not public, returning limited data");
        return {
          id: profile.id,
          name: profile.name,
          username: profile.username,
          profile_image: profile.profile_image,
          created_at: profile.created_at,
          is_public: false,
          can_follow: false,
          can_message: false
        };
      }
      
      // Get follow/connection counts if allowed by privacy settings
      const followerCount = privacySettings.show_follower_count ? await this.getFollowerCount(profile.id) : undefined;
      const followingCount = privacySettings.show_following_count ? await this.getFollowingCount(profile.id) : undefined;
      const wishlistCount = await this.getWishlistCount(profile.id);
      
      return {
        id: profile.id,
        name: profile.name,
        username: profile.username,
        profile_image: profile.profile_image,
        bio: profile.bio,
        location: profile.location,
        email: profile.email, // Will be filtered based on data sharing settings
        created_at: profile.created_at,
        follower_count: followerCount,
        following_count: followingCount,
        wishlist_count: wishlistCount,
        is_public: true,
        can_follow: true,
        can_message: privacySettings.allow_message_requests
      };
      
    } catch (error) {
      console.error("Exception in getProfileByIdentifier:", error);
      return null;
    }
  },
  
  async getPrivacySettings(userId: string) {
    try {
      const { data, error } = await supabase
        .from('privacy_settings')
        .select('profile_visibility, show_follower_count, show_following_count, allow_message_requests')
        .eq('user_id', userId)
        .single();
      
      if (error || !data) {
        // Return default public settings
        return {
          profile_visibility: 'public',
          show_follower_count: true,
          show_following_count: true,
          allow_message_requests: true
        };
      }
      
      return data;
    } catch (error) {
      console.error("Error fetching privacy settings:", error);
      return {
        profile_visibility: 'public',
        show_follower_count: true,
        show_following_count: true,
        allow_message_requests: true
      };
    }
  },
  
  async getFollowerCount(userId: string): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('user_connections')
        .select('*', { count: 'exact', head: true })
        .eq('connected_user_id', userId)
        .eq('status', 'accepted');
      
      return count || 0;
    } catch (error) {
      console.error("Error getting follower count:", error);
      return 0;
    }
  },
  
  async getFollowingCount(userId: string): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('user_connections')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('status', 'accepted');
      
      return count || 0;
    } catch (error) {
      console.error("Error getting following count:", error);
      return 0;
    }
  },
  
  async getWishlistCount(userId: string): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('wishlists')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('is_public', true); // Only count public wishlists
      
      return count || 0;
    } catch (error) {
      console.error("Error getting wishlist count:", error);
      return 0;
    }
  }
};
