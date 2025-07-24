
/*
 * ========================================================================
 * ⚠️  DEPRECATED MODERN PAYMENT FORM - USE UnifiedPaymentForm
 * ========================================================================
 * 
 * ❌ DEPRECATED: This component is deprecated as of 2025-01-24
 * ✅ USE INSTEAD: UnifiedPaymentForm for all payment processing
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

interface ModernPaymentFormProps {
  clientSecret: string;
  amount: number;
  onSuccess: (paymentIntentId: string, saveCard?: boolean) => void;
  onError?: (error: string) => void;
  allowSaveCard?: boolean;
  buttonText?: string;
  isProcessing?: boolean;
  onProcessingChange?: (processing: boolean) => void;
}

const ModernPaymentForm: React.FC<ModernPaymentFormProps> = (props) => {
  console.warn('DEPRECATED: ModernPaymentForm is deprecated. Use UnifiedPaymentForm instead.');
  
  return <UnifiedPaymentForm {...props} mode="payment" />;
};

export default ModernPaymentForm;
