
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface GifteeWishlistItem {
  id: string;
  title: string;
  name?: string;
  price?: number;
  image_url?: string;
  brand?: string;
  product_id: string;
}

export interface GifteePreferences {
  interests?: string[];
  gift_preferences?: Array<{
    category: string;
    importance?: 'low' | 'medium' | 'high';
  }>;
}

export interface GifteeData {
  name: string;
  wishlistItems: GifteeWishlistItem[];
  preferences: GifteePreferences;
}

/**
 * Fetch giftee's wishlist items and preferences by name
 * This searches for users by name and retrieves their public wishlist data
 */
export const fetchGifteeData = async (gifteeName: string): Promise<GifteeData | null> => {
  try {
    console.log(`Fetching data for giftee: ${gifteeName}`);
    
    // First, find the user by name
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('id, name, wishlists, interests, gift_preferences')
      .ilike('name', `%${gifteeName}%`)
      .limit(1);

    if (profileError) {
      console.error('Error fetching giftee profile:', profileError);
      return null;
    }

    if (!profiles || profiles.length === 0) {
      console.log(`No profile found for name: ${gifteeName}`);
      return {
        name: gifteeName,
        wishlistItems: [],
        preferences: {}
      };
    }

    const profile = profiles[0];
    console.log('Found giftee profile:', profile);

    // Extract wishlist items from all public wishlists
    const wishlistItems: GifteeWishlistItem[] = [];
    
    if (profile.wishlists && Array.isArray(profile.wishlists)) {
      profile.wishlists.forEach((wishlist: any) => {
        // Only include public wishlists
        if (wishlist.is_public && wishlist.items && Array.isArray(wishlist.items)) {
          wishlist.items.forEach((item: any) => {
            wishlistItems.push({
              id: item.id || crypto.randomUUID(),
              title: item.title || item.name || 'Untitled Item',
              name: item.name || item.title,
              price: item.price ? parseFloat(item.price) : undefined,
              image_url: item.image_url,
              brand: item.brand,
              product_id: item.product_id || item.id
            });
          });
        }
      });
    }

    // Extract preferences
    // PHASE 2: Use interests as primary source (gift_preferences is deprecated)
    const preferences: GifteePreferences = {
      interests: Array.isArray(profile.interests) 
        ? profile.interests.filter((x: any): x is string => typeof x === 'string') 
        : (Array.isArray(profile.gift_preferences) 
            ? profile.gift_preferences.map((p: any) => typeof p === 'string' ? p : p.category).filter(Boolean)
            : []),
      // Keep gift_preferences for backwards compatibility (will be removed in Phase 5)
      gift_preferences: Array.isArray(profile.gift_preferences)
        ? profile.gift_preferences.map((p: any) => typeof p === 'string' ? ({ category: p }) : p)
        : []
    };

    console.log(`Found ${wishlistItems.length} wishlist items and preferences for ${gifteeName}`);

    return {
      name: profile.name || gifteeName,
      wishlistItems,
      preferences
    };

  } catch (error) {
    console.error('Error in fetchGifteeData:', error);
    toast.error('Failed to fetch giftee information');
    return null;
  }
};

/**
 * Generate search suggestions based on giftee's wishlist and preferences
 */
export const generateGiftSuggestions = (gifteeData: GifteeData, occasion?: string): string[] => {
  const suggestions: string[] = [];
  
  // Add suggestions based on wishlist items
  if (gifteeData.wishlistItems.length > 0) {
    // Get unique brands from wishlist
    const brands = [...new Set(gifteeData.wishlistItems.map(item => item.brand).filter(Boolean))];
    if (brands.length > 0) {
      suggestions.push(`${brands.slice(0, 2).join(' or ')} gifts`);
    }

    // Get price ranges to suggest similar items
    const prices = gifteeData.wishlistItems.map(item => item.price).filter(Boolean);
    if (prices.length > 0) {
      const avgPrice = prices.reduce((a, b) => a! + b!, 0)! / prices.length;
      if (avgPrice < 50) {
        suggestions.push('affordable gifts under $50');
      } else if (avgPrice < 100) {
        suggestions.push('gifts $50-$100');
      } else {
        suggestions.push('premium gifts over $100');
      }
    }
  }

  // Add suggestions based on interests and preferences
  if (gifteeData.preferences.interests && gifteeData.preferences.interests.length > 0) {
    const topInterests = gifteeData.preferences.interests.slice(0, 3);
    suggestions.push(`${topInterests.join(' ')} gifts`);
    
    // Combine with occasion if provided
    if (occasion) {
      suggestions.push(`${occasion} gifts for ${topInterests[0]} lovers`);
    }
  }

  // Add suggestions based on gift preferences
  if (gifteeData.preferences.gift_preferences && gifteeData.preferences.gift_preferences.length > 0) {
    const highPriorityPrefs = gifteeData.preferences.gift_preferences
      .filter(pref => pref.importance === 'high')
      .map(pref => pref.category);
    
    if (highPriorityPrefs.length > 0) {
      suggestions.push(`${highPriorityPrefs.slice(0, 2).join(' ')} gifts`);
    }
  }

  // Generic fallback suggestions
  if (suggestions.length === 0) {
    if (occasion) {
      suggestions.push(`${occasion} gifts`, `thoughtful ${occasion} presents`);
    } else {
      suggestions.push('thoughtful gifts', 'unique gift ideas');
    }
  }

  return suggestions.slice(0, 5); // Return top 5 suggestions
};
