/**
 * Shared ZMA Error Classification Utility
 * Consolidates error classification logic for consistent handling across edge functions
 */

export interface ZmaErrorClassification {
  type: 'payment_required' | 'system_retry' | 'manual_review' | 'account_critical' | 'retryable_system';
  shouldRetry: boolean;
  userFriendlyMessage: string;
  adminMessage: string;
  requiresAdminIntervention?: boolean;
  alertLevel?: 'info' | 'warning' | 'critical';
  retryStrategy?: 'auto' | 'manual_only' | 'zinc_native';
  useZincNativeRetry?: boolean;
  retryDelay?: number;
  maxRetries?: number;
}

/**
 * Classify ZMA/Zinc errors into actionable categories
 * Simplified to essential categories for reliable error handling
 */
export function classifyZmaError(zincResult: any): ZmaErrorClassification {
  const errorCode = zincResult.code;
  const errorMessage = zincResult.message || '';
  
  // Account-level errors requiring immediate admin intervention
  if (errorCode === 'insufficient_zma_balance') {
    return {
      type: 'account_critical',
      shouldRetry: false,
      requiresAdminIntervention: true,
      alertLevel: 'critical',
      retryStrategy: 'manual_only',
      userFriendlyMessage: 'Account requires attention. Customer service has been notified and will resolve this shortly.',
      adminMessage: 'ZMA account balance insufficient - requires immediate funding or account verification'
    };
  }

  // Internal Zinc/Amazon errors - retry after delay
  if (errorCode === 'internal_error') {
    return {
      type: 'retryable_system',
      shouldRetry: true,
      useZincNativeRetry: false,
      retryDelay: 7200, // 2 hours for internal errors
      maxRetries: 2,
      alertLevel: 'warning',
      userFriendlyMessage: 'Amazon or Zinc is experiencing technical issues. We\'ll automatically retry your order.',
      adminMessage: `Internal Zinc/Amazon error: ${errorMessage} - auto-retry scheduled`
    };
  }

  // System overload - use Zinc native retry
  if (errorCode === 'zma_temporarily_overloaded') {
    return {
      type: 'retryable_system',
      shouldRetry: true,
      useZincNativeRetry: true,
      retryDelay: 3600, // 1 hour
      maxRetries: 3,
      alertLevel: 'warning',
      userFriendlyMessage: 'The ordering system is temporarily at capacity. We\'ll retry your order automatically.',
      adminMessage: 'ZMA system overloaded - monitoring retry success rates'
    };
  }

  // Network/timeout errors - standard retry
  if (errorCode?.includes('timeout') || errorCode?.includes('server_error') || 
      errorCode?.includes('unavailable') || errorCode?.includes('network')) {
    return {
      type: 'retryable_system',
      shouldRetry: true,
      useZincNativeRetry: false,
      retryDelay: 1800, // 30 minutes
      maxRetries: 2,
      alertLevel: 'info',
      userFriendlyMessage: 'A temporary system issue occurred. We\'ll retry your order automatically.',
      adminMessage: `System error - auto-retry enabled: ${errorCode} - ${errorMessage}`
    };
  }
  
  // Category 1: payment_required - User action needed
  if (errorCode?.includes('invalid') || errorCode?.includes('payment') || 
      errorCode?.includes('address') || errorCode?.includes('product_not_available')) {
    return {
      type: 'payment_required',
      shouldRetry: false,
      userFriendlyMessage: 'There was an issue with your order details. Please check and try again.',
      adminMessage: `User/Account error requiring attention: ${errorCode} - ${errorMessage}`
    };
  }
  
  // Category 3: manual_review - Admin intervention required (default)
  return {
    type: 'manual_review',
    shouldRetry: false,
    userFriendlyMessage: 'An unexpected error occurred with your order. Customer service has been notified.',
    adminMessage: `Unknown error requiring investigation: ${errorCode} - ${errorMessage}`
  };
}