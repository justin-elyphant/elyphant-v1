import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/auth";
import { toast } from "sonner";
import { DataConsistencyState, ValidationRule } from "./types";
import {
  createProfileCompletenessRule,
  createWishlistConsistencyRule,
  createConnectionConsistencyRule,
  createAutoGiftRulesValidityRule
} from "./validationRules";

export function useDataConsistency() {
  const { user } = useAuth();
  const [state, setState] = useState<DataConsistencyState>({
    isValidating: false,
    lastValidated: null,
    issues: [],
    hasIssues: false,
  });

  // Create validation rules for the current user
  const getValidationRules = useCallback((): ValidationRule[] => {
    if (!user) return [];
    
    return [
      createProfileCompletenessRule(user.id),
      createWishlistConsistencyRule(user.id),
      createConnectionConsistencyRule(user.id),
      createAutoGiftRulesValidityRule(user.id)
    ];
  }, [user]);

  const validateData = useCallback(async (showToasts = false) => {
    if (!user) return;

    setState(prev => ({ ...prev, isValidating: true }));
    
    try {
      const issues: string[] = [];
      const validationRules = getValidationRules();
      
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
  }, [user, getValidationRules]);

  const fixIssues = useCallback(async () => {
    if (!user) return;
    
    try {
      const validationRules = getValidationRules();
      
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
  }, [user, getValidationRules, validateData]);

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