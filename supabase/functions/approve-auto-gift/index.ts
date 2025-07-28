import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ApprovalRequest {
  token: string;
  action: 'approve' | 'reject' | 'review';
  rejectionReason?: string;
  customizations?: {
    selectedProducts?: string[];
    giftMessage?: string;
    deliveryDate?: string;
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    let requestData: ApprovalRequest;
    
    // Handle both GET (URL params) and POST (JSON body) requests
    if (req.method === "GET") {
      const url = new URL(req.url);
      requestData = {
        token: url.searchParams.get("token") || "",
        action: (url.searchParams.get("action") || "review") as ApprovalRequest["action"],
        rejectionReason: url.searchParams.get("reason") || undefined,
      };
    } else {
      requestData = await req.json();
    }

    const { token, action, rejectionReason, customizations } = requestData;

    if (!token) {
      throw new Error("Approval token is required");
    }

    // Validate and retrieve approval token
    const { data: tokenData, error: tokenError } = await supabase
      .from("email_approval_tokens")
      .select(`
        *,
        automated_gift_executions (
          id,
          user_id,
          event_id,
          rule_id,
          selected_products,
          total_amount,
          execution_date,
          status
        )
      `)
      .eq("token", token)
      .gt("expires_at", new Date().toISOString())
      .is("approved_at", null)
      .is("rejected_at", null)
      .single();

    if (tokenError || !tokenData) {
      console.error("Token validation error:", tokenError);
      
      // For GET requests (email clicks), return HTML error page
      if (req.method === "GET") {
        return new Response(
          `
          <!DOCTYPE html>
          <html>
          <head>
            <title>Invalid or Expired Token</title>
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
                     margin: 0; padding: 40px; background-color: #f8fafc; text-align: center; }
              .container { max-width: 500px; margin: 0 auto; background: white; 
                          padding: 40px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
              .error { color: #ef4444; font-size: 24px; margin-bottom: 16px; }
              .message { color: #64748b; margin-bottom: 24px; }
              .button { background-color: #6366f1; color: white; padding: 12px 24px; 
                       border-radius: 8px; text-decoration: none; display: inline-block; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="error">⚠️ Invalid or Expired Token</div>
              <p class="message">This approval link is invalid or has expired. Please check your dashboard for active approvals.</p>
              <a href="/" class="button">Go to Dashboard</a>
            </div>
          </body>
          </html>
          `,
          {
            headers: { ...corsHeaders, "Content-Type": "text/html" },
            status: 400,
          }
        );
      }
      
      throw new Error("Invalid or expired approval token");
    }

    const execution = tokenData.automated_gift_executions;
    if (!execution) {
      throw new Error("Associated gift execution not found");
    }

    // Log the approval action
    await supabase
      .from("email_delivery_logs")
      .insert({
        token_id: tokenData.id,
        delivery_status: action,
        event_data: { 
          action,
          rejectionReason,
          customizations,
          timestamp: new Date().toISOString()
        }
      });

    let responseHtml = '';
    let redirectUrl = '/dashboard?tab=auto-gifts';

    if (action === 'review') {
      // For review action, redirect to dashboard with the execution ID
      redirectUrl = `/dashboard?tab=auto-gifts&review=${execution.id}&token=${token}`;
      
      responseHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Redirecting to Review...</title>
          <meta http-equiv="refresh" content="0; url=${redirectUrl}">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
                   margin: 0; padding: 40px; background-color: #f8fafc; text-align: center; }
            .container { max-width: 500px; margin: 0 auto; background: white; 
                        padding: 40px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
            .loading { color: #6366f1; font-size: 18px; margin-bottom: 16px; }
            .spinner { border: 3px solid #e2e8f0; border-top: 3px solid #6366f1; 
                      border-radius: 50%; width: 40px; height: 40px; 
                      animation: spin 1s linear infinite; margin: 20px auto; }
            @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="spinner"></div>
            <div class="loading">Taking you to review your gift...</div>
            <p>If you're not redirected automatically, <a href="${redirectUrl}">click here</a>.</p>
          </div>
        </body>
        </html>
      `;

    } else if (action === 'approve') {
      // Update token as approved
      await supabase
        .from("email_approval_tokens")
        .update({
          approved_at: new Date().toISOString(),
          approved_via: 'email'
        })
        .eq("id", tokenData.id);

      // Update execution status to approved
      await supabase
        .from("automated_gift_executions")
        .update({
          status: 'approved',
          updated_at: new Date().toISOString()
        })
        .eq("id", execution.id);

      // Trigger the actual gift processing
      try {
        await supabase.functions.invoke('process-auto-gifts', {
          body: { 
            executionId: execution.id,
            approvalMethod: 'email',
            customizations 
          }
        });
      } catch (processError) {
        console.error("Error triggering gift processing:", processError);
        // Don't fail the approval, just log the error
      }

      responseHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Gift Approved Successfully!</title>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
                   margin: 0; padding: 40px; background-color: #f8fafc; text-align: center; }
            .container { max-width: 500px; margin: 0 auto; background: white; 
                        padding: 40px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
            .success { color: #10b981; font-size: 24px; margin-bottom: 16px; }
            .message { color: #64748b; margin-bottom: 24px; line-height: 1.6; }
            .button { background-color: #6366f1; color: white; padding: 12px 24px; 
                     border-radius: 8px; text-decoration: none; display: inline-block; margin: 8px; }
            .details { background-color: #f8fafc; padding: 16px; border-radius: 8px; margin: 16px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="success">🎉 Gift Approved Successfully!</div>
            <p class="message">Your auto-gift has been approved and is being processed. The recipient will receive their gift soon!</p>
            <div class="details">
              <strong>Total Amount:</strong> $${execution.total_amount}<br>
              <strong>Execution Date:</strong> ${execution.execution_date}
            </div>
            <a href="${redirectUrl}" class="button">View Dashboard</a>
            <a href="/orders" class="button">Track Orders</a>
          </div>
        </body>
        </html>
      `;

    } else if (action === 'reject') {
      // Update token as rejected
      await supabase
        .from("email_approval_tokens")
        .update({
          rejected_at: new Date().toISOString(),
          rejection_reason: rejectionReason || 'Rejected via email'
        })
        .eq("id", tokenData.id);

      // Update execution status to rejected
      await supabase
        .from("automated_gift_executions")
        .update({
          status: 'rejected',
          error_message: rejectionReason || 'Rejected by user via email',
          updated_at: new Date().toISOString()
        })
        .eq("id", execution.id);

      responseHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Gift Rejected</title>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
                   margin: 0; padding: 40px; background-color: #f8fafc; text-align: center; }
            .container { max-width: 500px; margin: 0 auto; background: white; 
                        padding: 40px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
            .warning { color: #f59e0b; font-size: 24px; margin-bottom: 16px; }
            .message { color: #64748b; margin-bottom: 24px; line-height: 1.6; }
            .button { background-color: #6366f1; color: white; padding: 12px 24px; 
                     border-radius: 8px; text-decoration: none; display: inline-block; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="warning">❌ Gift Rejected</div>
            <p class="message">This auto-gift has been rejected and will not be processed. No charges have been made.</p>
            <a href="${redirectUrl}" class="button">View Dashboard</a>
          </div>
        </body>
        </html>
      `;
    }

    // For GET requests (email clicks), return HTML response
    if (req.method === "GET") {
      return new Response(responseHtml, {
        headers: { ...corsHeaders, "Content-Type": "text/html" },
        status: 200,
      });
    }

    // For API requests, return JSON
    return new Response(
      JSON.stringify({
        success: true,
        action,
        executionId: execution.id,
        status: action === 'approve' ? 'approved' : action === 'reject' ? 'rejected' : 'review',
        redirectUrl
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );

  } catch (error) {
    console.error("Error in approve-auto-gift:", error);
    
    // For GET requests, return HTML error page
    if (req.method === "GET") {
      return new Response(
        `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Error Processing Approval</title>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
                   margin: 0; padding: 40px; background-color: #f8fafc; text-align: center; }
            .container { max-width: 500px; margin: 0 auto; background: white; 
                        padding: 40px; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
            .error { color: #ef4444; font-size: 24px; margin-bottom: 16px; }
            .message { color: #64748b; margin-bottom: 24px; }
            .button { background-color: #6366f1; color: white; padding: 12px 24px; 
                     border-radius: 8px; text-decoration: none; display: inline-block; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="error">⚠️ Error</div>
            <p class="message">${error.message}</p>
            <a href="/dashboard" class="button">Go to Dashboard</a>
          </div>
        </body>
        </html>
        `,
        {
          headers: { ...corsHeaders, "Content-Type": "text/html" },
          status: 500,
        }
      );
    }

    return new Response(
      JSON.stringify({ 
        error: error.message,
        success: false 
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});