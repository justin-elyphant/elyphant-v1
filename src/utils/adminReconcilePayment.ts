import { supabase } from '@/integrations/supabase/client';

/**
 * One-time admin utility to reconcile orphaned payment
 * Run this once to fix the current issue, then delete this file
 */
export const reconcileOrphanedPayment = async () => {
  try {
    console.log('🔧 Reconciling orphaned payment...');
    
    // Step 1: Reconcile payment with order
    const { data: reconcileData, error: reconcileError } = await supabase.functions.invoke(
      'admin-reconcile-payment',
      {
        body: {
          orderId: '2c354a64-61cd-4580-b0d8-6952328208a2', // ORD-20251009-7527
          paymentIntentId: 'pi_3SGKfWJPK0Zkd1vc0gLkCKmA', // Successful payment
          action: 'reconcile'
        }
      }
    );

    if (reconcileError) {
      console.error('❌ Reconcile failed:', reconcileError);
      throw reconcileError;
    }

    console.log('✅ Payment reconciled:', reconcileData);

    // Step 2: Delete duplicate orders
    const { data: cleanupData, error: cleanupError } = await supabase.functions.invoke(
      'admin-reconcile-payment',
      {
        body: {
          orderIds: [
            '00f80a3f-8af7-4cba-9840-6ca2575a877b', // ORD-20251009-4359
            '508c9747-ef8c-4045-aea5-31d4e79d2100'  // ORD-20251009-6878
          ],
          action: 'cleanup'
        }
      }
    );

    if (cleanupError) {
      console.error('❌ Cleanup failed:', cleanupError);
      throw cleanupError;
    }

    console.log('✅ Duplicate orders deleted:', cleanupData);

    return {
      success: true,
      reconcile: reconcileData,
      cleanup: cleanupData
    };

  } catch (error) {
    console.error('💥 Reconciliation failed:', error);
    throw error;
  }
};

// Auto-run on import (one-time fix)
if (typeof window !== 'undefined') {
  console.log('🚀 Running one-time payment reconciliation...');
  reconcileOrphanedPayment()
    .then(() => console.log('✅ Reconciliation complete!'))
    .catch(err => console.error('❌ Reconciliation failed:', err));
}
