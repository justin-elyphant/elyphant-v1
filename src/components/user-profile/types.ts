
import { Profile } from "@/types/profile";

// Define types for recently viewed items 
export interface RecentlyViewedItem {
  id: string;
  product_id: string;
  viewed_at: string;
  product_data: {
    title: string;
    price?: number;
    image_url?: string;
    brand?: string;
  };
}

// Helper function to get recently viewed items
export function getRecentlyViewed(profile: Profile | null): RecentlyViewedItem[] {
  if (!profile || !profile.recently_viewed) {
    return [];
  }
  
  // Return the recently viewed items array
  return Array.isArray(profile.recently_viewed) ? profile.recently_viewed : [];
}

// Add the recently_viewed property to the Profile type
declare module "@/types/profile" {
  interface Profile {
    recently_viewed?: RecentlyViewedItem[];
  }
}
