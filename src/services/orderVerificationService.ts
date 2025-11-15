
import { supabase } from '@/integrations/supabase/client';

interface OrderVerificationResult {
  orderId: string;
  zincOrderId?: string;
  verified: boolean;
  status?: string;
  error?: string;
}

class OrderVerificationService {
  private static instance: OrderVerificationService;
  private verificationQueue: string[] = [];
  private isProcessing = false;

  static getInstance(): OrderVerificationService {
    if (!OrderVerificationService.instance) {
      OrderVerificationService.instance = new OrderVerificationService();
    }
    return OrderVerificationService.instance;
  }

  /**
   * Schedule an order for verification after a delay
   */
  scheduleVerification(orderId: string, delayMinutes: number = 5) {
    console.log(`🕐 Scheduling verification for order ${orderId} in ${delayMinutes} minutes`);
    
    setTimeout(() => {
      this.addToQueue(orderId);
    }, delayMinutes * 60 * 1000);
  }

  /**
   * Add order to verification queue
   */
  private addToQueue(orderId: string) {
    if (!this.verificationQueue.includes(orderId)) {
      this.verificationQueue.push(orderId);
      console.log(`➕ Added order ${orderId} to verification queue`);
      
      // Start processing if not already running
      if (!this.isProcessing) {
        this.processQueue();
      }
    }
  }

  /**
   * Process the verification queue
   */
  private async processQueue() {
    if (this.isProcessing || this.verificationQueue.length === 0) {
      return;
    }

    this.isProcessing = true;
    console.log(`🔄 Processing verification queue (${this.verificationQueue.length} orders)`);

    while (this.verificationQueue.length > 0) {
      const orderId = this.verificationQueue.shift();
      if (orderId) {
        try {
          await this.verifyOrder(orderId);
          // Small delay between verifications to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 2000));
        } catch (error) {
          console.error(`❌ Error verifying order ${orderId}:`, error);
        }
      }
    }

    this.isProcessing = false;
    console.log(`✅ Verification queue processing complete`);
  }

  /**
   * Verify a specific order
   */
  async verifyOrder(orderId: string): Promise<OrderVerificationResult> {
    console.log(`🔍 Verifying order ${orderId}`);

    try {
      // Get order details from database
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .select('id, zinc_order_id, status')
        .eq('id', orderId)
        .single();

      if (orderError || !order) {
        throw new Error(`Order not found: ${orderError?.message}`);
      }

      if (!order.zinc_order_id) {
        return {
          orderId,
          verified: false,
          error: 'No Zinc order ID found'
        };
      }

      // Check status with Zinc
      const { data: statusResult, error: statusError } = await supabase.functions.invoke('order-monitor-v2', {
        body: {
          orderId: order.zinc_order_id
        }
      });

      if (statusError) {
        throw new Error(`Status check failed: ${statusError.message}`);
      }

      if (statusResult.success && statusResult.results && statusResult.results.length > 0) {
        const result = statusResult.results[0];
        
        console.log(`📋 Order ${orderId} verification result:`, result);

        // Handle different Zinc status responses
        if (result.status === 'request_processing') {
          // Order is actively processing - update our status and schedule next check
          await supabase
            .from('orders')
            .update({
              status: 'processing',
              zinc_status: 'request_processing',
              next_retry_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(), // Check again in 10 minutes
              updated_at: new Date().toISOString()
            })
            .eq('id', orderId);

          console.log(`🔄 Order ${orderId} is being processed by Zinc - updated status and scheduled next check`);
        }

        // Add verification note to order
        const { data: userData } = await supabase.auth.getUser();
        await supabase
          .from('order_notes')
          .insert({
            admin_user_id: userData?.user?.id || '00000000-0000-0000-0000-000000000000',
            order_id: orderId,
            note_content: `Automatic verification completed. Zinc status: ${result.status}. ${result.error ? `Error: ${result.error}` : result.status === 'request_processing' ? 'Order is actively processing by Zinc.' : 'Verification successful.'}`,
            note_type: 'verification',
            is_internal: true
          });

        return {
          orderId,
          zincOrderId: order.zinc_order_id,
          verified: result.status !== 'not_found' && !result.error,
          status: result.status,
          error: result.error
        };
      }

      return {
        orderId,
        zincOrderId: order.zinc_order_id,
        verified: false,
        error: 'Failed to get status from Zinc'
      };

    } catch (error) {
      console.error(`💥 Exception during order verification:`, error);
      
      // Log the error
      const { data: userData } = await supabase.auth.getUser();
      await supabase
        .from('order_notes')
        .insert({
          admin_user_id: userData?.user?.id || '00000000-0000-0000-0000-000000000000',
          order_id: orderId,
          note_content: `Automatic verification failed: ${error.message}`,
          note_type: 'error',
          is_internal: true
        });

      return {
        orderId,
        verified: false,
        error: error.message
      };
    }
  }

  /**
   * Manually trigger verification for multiple orders
   */
  async verifyMultipleOrders(orderIds: string[]): Promise<OrderVerificationResult[]> {
    console.log(`🔍 Manually verifying ${orderIds.length} orders`);
    
    const results: OrderVerificationResult[] = [];
    
    for (const orderId of orderIds) {
      try {
        const result = await this.verifyOrder(orderId);
        results.push(result);
      } catch (error) {
        results.push({
          orderId,
          verified: false,
          error: error.message
        });
      }
    }
    
    return results;
  }

  /**
   * Get pending orders that need verification
   */
  async getPendingOrders(): Promise<string[]> {
    const { data: orders, error } = await supabase
      .from('orders')
      .select('id')
      .in('status', ['pending', 'processing'])
      .not('zinc_order_id', 'is', null)
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()) // Last 24 hours
      .limit(50);

    if (error) {
      console.error('Error fetching pending orders:', error);
      return [];
    }

    return orders?.map(order => order.id) || [];
  }
}

export const orderVerificationService = OrderVerificationService.getInstance();
