import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

/**
 * Simplified auto-gift approval email sender
 * Routes through ecommerce-email-orchestrator for consistency
 */
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const {
      executionId,
      recipientEmail,
      recipientName,
      giftDetails,
      deliveryDate,
      shippingAddress
    } = await req.json()

    console.log(`📧 Sending approval email for execution ${executionId}`)

    // Generate approval token
    const token = crypto.randomUUID().replace(/-/g, '')
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7) // 7 days to approve

    // Get execution details
    const { data: execution, error: executionError } = await supabaseClient
      .from('automated_gift_executions')
      .select(`
        *,
        auto_gifting_rules (
          user_id,
          recipient_id,
          budget_limit
        )
      `)
      .eq('id', executionId)
      .single()

    if (executionError || !execution) {
      throw new Error('Execution not found')
    }

    // Create approval token
    const { data: approvalToken, error: tokenError } = await supabaseClient
      .from('email_approval_tokens')
      .insert({
        execution_id: executionId,
        user_id: execution.auto_gifting_rules.user_id,
        token,
        expires_at: expiresAt.toISOString(),
        email_sent_at: new Date().toISOString()
      })
      .select()
      .single()

    if (tokenError) {
      throw new Error(`Failed to create approval token: ${tokenError.message}`)
    }

    // Build approval URLs
    const baseUrl = Deno.env.get('SITE_URL') || 'https://dmkxtkvlispxeqfzlczr.supabase.co'
    const approveUrl = `${baseUrl}/auto-gift-approval?token=${token}&action=approve`
    const rejectUrl = `${baseUrl}/auto-gift-approval?token=${token}&action=reject`

    // Format gift details for email
    const productList = giftDetails.selectedProducts?.map((product: any) => 
      `• ${product.title} - $${product.price.toFixed(2)}`
    ).join('\n') || 'No products selected'

    const totalAmount = giftDetails.selectedProducts?.reduce((sum: number, p: any) => sum + p.price, 0) || 0

    // Route through ecommerce-email-orchestrator for consistency
    const orchestratorResponse = await supabaseClient.functions.invoke('ecommerce-email-orchestrator', {
      body: {
        eventType: 'auto_gift_approval',
        userId: execution.auto_gifting_rules.user_id,
        customData: {
          recipientEmail,
          recipientName,
          occasion: giftDetails.occasion,
          budget: giftDetails.budget,
          totalAmount,
          productList,
          deliveryDate,
          shippingAddress,
          approveUrl,
          rejectUrl,
          expiresAt: expiresAt.toISOString()
        }
      }
    });

    if (orchestratorResponse.error) {
      throw new Error(`Orchestrator error: ${orchestratorResponse.error.message}`)
    }

    console.log(`✅ Approval email sent to ${recipientEmail} via orchestrator`);

    // Log the email delivery
    await supabaseClient
      .from('email_delivery_logs')
      .insert({
        token_id: approvalToken.id,
        delivery_status: 'sent',
        event_data: {
          recipient_email: recipientEmail,
          subject: 'Auto-Gift Approval Required',
          delivery_method: 'resend'
        }
      })

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Approval email sent successfully',
        token_id: approvalToken.id,
        expires_at: expiresAt.toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    console.error('❌ Error sending approval email:', error)
    const message = error instanceof Error ? error.message : String(error)
    return new Response(
      JSON.stringify({
        success: false,
        error: message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})