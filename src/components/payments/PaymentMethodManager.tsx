
/*
 * ========================================================================
 * ⚠️  DEPRECATED PAYMENT METHOD MANAGER - USE UnifiedPaymentMethodManager
 * ========================================================================
 * 
 * ❌ DEPRECATED: This component is deprecated as of 2025-01-24
 * ✅ USE INSTEAD: UnifiedPaymentMethodManager for all payment method management
 * 
 * MIGRATION COMPLETED:
 * ✅ UnifiedPaymentMethodManager provides all functionality of this component
 * ✅ Enhanced with better UX, error handling, and selection capabilities
 * ✅ Integrated with UnifiedPaymentService protection measures
 * 
 * This wrapper is kept for backward compatibility only.
 * ========================================================================
 */

import React from 'react';
import UnifiedPaymentMethodManager from './UnifiedPaymentMethodManager';

const PaymentMethodManager = () => {
  console.warn('DEPRECATED: PaymentMethodManager is deprecated. Use UnifiedPaymentMethodManager instead.');
  
  return <UnifiedPaymentMethodManager mode="management" />;
};

export default PaymentMethodManager;
