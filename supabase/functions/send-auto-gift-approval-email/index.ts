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
    const productList = giftDetails.selectedProducts?.map(product => 
      `• ${product.title} - $${product.price.toFixed(2)}`
    ).join('\n') || 'No products selected'

    const totalAmount = giftDetails.selectedProducts?.reduce((sum: number, p: any) => sum + p.price, 0) || 0

    // Send approval email using Resend (if configured)
    if (Deno.env.get('RESEND_API_KEY')) {
      try {
        const { Resend } = await import('npm:resend@2.0.0')
        const resend = new Resend(Deno.env.get('RESEND_API_KEY'))

        const emailHtml = `
          <h2>Auto-Gift Approval Required</h2>
          <p>Hello! An auto-gift is ready for your approval.</p>
          
          <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3>Gift Details</h3>
            <p><strong>Occasion:</strong> ${giftDetails.occasion}</p>
            <p><strong>Recipient:</strong> ${recipientName}</p>
            <p><strong>Budget:</strong> $${giftDetails.budget}</p>
            <p><strong>Total Amount:</strong> $${totalAmount.toFixed(2)}</p>
            ${deliveryDate ? `<p><strong>Delivery Date:</strong> ${deliveryDate}</p>` : ''}
          </div>

          <div style="background: #f9f9f9; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <h4>Selected Products:</h4>
            <pre style="white-space: pre-wrap;">${productList}</pre>
          </div>

          ${shippingAddress ? `
            <div style="background: #e8f4f8; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <h4>Shipping Address:</h4>
              <p><strong>Source:</strong> ${shippingAddress.source}</p>
              ${shippingAddress.needs_confirmation ? '<p style="color: #e67e22;"><strong>⚠️ Address requires confirmation</strong></p>' : ''}
            </div>
          ` : ''}

          <div style="text-align: center; margin: 30px 0;">
            <a href="${approveUrl}" style="background: #27ae60; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 0 10px;">
              ✅ Approve Gift
            </a>
            <a href="${rejectUrl}" style="background: #e74c3c; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 0 10px;">
              ❌ Reject Gift
            </a>
          </div>

          <p style="color: #666; font-size: 12px;">
            This approval request expires on ${expiresAt.toLocaleDateString()}.
            If you don't respond, the gift will be automatically cancelled.
          </p>
        `

        await resend.emails.send({
          from: 'Auto-Gift System <noreply@elyphant.com>',
          to: [recipientEmail],
          subject: `Auto-Gift Approval Required - ${giftDetails.occasion} for ${recipientName}`,
          html: emailHtml
        })

        console.log(`✅ Approval email sent via Resend to ${recipientEmail}`)
      } catch (resendError) {
        console.error('❌ Resend email failed:', resendError)
        throw new Error(`Email sending failed: ${resendError.message}`)
      }
    }

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
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})