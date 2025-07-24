
/*
 * ========================================================================
 * ⚠️  DEPRECATED PAYMENT METHOD FORM - USE UnifiedPaymentForm
 * ========================================================================
 * 
 * ❌ DEPRECATED: This component is deprecated as of 2025-01-24
 * ✅ USE INSTEAD: UnifiedPaymentForm with mode="setup"
 * 
 * MIGRATION COMPLETED:
 * ✅ UnifiedPaymentForm consolidates ModernPaymentForm + PaymentMethodForm
 * ✅ Enhanced with setup mode, better error handling, and UX improvements
 * ✅ Integrated with UnifiedPaymentService protection measures
 * 
 * This wrapper is kept for backward compatibility only.
 * ========================================================================
 */

import React from 'react';
import UnifiedPaymentForm from './UnifiedPaymentForm';

interface PaymentMethodFormProps {
  onSuccess?: () => void;
}

const PaymentMethodForm = ({ onSuccess }: PaymentMethodFormProps) => {
  console.warn('DEPRECATED: PaymentMethodForm is deprecated. Use UnifiedPaymentForm with mode="setup" instead.');
  
  const handleSuccess = (paymentMethodId: string) => {
    onSuccess?.();
  };
  
  return (
    <UnifiedPaymentForm
      mode="setup"
      amount={0}
      onSuccess={handleSuccess}
      allowSaveCard={false}
    />
  );
};

export default PaymentMethodForm;
