
import { useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

// Type for the gift search session
export interface GiftSearchSession {
  id?: string;
  user_id?: string;
  occasion?: string;
  recipient_name?: string;
  recipient_type?: string;
  recipient_relationship?: string;
  recipient_age_range?: string;
  recipient_interests?: any[];        // Array of strings or objects
  excluded_items?: any[];             // Array of strings or objects
  budget_range?: string;
  extra_preferences?: any;
  search_results?: any;
  created_at?: string;
}

export const useGiftSearches = () => {
  // Save a wizard/onboarding session to Supabase
  const saveGiftSearch = useCallback(async (session: GiftSearchSession) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      const { error } = await supabase
        .from("gift_searches")
        .insert([{
          ...session,
          user_id: user.id,
          recipient_interests: (session.recipient_interests as any) || null,
          excluded_items: (session.excluded_items as any) || null,
          extra_preferences: (session.extra_preferences as any) || null,
          search_results: (session.search_results as any) || null,
        }]);
      if (error) throw error;
      return true;
    } catch (e: any) {
      console.error("Error saving gift search:", e);
      return false;
    }
  }, []);

  // Fetch all gift search sessions for the current user
  const getGiftSearches = useCallback(async () => {
    const { data, error } = await supabase
      .from("gift_searches")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      console.error("Error fetching gift searches:", error);
      return [];
    }
    return data;
  }, []);

  return {
    saveGiftSearch,
    getGiftSearches,
  };
};
