import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';
import { Resend } from 'npm:resend@2.0.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface FundingAlertRequest {
  alert_type: string;
  zma_current_balance: number;
  pending_orders_value: number;
  recommended_transfer_amount: number;
  orders_count_waiting: number;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const alertData: FundingAlertRequest = await req.json();
    
    console.log('[ZMA-FUNDING-ALERT] Processing funding alert...', alertData);

    // Get business admin emails
    const { data: admins, error: adminsError } = await supabase
      .from('business_admins')
      .select('user_id, profiles!inner(email, name)')
      .in('admin_level', ['owner', 'admin']);

    if (adminsError || !admins || admins.length === 0) {
      console.error('[ZMA-FUNDING-ALERT] No admins found or error:', adminsError);
      return new Response(
        JSON.stringify({ error: 'No admin recipients found' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const adminEmails = admins
      .map((admin: any) => admin.profiles?.email)
      .filter(Boolean);

    console.log(`[ZMA-FUNDING-ALERT] Sending to ${adminEmails.length} admins`);

    const shortfall = alertData.pending_orders_value - alertData.zma_current_balance;
    const urgencyEmoji = alertData.alert_type === 'critical_balance' ? '🚨' : '⚠️';

    // Compose email
    const subject = `${urgencyEmoji} ZMA Funding Required - $${alertData.recommended_transfer_amount.toFixed(2)} needed for ${alertData.orders_count_waiting} orders`;
    
    const dashboardUrl = `${supabaseUrl.replace('https://', 'https://dmkxtkvlispxeqfzlczr.')}/trunkline`;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; }
          .header h1 { margin: 0; font-size: 24px; }
          .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
          .status-box { background: white; border-left: 4px solid #ffc107; padding: 20px; margin: 20px 0; border-radius: 5px; }
          .metric { display: flex; justify-content: space-between; margin: 10px 0; padding: 10px 0; border-bottom: 1px solid #eee; }
          .metric:last-child { border-bottom: none; }
          .metric-label { font-weight: 600; color: #666; }
          .metric-value { font-weight: bold; color: #333; }
          .shortfall { color: #dc3545; font-size: 20px; }
          .action-box { background: #e3f2fd; padding: 20px; margin: 20px 0; border-radius: 5px; border-left: 4px solid #2196f3; }
          .action-box h3 { margin-top: 0; color: #1976d2; }
          .action-box ol { margin: 10px 0; padding-left: 20px; }
          .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 10px 0; }
          .footer { text-align: center; color: #666; font-size: 12px; margin-top: 30px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>${urgencyEmoji} ZMA Funding Alert</h1>
            <p style="margin: 10px 0 0 0; opacity: 0.9;">Your ZMA account needs funding to process pending orders</p>
          </div>
          
          <div class="content">
            <div class="status-box">
              <h2 style="margin-top: 0; color: #333;">Current Status</h2>
              <div class="metric">
                <span class="metric-label">ZMA Balance:</span>
                <span class="metric-value">$${alertData.zma_current_balance.toFixed(2)}</span>
              </div>
              <div class="metric">
                <span class="metric-label">Pending Orders:</span>
                <span class="metric-value">${alertData.orders_count_waiting} orders worth $${alertData.pending_orders_value.toFixed(2)}</span>
              </div>
              <div class="metric">
                <span class="metric-label">Shortfall:</span>
                <span class="metric-value shortfall">-$${shortfall.toFixed(2)}</span>
              </div>
            </div>

            <div class="action-box">
              <h3>📋 Action Required</h3>
              <p><strong>Transfer Amount Recommended: $${alertData.recommended_transfer_amount.toFixed(2)}</strong></p>
              <p>This includes a 10% buffer for additional orders.</p>
              
              <ol>
                <li>Wait for Stripe payout to arrive in your bank (2-3 days)</li>
                <li>Log into PayPal and transfer <strong>$${alertData.recommended_transfer_amount.toFixed(2)}</strong> to Zinc's PayPal account</li>
                <li>Go to Trunkline dashboard and click "I've Transferred Funds"</li>
                <li>System will automatically process queued orders</li>
              </ol>
            </div>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${dashboardUrl}" class="button">Open Trunkline Dashboard</a>
            </div>

            <div style="background: #fff3cd; padding: 15px; border-radius: 5px; border-left: 4px solid #ffc107;">
              <strong>💡 Tip:</strong> Orders are automatically scheduled to maintain the 7-10 day delivery window. Customers won't see any delays.
            </div>
          </div>

          <div class="footer">
            <p>This is an automated alert from your Elyphant ZMA funding system.</p>
            <p>You're receiving this because you're a business admin.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Queue email if Resend is configured
    if (resendApiKey) {
      const resend = new Resend(resendApiKey);
      
      try {
        await resend.emails.send({
          from: 'Elyphant <hello@elyphant.ai>',
          to: adminEmails,
          subject: subject,
          html: htmlContent
        });

        console.log('[ZMA-FUNDING-ALERT] Email sent successfully');

        // Mark alert as email sent
        await supabase
          .from('zma_funding_alerts')
          .update({ email_sent: true })
          .eq('alert_type', alertData.alert_type)
          .is('resolved_at', null);

      } catch (emailError: any) {
        console.error('[ZMA-FUNDING-ALERT] Email send failed:', emailError);
      }
    } else {
      console.log('[ZMA-FUNDING-ALERT] Resend API key not configured - skipping email');
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Alert processed',
        recipients: adminEmails.length 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('[ZMA-FUNDING-ALERT] Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
