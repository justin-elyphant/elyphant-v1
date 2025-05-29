
import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/auth";
import { toast } from "sonner";

export interface RecipientProfile {
  id?: string;
  name: string;
  relationship: string;
  age_range?: string;
  interests?: string[];
  preferences?: any;
}

export interface AIGiftSearch {
  id?: string;
  search_query?: string;
  recipient_data?: any;
  occasion?: string;
  budget_range?: any;
  results?: any;
  was_successful?: boolean;
}

export const useGiftingData = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  // Save recipient profile
  const saveRecipientProfile = useCallback(async (profile: RecipientProfile) => {
    if (!user?.id) return null;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("recipient_profiles")
        .upsert({
          ...profile,
          user_id: user.id,
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;
      
      toast.success("Recipient profile saved!");
      return data;
    } catch (error) {
      console.error("Error saving recipient profile:", error);
      toast.error("Failed to save recipient profile");
      return null;
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // Get recipient profiles
  const getRecipientProfiles = useCallback(async () => {
    if (!user?.id) return [];

    try {
      const { data, error } = await supabase
        .from("recipient_profiles")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("Error fetching recipient profiles:", error);
      return [];
    }
  }, [user?.id]);

  // Save AI gift search
  const saveAIGiftSearch = useCallback(async (search: AIGiftSearch) => {
    if (!user?.id) return null;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("ai_gift_searches")
        .insert({
          ...search,
          user_id: user.id
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error("Error saving AI gift search:", error);
      return null;
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // Get AI gift searches
  const getAIGiftSearches = useCallback(async () => {
    if (!user?.id) return [];

    try {
      const { data, error } = await supabase
        .from("ai_gift_searches")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("Error fetching AI gift searches:", error);
      return [];
    }
  }, [user?.id]);

  // Update profile with gifting preferences
  const updateGiftingPreferences = useCallback(async (preferences: any) => {
    if (!user?.id) return null;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("profiles")
        .update({
          gift_giving_preferences: preferences,
          updated_at: new Date().toISOString()
        })
        .eq("id", user.id)
        .select()
        .single();

      if (error) throw error;
      
      toast.success("Gifting preferences updated!");
      return data;
    } catch (error) {
      console.error("Error updating gifting preferences:", error);
      toast.error("Failed to update preferences");
      return null;
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // Update AI interaction data
  const updateAIInteractionData = useCallback(async (data: any) => {
    if (!user?.id) return null;

    try {
      const { data: result, error } = await supabase
        .from("profiles")
        .update({
          ai_interaction_data: data,
          updated_at: new Date().toISOString()
        })
        .eq("id", user.id)
        .select()
        .single();

      if (error) throw error;
      return result;
    } catch (error) {
      console.error("Error updating AI interaction data:", error);
      return null;
    }
  }, [user?.id]);

  return {
    loading,
    saveRecipientProfile,
    getRecipientProfiles,
    saveAIGiftSearch,
    getAIGiftSearches,
    updateGiftingPreferences,
    updateAIInteractionData
  };
};
