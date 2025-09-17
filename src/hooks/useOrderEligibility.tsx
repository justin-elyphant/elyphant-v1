import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

interface OrderEligibility {
  canCancel: boolean;
  canAbort: boolean;
  abortReason?: string;
  isProcessingStage?: boolean;
  operationRecommendation?: 'abort' | 'cancel' | 'none';
  status?: string;
  zinc_status?: string;
}

export const useOrderEligibility = () => {
  const [isChecking, setIsChecking] = useState(false);

  const checkOrderEligibility = useCallback(async (orderId: string): Promise<OrderEligibility | null> => {
    setIsChecking(true);
    
    try {
      const { data, error } = await supabase
        .rpc('get_order_cancel_eligibility', { order_uuid: orderId });

      if (error) {
        console.error('Error checking order eligibility:', error);
        return null;
      }

      const eligibilityData = data as any; // Type assertion for Supabase RPC response

      return {
        canCancel: eligibilityData?.canCancel || false,
        canAbort: eligibilityData?.canAbort || false,
        abortReason: eligibilityData?.abortReason,
        isProcessingStage: eligibilityData?.isProcessingStage || false,
        operationRecommendation: eligibilityData?.operationRecommendation || 'none',
        status: eligibilityData?.status,
        zinc_status: eligibilityData?.zinc_status
      };
    } catch (error) {
      console.error('Unexpected error checking order eligibility:', error);
      return null;
    } finally {
      setIsChecking(false);
    }
  }, []);

  const canCancelOrder = useCallback((status: string, zincStatus?: string) => {
    // Enhanced logic that considers both status and zinc status
    const cancellableStatuses = ['pending', 'failed', 'retry_pending'];
    const prohibitedZincStatuses = ['shipped', 'delivered', 'cancelled'];
    
    return cancellableStatuses.includes(status.toLowerCase()) &&
           !prohibitedZincStatuses.includes(zincStatus?.toLowerCase() || '');
  }, []);

  const getOrderActionButton = useCallback((status: string, zincStatus?: string, isProcessingStage?: boolean) => {
    if (['shipped', 'delivered', 'cancelled'].includes(status.toLowerCase()) ||
        ['shipped', 'delivered', 'cancelled'].includes(zincStatus?.toLowerCase() || '')) {
      return { type: 'none', label: 'Cannot be cancelled', disabled: true };
    }

    if (isProcessingStage && status.toLowerCase() === 'processing') {
      return { type: 'abort', label: 'Abort Order', disabled: false };
    }

    if (canCancelOrder(status, zincStatus)) {
      return { type: 'cancel', label: 'Cancel Order', disabled: false };
    }

    return { type: 'none', label: 'Cannot be cancelled', disabled: true };
  }, [canCancelOrder]);

  return {
    checkOrderEligibility,
    canCancelOrder,
    getOrderActionButton,
    isChecking
  };
};