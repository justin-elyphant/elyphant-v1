import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { token, action, selectedProductIds, rejectionReason } = await req.json()

    console.log(`🎯 Processing auto-gift approval: ${action} for token ${token}`)

    // Validate approval token
    const { data: approvalToken, error: tokenError } = await supabaseClient
      .from('email_approval_tokens')
      .select('*, automated_gift_executions(*)')
      .eq('token', token)
      .gt('expires_at', new Date().toISOString())
      .is('approved_at', null)
      .is('rejected_at', null)
      .single()

    if (tokenError || !approvalToken) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Invalid or expired approval token' 
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        }
      )
    }

    const execution = approvalToken.automated_gift_executions

    if (action === 'approve') {
      console.log(`✅ Approving auto-gift execution ${execution.id}`)
      
      // Update approval token
      await supabaseClient
        .from('email_approval_tokens')
        .update({
          approved_at: new Date().toISOString(),
          approved_via: 'email_approval'
        })
        .eq('id', approvalToken.id)

      // Filter selected products if provided
      let productsToOrder = execution.selected_products
      if (selectedProductIds && selectedProductIds.length > 0) {
        productsToOrder = execution.selected_products.filter((product: any) =>
          selectedProductIds.includes(product.product_id)
        )
      }

      // Get rule details for order creation
      const { data: rule } = await supabaseClient
        .from('auto_gifting_rules')
        .select('*')
        .eq('id', execution.rule_id)
        .single()

      // Create order
      await createApprovedGiftOrder(supabaseClient, execution.id, productsToOrder, rule)

      // Create approval notification
      await createApprovalNotification(supabaseClient, execution.id, execution.user_id, 'approved', productsToOrder)

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Auto-gift approved and order created',
          executionId: execution.id
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      )

    } else if (action === 'reject') {
      console.log(`❌ Rejecting auto-gift execution ${execution.id}`)
      
      // Update approval token
      await supabaseClient
        .from('email_approval_tokens')
        .update({
          rejected_at: new Date().toISOString(),
          rejection_reason: rejectionReason || 'User rejected auto-gift selection'
        })
        .eq('id', approvalToken.id)

      // Update execution status
      await supabaseClient
        .from('automated_gift_executions')
        .update({
          status: 'cancelled',
          error_message: rejectionReason || 'Rejected by user',
          updated_at: new Date().toISOString()
        })
        .eq('id', execution.id)

      // Create rejection notification
      await createApprovalNotification(supabaseClient, execution.id, execution.user_id, 'rejected', [])

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Auto-gift rejected',
          executionId: execution.id
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      )
    }

    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Invalid action' 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )

  } catch (error) {
    console.error('Auto-gift approval error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    )
  }
})

async function createApprovedGiftOrder(supabaseClient: any, executionId: string, products: any[], rule: any) {
  console.log(`🛒 Creating approved gift order for execution ${executionId}`)
  
  try {
    // Get recipient shipping address
    const { data: recipientProfile } = await supabaseClient
      .from('profiles')
      .select('shipping_address, email, name')
      .eq('id', rule.recipient_id)
      .single()

    if (!recipientProfile?.shipping_address) {
      throw new Error('Recipient shipping address not available')
    }

    const totalAmount = products.reduce((sum: number, product: any) => sum + (product.price || 0), 0)
    
    const { data: order, error: orderError } = await supabaseClient
      .from('orders')
      .insert({
        user_id: rule.user_id,
        status: 'processing',
        payment_status: 'succeeded',
        total_amount: totalAmount,
        shipping_address: recipientProfile.shipping_address,
        is_gift: true,
        gift_message: rule.gift_message || 'A thoughtful gift selected just for you!',
        recipient_email: recipientProfile.email,
        recipient_name: recipientProfile.name,
        order_items: products.map(product => ({
          product_id: product.product_id,
          quantity: 1,
          price: product.price,
          title: product.title,
          image: product.image
        })),
        execution_id: executionId
      })
      .select()
      .single()

    if (orderError) {
      throw new Error(`Order creation failed: ${orderError.message}`)
    }

    // Update execution with order ID
    await supabaseClient
      .from('automated_gift_executions')
      .update({
        order_id: order.id,
        status: 'completed',
        updated_at: new Date().toISOString()
      })
      .eq('id', executionId)

    console.log(`✅ Approved gift order ${order.id} created successfully`)
    
  } catch (error) {
    console.error(`❌ Approved order creation failed:`, error)
    await supabaseClient
      .from('automated_gift_executions')
      .update({
        status: 'failed',
        error_message: `Approved order creation failed: ${error.message}`,
        updated_at: new Date().toISOString()
      })
      .eq('id', executionId)
  }
}

async function createApprovalNotification(supabaseClient: any, executionId: string, userId: string, action: string, products: any[]) {
  const title = action === 'approved' ? '✅ Auto-Gift Approved' : '❌ Auto-Gift Rejected'
  const message = action === 'approved' 
    ? `Your auto-gift selection has been approved! Order for ${products.length} item${products.length > 1 ? 's' : ''} is being processed.`
    : 'Your auto-gift selection has been rejected. No order was placed.'

  try {
    await supabaseClient
      .from('auto_gift_notifications')
      .insert({
        user_id: userId,
        execution_id: executionId,
        notification_type: `approval_${action}`,
        title,
        message,
        email_sent: false,
        is_read: false
      })

    console.log(`✅ Approval notification created for execution ${executionId}`)
  } catch (error) {
    console.error(`❌ Failed to create approval notification:`, error)
  }
}