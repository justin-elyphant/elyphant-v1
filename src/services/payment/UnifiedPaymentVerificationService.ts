/**
 * Unified Payment Verification Service
 * 
 * Single source of truth for payment status checks.
 * Polls the Orders table which is kept up-to-date by stripe-webhook.
 * 
 * Features:
 * - Eventual consistency handling via polling
 * - Exponential backoff retry logic
 * - Unified error handling
 * - Direct database queries (no intermediate edge functions)
 * 
 * Usage:
 * - OrderStatusBadge refresh functionality
 * - Payment status checks
 * - Reconciliation processes
 */

import { supabase } from '@/integrations/supabase/client';

interface PaymentVerificationResult {
  success: boolean;
  payment_status: 'pending' | 'succeeded' | 'failed';
  order_status: string;
  order?: any;
  error?: string;
  source: 'stripe_api' | 'database' | 'webhook';
}

interface VerificationOptions {
  maxRetries?: number;
  retryDelays?: number[];
  showToast?: boolean;
  source?: string;
}

class UnifiedPaymentVerificationService {
  private readonly defaultRetryDelays = [0, 5000, 15000]; // immediate, 5s, 15s

  /**
   * Main verification function - single source of truth for payment verification
   */
  async verifyAndUpdatePaymentStatus(
    sessionId?: string,
    paymentIntentId?: string,
    options: VerificationOptions = {}
  ): Promise<PaymentVerificationResult> {
    const {
      maxRetries = 3,
      retryDelays = this.defaultRetryDelays,
      showToast = true,
      source = 'manual'
    } = options;

    console.log('🔍 [UnifiedPaymentVerification] Starting verification:', {
      hasSessionId: !!sessionId,
      hasPaymentIntentId: !!paymentIntentId,
      source,
      maxRetries
    });

    // Input validation
    if (!sessionId && !paymentIntentId) {
      return {
        success: false,
        payment_status: 'failed',
        order_status: 'payment_failed',
        error: 'Either session_id or payment_intent_id is required',
        source: 'database'
      };
    }

    // Attempt verification with retry logic
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`🔄 [UnifiedPaymentVerification] Attempt ${attempt}/${maxRetries}`);
        
        const result = await this.performVerification(sessionId, paymentIntentId, source);
        
        // Success case
        if (result.success && result.payment_status === 'succeeded') {
          console.log('✅ [UnifiedPaymentVerification] Verification successful');
          return result;
        }
        
        // Pending case - continue retrying if attempts remain
        if (result.payment_status === 'pending' && attempt < maxRetries) {
          const delay = retryDelays[attempt - 1] || 5000;
          console.log(`⏳ [UnifiedPaymentVerification] Payment pending, retrying in ${delay}ms`);
          await this.delay(delay);
          continue;
        }
        
        // Final attempt or non-pending result
        if (attempt === maxRetries) {
          console.log(`🔚 [UnifiedPaymentVerification] Final attempt completed:`, result);
          return result;
        }
        
      } catch (error) {
        console.error(`❌ [UnifiedPaymentVerification] Attempt ${attempt} failed:`, error);
        
        // If this is the final attempt, return the error
        if (attempt === maxRetries) {
          return {
            success: false,
            payment_status: 'failed',
            order_status: 'payment_failed',
            error: error instanceof Error ? error.message : 'Payment verification failed',
            source: 'stripe_api'
          };
        }
        
        // Otherwise, continue to next attempt after delay
        const delay = retryDelays[attempt - 1] || 5000;
        await this.delay(delay);
      }
    }

    // Fallback (should not reach here)
    return {
      success: false,
      payment_status: 'failed',
      order_status: 'payment_failed',
      error: 'Payment verification timeout',
      source: 'stripe_api'
    };
  }

  /**
   * Core verification logic - polls Orders table (updated by stripe-webhook)
   */
  private async performVerification(
    sessionId?: string,
    paymentIntentId?: string,
    source = 'manual'
  ): Promise<PaymentVerificationResult> {
    try {
      // Query Orders table directly - webhook keeps it updated
      let query = supabase.from('orders').select('id, order_number, status, payment_status, checkout_session_id, payment_intent_id, total_amount, created_at');
      
      if (sessionId) {
        query = query.eq('checkout_session_id', sessionId);
      } else if (paymentIntentId) {
        query = query.eq('payment_intent_id', paymentIntentId);
      }
      
      const { data: order, error } = await query.maybeSingle();

      if (error) {
        throw new Error(error.message);
      }

      if (order) {
        const paymentStatus = order.payment_status === 'succeeded' || order.payment_status === 'failed' 
          ? order.payment_status 
          : 'pending';
        
        return {
          success: order.payment_status === 'succeeded',
          payment_status: paymentStatus as 'pending' | 'succeeded' | 'failed',
          order_status: order.status,
          order: order,
          source: 'database'
        };
      } else {
        return {
          success: false,
          payment_status: 'pending',
          order_status: 'pending',
          source: 'database'
        };
      }
    } catch (error) {
      console.error('❌ [UnifiedPaymentVerification] Verification failed:', error);
      throw error;
    }
  }

  /**
   * Quick verification without retries - for real-time status checks
   */
  async quickVerification(
    sessionId?: string,
    paymentIntentId?: string
  ): Promise<PaymentVerificationResult> {
    return this.verifyAndUpdatePaymentStatus(sessionId, paymentIntentId, {
      maxRetries: 1,
      retryDelays: [0],
      showToast: false,
      source: 'quick_check'
    });
  }

  /**
   * Bulk verification for admin tools and reconciliation
   */
  async bulkVerification(
    orders: Array<{ id: string; sessionId?: string; paymentIntentId?: string }>
  ): Promise<Array<{ orderId: string; result: PaymentVerificationResult }>> {
    console.log(`🔍 [UnifiedPaymentVerification] Starting bulk verification for ${orders.length} orders`);
    
    const results = [];
    
    for (const order of orders) {
      try {
        const result = await this.quickVerification(order.sessionId, order.paymentIntentId);
        results.push({
          orderId: order.id,
          result
        });
      } catch (error) {
        results.push({
          orderId: order.id,
          result: {
            success: false,
            payment_status: 'failed' as const,
            order_status: 'payment_failed',
            error: error instanceof Error ? error.message : 'Verification failed',
            source: 'stripe_api' as const
          }
        });
      }
      
      // Small delay between requests to avoid rate limiting
      await this.delay(100);
    }
    
    console.log(`✅ [UnifiedPaymentVerification] Bulk verification completed: ${results.length} results`);
    return results;
  }

  /**
   * Get payment status without updating database - for status checks
   */
  async getPaymentStatus(
    sessionId?: string,
    paymentIntentId?: string
  ): Promise<{ status: string; verified: boolean }> {
    try {
      const result = await this.quickVerification(sessionId, paymentIntentId);
      return {
        status: result.payment_status,
        verified: result.success
      };
    } catch (error) {
      return {
        status: 'unknown',
        verified: false
      };
    }
  }

  /**
   * Utility function for delays
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Health check for the verification service
   */
  async healthCheck(): Promise<{ healthy: boolean; message: string }> {
    try {
      // Test database connection with a simple query
      const { error } = await supabase
        .from('orders')
        .select('id')
        .limit(1);
      
      return {
        healthy: !error,
        message: error ? `Service unhealthy: ${error.message}` : 'Service healthy'
      };
    } catch (error) {
      return {
        healthy: false,
        message: `Health check failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }
}

// Export singleton instance
export const unifiedPaymentVerificationService = new UnifiedPaymentVerificationService();

// Export types for other components
export type { PaymentVerificationResult, VerificationOptions };
