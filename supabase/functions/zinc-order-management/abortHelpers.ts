// Helper functions for enhanced Zinc abort functionality

// Check if order is eligible for Zinc abort vs regular cancellation
export async function checkAbortEligibility(orderData: any, supabase: any, zincStatus?: any) {
  console.log(`🔍 [ABORT-CHECK] Checking abort eligibility for order ${orderData.id}`);
  
  // Must have a Zinc order ID to abort
  if (!orderData.zinc_order_id) {
    return {
      canAbort: false,
      canCancel: ['pending', 'failed', 'retry_pending'].includes(orderData.status),
      reason: 'No Zinc order ID - order was not processed through Zinc',
      isProcessingStage: false
    };
  }

  // Check current Zinc status if available
  if (zincStatus) {
    const isProcessingStage = zincStatus._type === 'error' && zincStatus.code === 'request_processing';
    const isAlreadyAborted = zincStatus._type === 'error' && zincStatus.code === 'aborted_request';
    
    if (isAlreadyAborted) {
      return {
        canAbort: false,
        canCancel: false,
        reason: 'Order has already been aborted',
        isProcessingStage: false
      };
    }

    if (isProcessingStage) {
      return {
        canAbort: true,
        canCancel: true,
        reason: 'Order is in processing stage and can be aborted',
        isProcessingStage: true
      };
    }

    // If order has progressed beyond processing stage
    if (zincStatus._type === 'order_placed' || (zincStatus._type === 'error' && ['placed', 'shipped', 'delivered'].includes(zincStatus.code))) {
      return {
        canAbort: false,
        canCancel: ['pending', 'failed', 'retry_pending'].includes(orderData.status),
        reason: 'Order has progressed beyond processing stage',
        isProcessingStage: false
      };
    }
  }

  // For orders without clear Zinc status, check based on local status
  const canLocalCancel = ['pending', 'failed', 'retry_pending'].includes(orderData.status) &&
    !['shipped', 'delivered', 'cancelled'].includes(orderData.zinc_status?.toLowerCase() || '');

  // Orders that might still be in processing stage
  const potentiallyProcessing = ['pending', 'processing'].includes(orderData.status) &&
    !['shipped', 'delivered', 'cancelled'].includes(orderData.zinc_status?.toLowerCase() || '');

  return {
    canAbort: potentiallyProcessing,
    canCancel: canLocalCancel,
    reason: potentiallyProcessing ? 'Order may be in processing stage' : 'Order status does not support abort',
    isProcessingStage: potentiallyProcessing
  };
}

// Perform the actual Zinc abort operation with polling
export async function performZincAbort(orderData: any, supabase: any) {
  console.log(`🛑 [ABORT-PERFORM] Starting abort operation for order ${orderData.id}`);
  
  // Get ZMA account
  const { data: zmaAccount } = await supabase
    .from('zma_accounts')
    .select('api_key')
    .eq('is_active', true)
    .single();

  if (!zmaAccount?.api_key) {
    throw new Error('No active ZMA account found');
  }

  const { ZincApiManager } = await import('./index.ts');
  const zincApi = new ZincApiManager(zmaAccount.api_key);

  // Attempt abort
  const abortResponse = await zincApi.abortOrder(orderData.zinc_order_id);
  
  let finalStatus = 'aborted';
  let abortMethod = 'immediate';
  
  // Handle different abort response types
  if (abortResponse.abortStatus === 'pending') {
    console.log('⏳ [ABORT-PERFORM] Abort initiated, starting polling...');
    
    try {
      // Poll for abort completion (max 2 minutes)
      await zincApi.pollAbortStatus(orderData.zinc_order_id, 12, 10000);
      abortMethod = 'polled';
    } catch (pollError) {
      console.warn('⚠️ [ABORT-PERFORM] Polling timeout or failed, proceeding with local cancellation');
      finalStatus = 'cancelled';
      abortMethod = 'timeout_fallback';
    }
  } else if (abortResponse.abortStatus === 'immediate') {
    console.log('✅ [ABORT-PERFORM] Order aborted immediately');
    abortMethod = 'immediate';
  }

  // Update order status in database
  const updateData = {
    status: finalStatus,
    zinc_status: finalStatus,
    cancellation_reason: `Aborted via Zinc API (${abortMethod})`,
    cancelled_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  const { error: updateError } = await supabase
    .from('orders')
    .update(updateData)
    .eq('id', orderData.id);

  if (updateError) {
    throw new Error(`Failed to update order status: ${updateError.message}`);
  }

  // Add abort note
  await supabase
    .from('order_notes')
    .insert({
      order_id: orderData.id,
      admin_user_id: orderData.user_id,
      note_content: `Order ${finalStatus} via Zinc API using ${abortMethod} method`,
      note_type: 'abort_operation',
      is_internal: false
    });

  // Handle refund if payment was processed
  let refundInitiated = false;
  if (orderData.payment_status === 'succeeded' && orderData.stripe_payment_intent_id) {
    console.log('💰 [ABORT-PERFORM] Initiating refund process...');
    
    await supabase
      .from('refund_requests')
      .insert({
        order_id: orderData.id,
        amount: orderData.total_amount,
        reason: `Order ${finalStatus} - ${abortMethod}`,
        status: 'pending',
        stripe_payment_intent_id: orderData.stripe_payment_intent_id
      });
    
    refundInitiated = true;
  }

  console.log(`✅ [ABORT-PERFORM] Order ${finalStatus} operation completed`);
  
  return {
    success: true,
    abortMethod,
    finalStatus,
    zincResponse: abortResponse,
    refundInitiated,
    message: `Order ${finalStatus} successfully using ${abortMethod} method`
  };
}