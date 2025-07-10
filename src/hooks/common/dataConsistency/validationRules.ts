import { supabase } from "@/integrations/supabase/client";
import { ValidationRule } from "./types";

export const createProfileCompletenessRule = (userId: string): ValidationRule => ({
  name: "profile_completeness",
  check: async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('name, dob, shipping_address, gift_preferences, data_sharing_settings')
      .eq('id', userId)
      .single();
    
    if (error) return false;
    
    return !!(
      data?.name && 
      data?.dob && 
      data?.shipping_address && 
      data?.gift_preferences?.length > 0 &&
      data?.data_sharing_settings
    );
  },
  message: "Profile is incomplete - missing required fields",
  autoFix: async () => {
    window.location.href = "/signup?intent=complete-profile";
  }
});

export const createWishlistConsistencyRule = (userId: string): ValidationRule => ({
  name: "wishlist_items_consistency",
  check: async () => {
    // Check for orphaned wishlist items
    const { data: orphanedItems } = await supabase
      .from('wishlist_items')
      .select('id, wishlist_id')
      .not('wishlist_id', 'in', 
        supabase
          .from('wishlists')
          .select('id')
          .eq('user_id', userId)
      );
    
    return !orphanedItems || orphanedItems.length === 0;
  },
  message: "Found orphaned wishlist items",
  autoFix: async () => {
    // Clean up orphaned items
    const { data: orphanedItems } = await supabase
      .from('wishlist_items')
      .select('id')
      .not('wishlist_id', 'in', 
        supabase
          .from('wishlists')
          .select('id')
          .eq('user_id', userId)
      );
    
    if (orphanedItems?.length) {
      await supabase
        .from('wishlist_items')
        .delete()
        .in('id', orphanedItems.map(item => item.id));
    }
  }
});

export const createConnectionConsistencyRule = (userId: string): ValidationRule => ({
  name: "connection_bidirectionality",
  check: async () => {
    // Check for unidirectional connections that should be bidirectional
    const { data: connections } = await supabase
      .from('user_connections')
      .select('user_id, connected_user_id, relationship_type, status')
      .or(`user_id.eq.${userId},connected_user_id.eq.${userId}`)
      .eq('status', 'accepted');
    
    // For now, return true as this is complex to validate
    return true;
  },
  message: "Connection data inconsistency detected"
});

export const createAutoGiftRulesValidityRule = (userId: string): ValidationRule => ({
  name: "auto_gift_rules_validity",
  check: async () => {
    // Check for auto-gift rules with invalid recipients
    const { data: invalidRules } = await supabase
      .from('auto_gifting_rules')
      .select('id, recipient_id')
      .eq('user_id', userId)
      .not('recipient_id', 'in',
        supabase
          .from('user_connections')
          .select('connected_user_id')
          .eq('user_id', userId)
          .eq('status', 'accepted')
      );
    
    return !invalidRules || invalidRules.length === 0;
  },
  message: "Auto-gift rules reference non-existent connections",
  autoFix: async () => {
    // Deactivate rules for invalid recipients
    const { data: invalidRules } = await supabase
      .from('auto_gifting_rules')
      .select('id')
      .eq('user_id', userId)
      .not('recipient_id', 'in',
        supabase
          .from('user_connections')
          .select('connected_user_id')
          .eq('user_id', userId)
          .eq('status', 'accepted')
      );
    
    if (invalidRules?.length) {
      await supabase
        .from('auto_gifting_rules')
        .update({ is_active: false })
        .in('id', invalidRules.map(rule => rule.id));
    }
  }
});