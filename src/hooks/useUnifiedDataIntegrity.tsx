import { useState, useCallback, useEffect } from "react";
import { useAuth } from "@/contexts/auth";
import { toast } from "sonner";
import { 
  dataIntegrityRouter, 
  DataIntegrityOptions 
} from "@/services/unified/DataIntegrityRouter";
import { 
  ValidationResult, 
  ValidationContext 
} from "@/services/unified/UnifiedDataValidationService";
import { unifiedCacheManagementService } from "@/services/unified/UnifiedCacheManagementService";

export interface DataIntegrityState {
  isValidating: boolean;
  lastValidated: Date | null;
  issues: string[];
  warnings: string[];
  hasIssues: boolean;
  hasWarnings: boolean;
}

export interface UseUnifiedDataIntegrityOptions extends DataIntegrityOptions {
  autoValidateOnMount?: boolean;
  validationInterval?: number;
}

export function useUnifiedDataIntegrity(options: UseUnifiedDataIntegrityOptions = {}) {
  const { user } = useAuth();
  const {
    autoValidateOnMount = true,
    validationInterval = 0,
    useUnified = true,
    skipCache = false,
    showToasts = false,
    autoFix = false
  } = options;

  const [state, setState] = useState<DataIntegrityState>({
    isValidating: false,
    lastValidated: null,
    issues: [],
    warnings: [],
    hasIssues: false,
    hasWarnings: false
  });

  /**
   * Validate data with unified service
   */
  const validateData = useCallback(async (
    data: any,
    context: ValidationContext,
    customOptions?: DataIntegrityOptions
  ): Promise<ValidationResult> => {
    const finalOptions = { useUnified, skipCache, showToasts, autoFix, ...customOptions };
    
    setState(prev => ({ ...prev, isValidating: true }));
    
    try {
      const result = await dataIntegrityRouter.validateData(data, context, finalOptions);
      
      setState(prev => ({
        ...prev,
        isValidating: false,
        lastValidated: new Date(),
        issues: result.errors,
        warnings: result.warnings || [],
        hasIssues: result.errors.length > 0,
        hasWarnings: (result.warnings || []).length > 0
      }));
      
      return result;
    } catch (error) {
      setState(prev => ({
        ...prev,
        isValidating: false,
        issues: ['Validation failed'],
        warnings: [],
        hasIssues: true,
        hasWarnings: false
      }));
      
      throw error;
    }
  }, [useUnified, skipCache, showToasts, autoFix]);

  /**
   * Validate profile step
   */
  const validateProfileStep = useCallback(async (
    step: number,
    data: any,
    customOptions?: DataIntegrityOptions
  ): Promise<ValidationResult> => {
    const finalOptions = { useUnified, skipCache, showToasts, autoFix, ...customOptions };
    
    setState(prev => ({ ...prev, isValidating: true }));
    
    try {
      const result = await dataIntegrityRouter.validateProfileStep(step, data, finalOptions);
      
      setState(prev => ({
        ...prev,
        isValidating: false,
        lastValidated: new Date(),
        issues: result.errors,
        warnings: result.warnings || [],
        hasIssues: result.errors.length > 0,
        hasWarnings: (result.warnings || []).length > 0
      }));
      
      return result;
    } catch (error) {
      setState(prev => ({
        ...prev,
        isValidating: false,
        issues: ['Profile step validation failed'],
        warnings: [],
        hasIssues: true,
        hasWarnings: false
      }));
      
      throw error;
    }
  }, [useUnified, skipCache, showToasts, autoFix]);

  /**
   * Validate data consistency
   */
  const validateDataConsistency = useCallback(async (
    customOptions?: DataIntegrityOptions
  ): Promise<ValidationResult> => {
    if (!user) {
      return { isValid: false, errors: ['User not authenticated'] };
    }

    const finalOptions = { useUnified, skipCache, showToasts, autoFix, ...customOptions };
    
    setState(prev => ({ ...prev, isValidating: true }));
    
    try {
      const result = await dataIntegrityRouter.validateDataConsistency(user.id, finalOptions);
      
      setState(prev => ({
        ...prev,
        isValidating: false,
        lastValidated: new Date(),
        issues: result.errors,
        warnings: result.warnings || [],
        hasIssues: result.errors.length > 0,
        hasWarnings: (result.warnings || []).length > 0
      }));
      
      if (result.isValid && showToasts) {
        toast.success("Data consistency check passed", {
          description: "All data integrity checks passed"
        });
      }
      
      return result;
    } catch (error) {
      setState(prev => ({
        ...prev,
        isValidating: false,
        issues: ['Data consistency check failed'],
        warnings: [],
        hasIssues: true,
        hasWarnings: false
      }));
      
      throw error;
    }
  }, [user, useUnified, skipCache, showToasts, autoFix]);

  /**
   * Auto-fix data issues
   */
  const fixIssues = useCallback(async (): Promise<ValidationResult> => {
    if (!user) {
      return { isValid: false, errors: ['User not authenticated'] };
    }

    try {
      // First try to fix issues automatically
      const result = await dataIntegrityRouter.validateDataConsistency(user.id, {
        useUnified,
        skipCache,
        showToasts: true,
        autoFix: true
      });
      
      if (result.isValid) {
        toast.success("Issues resolved", {
          description: "Data integrity issues have been automatically fixed"
        });
      }
      
      return result;
    } catch (error) {
      toast.error("Failed to fix issues", {
        description: "Please try manual resolution"
      });
      throw error;
    }
  }, [user, useUnified, skipCache]);

  /**
   * Get cached data with automatic cache management
   */
  const getCachedData = useCallback(async <T>(
    key: string,
    dataLoader: () => Promise<T>,
    customOptions?: DataIntegrityOptions
  ): Promise<T> => {
    const finalOptions = { useUnified, skipCache, ...customOptions };
    return await dataIntegrityRouter.getCachedData(key, dataLoader, finalOptions);
  }, [useUnified, skipCache]);

  /**
   * Invalidate cache
   */
  const invalidateCache = useCallback((pattern: string, customOptions?: DataIntegrityOptions): void => {
    const finalOptions = { useUnified, ...customOptions };
    dataIntegrityRouter.invalidateCache(pattern, finalOptions);
  }, [useUnified]);

  /**
   * Clear all cache
   */
  const clearCache = useCallback((): void => {
    if (useUnified) {
      unifiedCacheManagementService.clear();
    }
  }, [useUnified]);

  /**
   * Get performance metrics
   */
  const getPerformanceMetrics = useCallback(() => {
    return dataIntegrityRouter.getPerformanceMetrics();
  }, []);

  /**
   * Refresh all data
   */
  const refresh = useCallback(async (): Promise<ValidationResult> => {
    // Clear cache first
    clearCache();
    
    // Then revalidate
    return await validateDataConsistency({ showToasts: true });
  }, [clearCache, validateDataConsistency]);

  // Auto-validate on mount
  useEffect(() => {
    if (autoValidateOnMount && user) {
      validateDataConsistency({ showToasts: false });
    }
  }, [autoValidateOnMount, user, validateDataConsistency]);

  // Set up validation interval
  useEffect(() => {
    if (validationInterval > 0 && user) {
      const interval = setInterval(() => {
        validateDataConsistency({ showToasts: false });
      }, validationInterval);

      return () => clearInterval(interval);
    }
  }, [validationInterval, user, validateDataConsistency]);

  return {
    // State
    ...state,
    
    // Validation methods
    validateData,
    validateProfileStep,
    validateDataConsistency,
    
    // Data management
    getCachedData,
    invalidateCache,
    clearCache,
    
    // Issue resolution
    fixIssues,
    refresh,
    
    // Performance monitoring
    getPerformanceMetrics
  };
}