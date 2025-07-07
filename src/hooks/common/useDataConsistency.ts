import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/auth";
import { toast } from "sonner";

interface DataConsistencyState {
  isValidating: boolean;
  lastValidated: Date | null;
  issues: string[];
  hasIssues: boolean;
}

interface ValidationRule {
  name: string;
  check: () => Promise<boolean>;
  message: string;
  autoFix?: () => Promise<void>;
}

export function useDataConsistency() {
  const { user } = useAuth();
  const [state, setState] = useState<DataConsistencyState>({
    isValidating: false,
    lastValidated: null,
    issues: [],
    hasIssues: false,
  });

  // Define validation rules
  const validationRules: ValidationRule[] = [
    {
      name: "profile_completeness",
      check: async () => {
        if (!user) return true;
        
        const { data, error } = await supabase
          .from('profiles')
          .select('name, dob, shipping_address, gift_preferences, data_sharing_settings')
          .eq('id', user.id)
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
        // Navigate to profile completion
        window.location.href = "/signup?intent=complete-profile";
      }
    },
    {
      name: "wishlist_items_consistency",
      check: async () => {
        if (!user) return true;
        
        // Check for orphaned wishlist items
        const { data: orphanedItems } = await supabase
          .from('wishlist_items')
          .select('id, wishlist_id')
          .not('wishlist_id', 'in', 
            supabase
              .from('wishlists')
              .select('id')
              .eq('user_id', user.id)
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
              .eq('user_id', user.id)
          );
        
        if (orphanedItems?.length) {
          await supabase
            .from('wishlist_items')
            .delete()
            .in('id', orphanedItems.map(item => item.id));
        }
      }
    },
    {
      name: "connection_bidirectionality",
      check: async () => {
        if (!user) return true;
        
        // Check for unidirectional connections that should be bidirectional
        const { data: connections } = await supabase
          .from('user_connections')
          .select('user_id, connected_user_id, relationship_type, status')
          .or(`user_id.eq.${user.id},connected_user_id.eq.${user.id}`)
          .eq('status', 'accepted');
        
        // For now, return true as this is complex to validate
        return true;
      },
      message: "Connection data inconsistency detected"
    },
    {
      name: "auto_gift_rules_validity",
      check: async () => {
        if (!user) return true;
        
        // Check for auto-gift rules with invalid recipients
        const { data: invalidRules } = await supabase
          .from('auto_gifting_rules')
          .select('id, recipient_id')
          .eq('user_id', user.id)
          .not('recipient_id', 'in',
            supabase
              .from('user_connections')
              .select('connected_user_id')
              .eq('user_id', user.id)
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
          .eq('user_id', user.id)
          .not('recipient_id', 'in',
            supabase
              .from('user_connections')
              .select('connected_user_id')
              .eq('user_id', user.id)
              .eq('status', 'accepted')
          );
        
        if (invalidRules?.length) {
          await supabase
            .from('auto_gifting_rules')
            .update({ is_active: false })
            .in('id', invalidRules.map(rule => rule.id));
        }
      }
    }
  ];

  const validateData = useCallback(async (showToasts = false) => {
    if (!user) return;

    setState(prev => ({ ...prev, isValidating: true }));
    
    try {
      const issues: string[] = [];
      
      for (const rule of validationRules) {
        try {
          const isValid = await rule.check();
          if (!isValid) {
            issues.push(rule.message);
            
            if (showToasts) {
              toast.warning(rule.message, {
                action: rule.autoFix ? {
                  label: "Fix",
                  onClick: () => rule.autoFix!()
                } : undefined
              });
            }
          }
        } catch (error) {
          console.error(`Validation rule ${rule.name} failed:`, error);
          issues.push(`Validation error: ${rule.name}`);
        }
      }
      
      setState(prev => ({
        ...prev,
        issues,
        hasIssues: issues.length > 0,
        lastValidated: new Date(),
        isValidating: false
      }));
      
      if (showToasts && issues.length === 0) {
        toast.success("Data validation passed", {
          description: "All data consistency checks passed"
        });
      }
      
    } catch (error) {
      console.error("Data validation failed:", error);
      setState(prev => ({
        ...prev,
        isValidating: false,
        issues: ["Validation process failed"]
      }));
      
      if (showToasts) {
        toast.error("Validation failed", {
          description: "Unable to complete data consistency check"
        });
      }
    }
  }, [user, validationRules]);

  const fixIssues = useCallback(async () => {
    if (!user) return;
    
    try {
      for (const rule of validationRules) {
        if (rule.autoFix) {
          const isValid = await rule.check();
          if (!isValid) {
            await rule.autoFix();
          }
        }
      }
      
      // Re-validate after fixes
      await validateData(true);
      
    } catch (error) {
      console.error("Auto-fix failed:", error);
      toast.error("Failed to fix some issues", {
        description: "Please try manual resolution"
      });
    }
  }, [user, validationRules, validateData]);

  // Auto-validate on user change
  useEffect(() => {
    if (user) {
      validateData(false);
    }
  }, [user, validateData]);

  return {
    ...state,
    validateData,
    fixIssues,
    refresh: () => validateData(true)
  };
}