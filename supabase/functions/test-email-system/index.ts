import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { emailType } = await req.json();
    
    // Create Supabase client
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Prepare request body based on email type
    let requestBody: any = {
      eventType: emailType || 'user_welcomed',
    };

    // For order-related events, use the most recent order
    if (['order_confirmed', 'payment_confirmed', 'order_status_updated', 'order_cancelled', 'post_purchase_followup'].includes(emailType)) {
      // Get the most recent order for this user
      const { data: latestOrder } = await supabase
        .from('orders')
        .select('id')
        .eq('user_id', '0478a7d7-9d59-40bf-954e-657fa28fe251')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (latestOrder) {
        requestBody.orderId = latestOrder.id;
        // Convert frontend event types to backend event types
        if (emailType === 'order_confirmed') {
          requestBody.eventType = 'order_created';
        } else if (emailType === 'order_status_updated') {
          requestBody.eventType = 'order_status_changed';
          requestBody.customData = { status: 'shipped' }; // Example status
        }
      } else {
        throw new Error('No orders found for testing order-related emails');
      }
    } else {
      // For user-related events
      requestBody.userId = '0478a7d7-9d59-40bf-954e-657fa28fe251';
    }

    // Call the main email orchestrator
    const response = await fetch(
      `${Deno.env.get("SUPABASE_URL")}/functions/v1/ecommerce-email-orchestrator`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${Deno.env.get("SUPABASE_ANON_KEY")}`
        },
        body: JSON.stringify(requestBody)
      }
    );

    const result = await response.json();
    
    return new Response(JSON.stringify({ 
      success: true, 
      message: `Email system test completed for ${emailType}`,
      result
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });

  } catch (error: any) {
    console.error("Error in test-email-system:", error);
    return new Response(JSON.stringify({ 
      error: error.message || "Failed to test email system" 
    }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
});