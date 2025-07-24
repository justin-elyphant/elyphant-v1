# Data Integrity System Migration Guide

## Overview
Phase 4 introduces a unified data integrity system that consolidates validation, error handling, and cache management into a cohesive, efficient system.

## Key Benefits
- **Unified Validation**: Consistent validation logic across all data types
- **Smart Error Handling**: Context-aware error management with automatic retry
- **Intelligent Caching**: Optimized cache management with dependency tracking
- **Performance Monitoring**: Built-in metrics and optimization insights
- **Gradual Migration**: Backward compatibility during transition

## Migration Strategy

### 1. Replace useDataConsistency Hook

**Before (Deprecated):**
```typescript
import { useDataConsistency } from "@/hooks/common/dataConsistency";

function MyComponent() {
  const { validateData, fixIssues, refresh } = useDataConsistency();
  
  // Manual validation calls
  const handleValidate = async () => {
    await validateData(true);
  };
}
```

**After (Unified):**
```typescript
import { useUnifiedDataIntegrity } from "@/hooks/useUnifiedDataIntegrity";

function MyComponent() {
  const { 
    validateDataConsistency, 
    fixIssues, 
    refresh,
    isValidating,
    hasIssues,
    issues
  } = useUnifiedDataIntegrity({
    autoValidateOnMount: true,
    showToasts: true,
    autoFix: false
  });
  
  // Automatic validation with enhanced options
  const handleValidate = async () => {
    await validateDataConsistency({ showToasts: true });
  };
}
```

### 2. Replace useProfileValidation Hook

**Before (Deprecated):**
```typescript
import { useProfileValidation } from "@/hooks/profile/useProfileValidation";

function ProfileForm() {
  const { validateProfileData, errors, isValid } = useProfileValidation();
  
  const handleSubmit = async (data) => {
    if (validateProfileData(data)) {
      // Submit data
    }
  };
}
```

**After (Unified):**
```typescript
import { useUnifiedDataIntegrity } from "@/hooks/useUnifiedDataIntegrity";

function ProfileForm() {
  const { validateData, hasIssues, issues } = useUnifiedDataIntegrity();
  
  const handleSubmit = async (data) => {
    const result = await validateData(data, {
      dataType: 'profile',
      operation: 'update'
    });
    
    if (result.isValid) {
      // Submit data
    }
  };
}
```

### 3. Replace Profile Step Validation

**Before (Deprecated):**
```typescript
import { validateProfileStep } from "@/components/profile-setup/utils/sharedValidation";

function ProfileSetup() {
  const handleStepValidation = (step: number, data: any) => {
    return validateProfileStep(step, data);
  };
}
```

**After (Unified):**
```typescript
import { useUnifiedDataIntegrity } from "@/hooks/useUnifiedDataIntegrity";

function ProfileSetup() {
  const { validateProfileStep } = useUnifiedDataIntegrity();
  
  const handleStepValidation = async (step: number, data: any) => {
    const result = await validateProfileStep(step, data);
    return result.isValid;
  };
}
```

### 4. Error Handling Migration

**Before (Manual):**
```typescript
import { toast } from "sonner";

function DataComponent() {
  const handleError = (error: Error) => {
    console.error("Operation failed:", error);
    toast.error("Something went wrong");
  };
}
```

**After (Unified):**
```typescript
import { useUnifiedDataIntegrity } from "@/hooks/useUnifiedDataIntegrity";

function DataComponent() {
  const { validateData } = useUnifiedDataIntegrity({
    showToasts: true // Automatic error handling
  });
  
  // Errors are automatically handled with context-aware messages
  const handleOperation = async (data) => {
    try {
      await validateData(data, { dataType: 'profile', operation: 'update' });
    } catch (error) {
      // Error is automatically logged and shown to user
    }
  };
}
```

### 5. Cache Management Migration

**Before (Manual):**
```typescript
import { unifiedDataService } from '@/services/unified/UnifiedDataService';

function DataComponent() {
  const handleCacheInvalidation = () => {
    unifiedDataService.invalidateCache();
  };
}
```

**After (Unified):**
```typescript
import { useUnifiedDataIntegrity } from "@/hooks/useUnifiedDataIntegrity";

function DataComponent() {
  const { invalidateCache, clearCache, getCachedData } = useUnifiedDataIntegrity();
  
  // Smart cache invalidation
  const handleUpdate = async () => {
    invalidateCache('tag:user-data');
    // or invalidateCache('dep:user-123');
  };
  
  // Automatic cache management
  const loadData = async () => {
    return await getCachedData('user-profile', async () => {
      // Data loader function
      return await fetchUserProfile();
    });
  };
}
```

## Advanced Features

### 1. Performance Monitoring

```typescript
import { useUnifiedDataIntegrity } from "@/hooks/useUnifiedDataIntegrity";

function AdminDashboard() {
  const { getPerformanceMetrics } = useUnifiedDataIntegrity();
  
  const handleShowMetrics = () => {
    const metrics = getPerformanceMetrics();
    console.log("Performance comparison:", metrics);
  };
}
```

### 2. Custom Validation Rules

```typescript
import { unifiedDataValidationService } from "@/services/unified/UnifiedDataValidationService";
import { z } from "zod";

// Register custom schema
unifiedDataValidationService.registerSchema('custom-data', z.object({
  field1: z.string(),
  field2: z.number()
}));

// Use in component
const result = await validateData(data, { dataType: 'custom-data', operation: 'create' });
```

### 3. Smart Cache Invalidation

```typescript
import { unifiedCacheManagementService } from "@/services/unified/UnifiedCacheManagementService";

// Smart invalidation based on data relationships
unifiedCacheManagementService.smartInvalidate('profile', 'update', userId);
```

## Migration Checklist

- [ ] Replace `useDataConsistency` with `useUnifiedDataIntegrity`
- [ ] Replace `useProfileValidation` with `useUnifiedDataIntegrity`
- [ ] Replace `validateProfileStep` with `dataIntegrityRouter.validateProfileStep`
- [ ] Update error handling to use unified service
- [ ] Migrate cache management to unified service
- [ ] Test all validation scenarios
- [ ] Remove deprecated imports
- [ ] Update tests to use new API

## Backward Compatibility

The unified system provides backward compatibility during the migration period:

- Legacy hooks continue to work but show deprecation warnings
- Gradual migration is supported through the `DataIntegrityRouter`
- Performance metrics help compare legacy vs unified performance
- Migration flags allow selective enablement of unified features

## Performance Benefits

- **Reduced Bundle Size**: Consolidated validation logic
- **Improved Caching**: Smart invalidation reduces redundant API calls
- **Better Error Handling**: Context-aware error messages and retry logic
- **Optimized Validation**: Shared validation rules across components
- **Enhanced Debugging**: Centralized error logging and metrics

## Support

For migration questions or issues, check the performance metrics to compare legacy vs unified performance:

```typescript
const metrics = getPerformanceMetrics();
console.log("Migration performance impact:", metrics);
```

The unified system is designed to be more efficient and provide better user experience while maintaining full backward compatibility during the transition period.