import { unifiedDataValidationService, ValidationResult, ValidationContext } from "./UnifiedDataValidationService";
import { unifiedErrorHandlingService, ErrorContext } from "./UnifiedErrorHandlingService";
import { unifiedCacheManagementService } from "./UnifiedCacheManagementService";
import { toast } from "sonner";

// Legacy service imports for gradual migration
import { useDataConsistency } from "@/hooks/common/dataConsistency";
import { validateProfileStep } from "@/components/profile-setup/utils/sharedValidation";

export interface DataIntegrityOptions {
  useUnified?: boolean;
  skipCache?: boolean;
  showToasts?: boolean;
  autoFix?: boolean;
}

export class DataIntegrityRouter {
  private static instance: DataIntegrityRouter;
  private migrationFlags: Map<string, boolean> = new Map();
  private performanceMetrics: Map<string, { unified: number[], legacy: number[] }> = new Map();

  private constructor() {
    // Initialize migration flags - start with conservative migration
    this.migrationFlags.set('profile-validation', true);
    this.migrationFlags.set('data-consistency', true);
    this.migrationFlags.set('error-handling', true);
    this.migrationFlags.set('cache-management', true);
  }

  static getInstance(): DataIntegrityRouter {
    if (!this.instance) {
      this.instance = new DataIntegrityRouter();
    }
    return this.instance;
  }

  /**
   * Route validation requests to appropriate service
   */
  async validateData(
    data: any,
    context: ValidationContext,
    options: DataIntegrityOptions = {}
  ): Promise<ValidationResult> {
    const { useUnified = this.shouldUseUnified('profile-validation'), showToasts = false } = options;
    const startTime = Date.now();

    try {
      let result: ValidationResult;

      if (useUnified) {
        // Use unified validation service
        result = unifiedDataValidationService.validateData(data, context);
        this.recordMetric('profile-validation', 'unified', Date.now() - startTime);
      } else {
        // Fallback to legacy validation
        result = await this.legacyValidateData(data, context);
        this.recordMetric('profile-validation', 'legacy', Date.now() - startTime);
      }

      // Handle errors through unified service if enabled
      if (!result.isValid && showToasts && this.shouldUseUnified('error-handling')) {
        await unifiedErrorHandlingService.handleError(
          new Error(result.errors[0]),
          {
            service: 'validation',
            operation: 'validate',
            userId: context.userId,
            severity: 'medium'
          },
          { showToast: true }
        );
      }

      return result;
    } catch (error) {
      // Handle errors through unified service
      if (this.shouldUseUnified('error-handling')) {
        return await unifiedErrorHandlingService.handleError(
          error as Error,
          {
            service: 'validation',
            operation: 'validate',
            userId: context.userId,
            severity: 'high'
          },
          { showToast: showToasts, fallbackValue: { isValid: false, errors: ['Validation failed'] } }
        );
      }

      throw error;
    }
  }

  /**
   * Route profile step validation
   */
  async validateProfileStep(
    step: number,
    data: any,
    options: DataIntegrityOptions = {}
  ): Promise<ValidationResult> {
    const { useUnified = this.shouldUseUnified('profile-validation') } = options;
    const startTime = Date.now();

    try {
      let result: ValidationResult;

      if (useUnified) {
        result = unifiedDataValidationService.validateProfileStep(step, data);
        this.recordMetric('profile-step-validation', 'unified', Date.now() - startTime);
      } else {
        // Legacy validation
        const isValid = validateProfileStep(step, data);
        result = {
          isValid,
          errors: isValid ? [] : [`Step ${step} validation failed`],
          sanitizedData: isValid ? data : null
        };
        this.recordMetric('profile-step-validation', 'legacy', Date.now() - startTime);
      }

      return result;
    } catch (error) {
      if (this.shouldUseUnified('error-handling')) {
        return await unifiedErrorHandlingService.handleError(
          error as Error,
          {
            service: 'validation',
            operation: 'profile-step',
            severity: 'medium'
          },
          { fallbackValue: { isValid: false, errors: ['Profile step validation failed'] } }
        );
      }

      throw error;
    }
  }

  /**
   * Route data consistency checks
   */
  async validateDataConsistency(
    userId: string,
    options: DataIntegrityOptions = {}
  ): Promise<ValidationResult> {
    const { useUnified = this.shouldUseUnified('data-consistency'), showToasts = false, autoFix = false } = options;
    const startTime = Date.now();

    try {
      let result: ValidationResult;

      if (useUnified) {
        result = await unifiedDataValidationService.validateDataConsistency(userId, showToasts);
        
        if (autoFix && !result.isValid) {
          const fixResult = await unifiedDataValidationService.autoFixDataIssues(userId);
          if (fixResult.isValid) {
            result = await unifiedDataValidationService.validateDataConsistency(userId, false);
          }
        }
        
        this.recordMetric('data-consistency', 'unified', Date.now() - startTime);
      } else {
        // Legacy approach would use useDataConsistency hook
        result = { isValid: true, errors: [], warnings: ['Legacy consistency check not implemented'] };
        this.recordMetric('data-consistency', 'legacy', Date.now() - startTime);
      }

      return result;
    } catch (error) {
      if (this.shouldUseUnified('error-handling')) {
        return await unifiedErrorHandlingService.handleError(
          error as Error,
          {
            service: 'validation',
            operation: 'consistency',
            userId,
            severity: 'high'
          },
          { showToast: showToasts, fallbackValue: { isValid: false, errors: ['Consistency check failed'] } }
        );
      }

      throw error;
    }
  }

  /**
   * Route cache operations
   */
  async getCachedData<T>(
    key: string,
    dataLoader: () => Promise<T>,
    options: DataIntegrityOptions = {}
  ): Promise<T> {
    const { useUnified = this.shouldUseUnified('cache-management'), skipCache = false } = options;

    if (skipCache) {
      return await dataLoader();
    }

    if (useUnified) {
      return await unifiedCacheManagementService.preload(key, dataLoader);
    } else {
      // Legacy cache approach
      return await dataLoader();
    }
  }

  /**
   * Route cache invalidation
   */
  invalidateCache(pattern: string, options: DataIntegrityOptions = {}): void {
    const { useUnified = this.shouldUseUnified('cache-management') } = options;

    if (useUnified) {
      if (pattern.includes('tag:')) {
        unifiedCacheManagementService.invalidateByTag(pattern.replace('tag:', ''));
      } else if (pattern.includes('dep:')) {
        unifiedCacheManagementService.invalidateByDependency(pattern.replace('dep:', ''));
      } else {
        unifiedCacheManagementService.invalidate(pattern);
      }
    } else {
      // Legacy cache invalidation
      console.log(`Legacy cache invalidation: ${pattern}`);
    }
  }

  /**
   * Enable/disable unified service for specific capability
   */
  enableUnifiedService(capability: string, enabled: boolean): void {
    this.migrationFlags.set(capability, enabled);
    
    toast.info(`Data integrity service updated`, {
      description: `${capability} ${enabled ? 'enabled' : 'disabled'} for unified service`
    });
  }

  /**
   * Get performance metrics
   */
  getPerformanceMetrics(): Record<string, { unified: number, legacy: number }> {
    const metrics: Record<string, { unified: number, legacy: number }> = {};
    
    for (const [key, values] of this.performanceMetrics.entries()) {
      metrics[key] = {
        unified: values.unified.length > 0 ? values.unified.reduce((a, b) => a + b) / values.unified.length : 0,
        legacy: values.legacy.length > 0 ? values.legacy.reduce((a, b) => a + b) / values.legacy.length : 0
      };
    }
    
    return metrics;
  }

  /**
   * Check if unified service should be used
   */
  private shouldUseUnified(capability: string): boolean {
    return this.migrationFlags.get(capability) ?? false;
  }

  /**
   * Legacy validation fallback
   */
  private async legacyValidateData(data: any, context: ValidationContext): Promise<ValidationResult> {
    // This would integrate with existing validation hooks
    // For now, return a basic validation result
    return {
      isValid: true,
      errors: [],
      warnings: ['Using legacy validation'],
      sanitizedData: data
    };
  }

  /**
   * Record performance metric
   */
  private recordMetric(operation: string, type: 'unified' | 'legacy', duration: number): void {
    if (!this.performanceMetrics.has(operation)) {
      this.performanceMetrics.set(operation, { unified: [], legacy: [] });
    }
    
    const metrics = this.performanceMetrics.get(operation)!;
    metrics[type].push(duration);
    
    // Keep only last 100 measurements
    if (metrics[type].length > 100) {
      metrics[type].shift();
    }
  }
}

export const dataIntegrityRouter = DataIntegrityRouter.getInstance();
