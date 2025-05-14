
import { Profile } from "@/types/profile";

export interface UserProfileWithActivity extends Profile {
  recently_viewed?: Array<{
    id: string;
    product_id: string;
    viewed_at: string;
    product_data: {
      id: string;
      title: string;
      price: number;
      image_url?: string;
      brand?: string;
      category?: string;
    };
  }>;
}

export function getRecentlyViewed(profile: Profile | null): any[] {
  if (!profile) return [];
  
  // For TypeScript, we need to cast or use a guard
  const profileWithActivity = profile as UserProfileWithActivity;
  return profileWithActivity.recently_viewed || [];
}
