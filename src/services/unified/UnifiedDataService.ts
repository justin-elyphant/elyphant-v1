import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";

type Profile = Database['public']['Tables']['profiles']['Row'];
type Connection = Database['public']['Tables']['user_connections']['Row'];
type Wishlist = Database['public']['Tables']['wishlists']['Row'];
type WishlistItem = Database['public']['Tables']['wishlist_items']['Row'];

export interface UnifiedUserData {
  profile: Profile | null;
  connections: ConnectionWithProfile[];
  wishlists: WishlistWithItems[];
  recentActivity: any[];
}

export interface ConnectionWithProfile {
  id: string;
  connected_user_id: string;
  relationship_type: string;
  status: string;
  created_at: string;
  profile: {
    id: string;
    name: string | null;
    username: string | null;
    profile_image: string | null;
    interests: any;
    dob: string | null;
  } | null;
  wishlists: WishlistWithItems[];
  upcomingEvents: any[];
}

export interface WishlistWithItems {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  is_public: boolean | null;
  items: WishlistItem[];
  created_at: string | null;
  updated_at: string | null;
}

export interface NicoleIntegrationData {
  userProfile: Profile | null;
  connections: ConnectionWithProfile[];
  availableWishlists: WishlistWithItems[];
  recentGiftHistory: any[];
  preferredCategories: string[];
  budgetInsights: {
    avgSpending: number;
    preferredRange: [number, number];
    occasionBreakdown: Record<string, number>;
  };
}

/**
 * Unified Data Service - Single source of truth for all user data
 * Consolidates profile, connections, wishlists, and activity data
 */
export class UnifiedDataService {
  private static instance: UnifiedDataService;
  private cache: Map<string, { data: any; timestamp: number }> = new Map();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  static getInstance(): UnifiedDataService {
    if (!UnifiedDataService.instance) {
      UnifiedDataService.instance = new UnifiedDataService();
    }
    return UnifiedDataService.instance;
  }

  /**
   * Get complete unified user data (cached)
   */
  async getUserData(forceRefresh = false): Promise<UnifiedUserData | null> {
    const cacheKey = 'unified_user_data';
    
    if (!forceRefresh && this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey)!;
      if (Date.now() - cached.timestamp < this.CACHE_TTL) {
        return cached.data;
      }
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      // Fetch all data in parallel for better performance
      const [profileData, connectionsData, wishlistsData] = await Promise.all([
        this.fetchUserProfile(user.id),
        this.fetchUserConnections(user.id),
        this.fetchUserWishlists(user.id)
      ]);

      const unifiedData: UnifiedUserData = {
        profile: profileData,
        connections: connectionsData,
        wishlists: wishlistsData,
        recentActivity: [] // TODO: Implement activity tracking
      };

      // Cache the result
      this.cache.set(cacheKey, {
        data: unifiedData,
        timestamp: Date.now()
      });

      return unifiedData;
    } catch (error) {
      console.error('Error fetching unified user data:', error);
      return null;
    }
  }

  /**
   * Get data specifically formatted for Nicole AI integration
   */
  async getNicoleIntegrationData(): Promise<NicoleIntegrationData | null> {
    try {
      const userData = await this.getUserData();
      if (!userData) return null;

      // Calculate budget insights from past orders/searches
      const budgetInsights = await this.calculateBudgetInsights();
      
      // Get preferred categories from user activity
      const preferredCategories = await this.getPreferredCategories();

      return {
        userProfile: userData.profile,
        connections: userData.connections,
        availableWishlists: userData.wishlists,
        recentGiftHistory: [], // TODO: Implement from orders/gift_searches tables
        preferredCategories,
        budgetInsights
      };
    } catch (error) {
      console.error('Error preparing Nicole integration data:', error);
      return null;
    }
  }

  /**
   * Get connection by ID with their wishlists
   */
  async getConnectionWithWishlists(connectionId: string): Promise<ConnectionWithProfile | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data: connection, error } = await supabase
        .from('user_connections')
        .select(`
          *,
          profiles!user_connections_connected_user_id_fkey (
            id,
            name,
            username,
            profile_image,
            interests,
            dob
          )
        `)
        .eq('user_id', user.id)
        .eq('connected_user_id', connectionId)
        .eq('status', 'accepted')
        .maybeSingle();

      if (error || !connection) {
        console.error('Error fetching connection:', error);
        return null;
      }

      // Fetch connection's public wishlists
      const wishlists = await this.fetchUserWishlists(connectionId, true);

      // Fetch upcoming events for this connection
      const upcomingEvents = await this.fetchUpcomingEvents(connectionId);

      const profile = Array.isArray(connection.profiles) 
        ? connection.profiles[0] 
        : connection.profiles;

      return {
        id: connection.id,
        connected_user_id: connection.connected_user_id,
        relationship_type: connection.relationship_type,
        status: connection.status,
        created_at: connection.created_at,
        profile,
        wishlists,
        upcomingEvents
      };
    } catch (error) {
      console.error('Error fetching connection with wishlists:', error);
      return null;
    }
  }

  /**
   * Search connections by name or relationship
   */
  async searchConnections(query: string): Promise<ConnectionWithProfile[]> {
    try {
      const userData = await this.getUserData();
      if (!userData) return [];

      const lowerQuery = query.toLowerCase();
      
      return userData.connections.filter(connection => 
        connection.profile?.name?.toLowerCase().includes(lowerQuery) ||
        connection.relationship_type.toLowerCase().includes(lowerQuery) ||
        connection.profile?.username?.toLowerCase().includes(lowerQuery)
      );
    } catch (error) {
      console.error('Error searching connections:', error);
      return [];
    }
  }

  /**
   * Get wishlist recommendations for a specific connection
   */
  async getWishlistRecommendations(
    connectionId: string, 
    budget?: [number, number],
    occasion?: string
  ): Promise<{ item: WishlistItem; reasoning: string; priority: 'high' | 'medium' | 'low' }[]> {
    try {
      const connection = await this.getConnectionWithWishlists(connectionId);
      if (!connection) return [];

      const recommendations: { item: WishlistItem; reasoning: string; priority: 'high' | 'medium' | 'low' }[] = [];

      for (const wishlist of connection.wishlists) {
        for (const item of wishlist.items) {
          const itemPrice = item.price || 0;
          const inBudget = budget ? 
            itemPrice >= budget[0] && itemPrice <= budget[1] : 
            true;

          let reasoning = `From ${connection.profile?.name || 'their'} ${wishlist.title} wishlist`;
          
          if (occasion) {
            reasoning += ` - perfect for ${occasion}`;
          }

          if (connection.profile?.interests) {
            const interests = Array.isArray(connection.profile.interests) 
              ? connection.profile.interests 
              : [];
            if (interests.length > 0) {
              reasoning += ` - matches their interests in ${interests.slice(0, 2).join(', ')}`;
            }
          }

          recommendations.push({
            item,
            reasoning,
            priority: inBudget ? 'high' : (itemPrice > (budget?.[1] || 100) * 1.2 ? 'low' : 'medium')
          });
        }
      }

      // Sort by priority and price
      return recommendations.sort((a, b) => {
        const priorityOrder = { high: 0, medium: 1, low: 2 };
        if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
          return priorityOrder[a.priority] - priorityOrder[b.priority];
        }
        return (a.item.price || 0) - (b.item.price || 0);
      });
    } catch (error) {
      console.error('Error getting wishlist recommendations:', error);
      return [];
    }
  }

  /**
   * Invalidate cache for fresh data
   */
  invalidateCache(): void {
    this.cache.clear();
  }

  // Private helper methods

  private async fetchUserProfile(userId: string): Promise<Profile | null> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }

    return data;
  }

  private async fetchUserConnections(userId: string): Promise<ConnectionWithProfile[]> {
    const { data, error } = await supabase
      .from('user_connections')
      .select(`
        *,
        profiles!user_connections_connected_user_id_fkey (
          id,
          name,
          username,
          profile_image,
          interests,
          dob
        )
      `)
      .eq('user_id', userId)
      .eq('status', 'accepted');

    if (error) {
      console.error('Error fetching user connections:', error);
      return [];
    }

    // Fetch wishlists for each connection
    const connectionsWithData = await Promise.all(
      (data || []).map(async (connection) => {
        const profile = Array.isArray(connection.profiles) 
          ? connection.profiles[0] 
          : connection.profiles;

        const wishlists = await this.fetchUserWishlists(connection.connected_user_id, true);
        const upcomingEvents = await this.fetchUpcomingEvents(connection.connected_user_id);

        return {
          id: connection.id,
          connected_user_id: connection.connected_user_id,
          relationship_type: connection.relationship_type,
          status: connection.status,
          created_at: connection.created_at,
          profile,
          wishlists,
          upcomingEvents
        };
      })
    );

    return connectionsWithData;
  }

  private async fetchUserWishlists(userId: string, publicOnly = false): Promise<WishlistWithItems[]> {
    let query = supabase
      .from('wishlists')
      .select(`
        *,
        wishlist_items (*)
      `)
      .eq('user_id', userId);

    if (publicOnly) {
      query = query.eq('is_public', true);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching wishlists:', error);
      return [];
    }

    return (data || []).map(wishlist => ({
      ...wishlist,
      items: wishlist.wishlist_items || []
    }));
  }

  private async fetchUpcomingEvents(userId: string): Promise<any[]> {
    // TODO: Implement when events system is ready
    const { data, error } = await supabase
      .from('user_special_dates')
      .select('*')
      .eq('user_id', userId)
      .gte('date', new Date().toISOString().split('T')[0])
      .limit(5);

    if (error) {
      console.error('Error fetching upcoming events:', error);
      return [];
    }

    return data || [];
  }

  private async calculateBudgetInsights(): Promise<{ avgSpending: number; preferredRange: [number, number]; occasionBreakdown: Record<string, number> }> {
    // TODO: Implement based on order history and gift searches
    return {
      avgSpending: 50,
      preferredRange: [25, 100],
      occasionBreakdown: {
        birthday: 75,
        holiday: 60,
        anniversary: 100,
        graduation: 80
      }
    };
  }

  private async getPreferredCategories(): Promise<string[]> {
    // TODO: Implement based on user search and purchase history
    return ['electronics', 'books', 'home', 'fashion'];
  }
}

// Export singleton instance
export const unifiedDataService = UnifiedDataService.getInstance();