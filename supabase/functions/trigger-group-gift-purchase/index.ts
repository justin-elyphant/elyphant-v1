import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[TRIGGER-GROUP-PURCHASE] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseService = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    const { groupGiftProjectId } = await req.json();
    if (!groupGiftProjectId) {
      throw new Error("Group gift project ID is required");
    }

    // Get project details with contributions
    const { data: project, error: projectError } = await supabaseService
      .from('group_gift_projects')
      .select(`
        *,
        group_gift_contributions!inner(
          *,
          profiles(name, email)
        )
      `)
      .eq('id', groupGiftProjectId)
      .single();

    if (projectError || !project) {
      throw new Error("Group gift project not found");
    }

    logStep("Found project", { 
      id: project.id, 
      status: project.status,
      currentAmount: project.current_amount,
      targetAmount: project.target_amount 
    });

    // Verify project is ready for purchase
    if (project.status !== 'ready_to_purchase') {
      throw new Error(`Project status is ${project.status}, not ready for purchase`);
    }

    const paidContributions = project.group_gift_contributions.filter(
      (c: any) => c.contribution_status === 'paid'
    );

    if (paidContributions.length === 0) {
      throw new Error("No paid contributions found");
    }

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });

    // Capture all payment intents (release from escrow)
    logStep("Capturing payment intents", { count: paidContributions.length });
    
    const capturePromises = paidContributions.map(async (contribution: any) => {
      try {
        const captured = await stripe.paymentIntents.capture(contribution.stripe_payment_intent_id);
        logStep("Payment captured", { 
          paymentIntentId: contribution.stripe_payment_intent_id,
          amount: captured.amount / 100
        });
        return captured;
      } catch (error: any) {
        logStep("Payment capture failed", { 
          paymentIntentId: contribution.stripe_payment_intent_id,
          error: error.message
        });
        throw error;
      }
    });

    await Promise.all(capturePromises);
    logStep("All payments captured successfully");

    // Create order record
    const orderData = {
      user_id: project.coordinator_id, // Coordinator manages the order
      group_gift_project_id: groupGiftProjectId,
      funding_source: 'group_gift',
      subtotal: project.current_amount,
      total_amount: project.current_amount,
      currency: 'USD',
      status: 'pending',
      shipping_info: project.delivery_address || {},
      gift_message: `Group gift from ${paidContributions.length} contributors`,
      is_gift: true,
      order_number: `GG-${Date.now()}`
    };

    const { data: order, error: orderError } = await supabaseService
      .from('orders')
      .insert(orderData)
      .select()
      .single();

    if (orderError) {
      throw new Error(`Failed to create order: ${orderError.message}`);
    }

    logStep("Order created", { orderId: order.id });

    // Create order items
    if (project.target_product_id) {
      const { error: itemError } = await supabaseService
        .from('order_items')
        .insert({
          order_id: order.id,
          product_id: project.target_product_id,
          product_name: project.target_product_name,
          product_image: project.target_product_image,
          quantity: 1,
          unit_price: project.target_product_price || project.current_amount,
          total_price: project.target_product_price || project.current_amount
        });

      if (itemError) {
        logStep("Failed to create order item", { error: itemError.message });
      }
    }

    // Record contributor details
    const contributorRecords = paidContributions.map((contribution: any) => ({
      order_id: order.id,
      contributor_id: contribution.contributor_id,
      contribution_amount: contribution.paid_amount,
      stripe_payment_intent_id: contribution.stripe_payment_intent_id
    }));

    await supabaseService
      .from('order_group_contributors')
      .insert(contributorRecords);

    // Update project status
    await supabaseService
      .from('group_gift_projects')
      .update({
        status: 'purchased',
        order_id: order.id,
        updated_at: new Date().toISOString()
      })
      .eq('id', groupGiftProjectId);

    // Process with ZMA API if product ID exists (zinc_api disabled)
    if (project.target_product_id) {
      try {
        await supabaseService.functions.invoke('process-zma-order', {
          body: { orderId: order.id }
        });
        logStep("ZMA order processing initiated");
      } catch (zmaError) {
        logStep("ZMA order processing failed", { error: zmaError });
        // Don't fail the entire process if Zinc fails
      }
    }

    // Notify group chat
    await supabaseService
      .from('messages')
      .insert({
        sender_id: project.coordinator_id,
        group_chat_id: project.group_chat_id,
        content: `🎉 Group gift purchase complete! Order #${order.order_number} has been placed. Thank you to all ${paidContributions.length} contributors!`,
        message_type: 'system'
      });

    // Set up tracking access for all contributors
    const trackingAccessRecords = paidContributions.map((contribution: any) => ({
      group_gift_project_id: groupGiftProjectId,
      user_id: contribution.contributor_id,
      access_level: 'full',
      can_view_tracking: 'yes',
      can_view_delivery_address: contribution.contributor_id === project.coordinator_id
    }));

    await supabaseService
      .from('group_gift_tracking_access')
      .insert(trackingAccessRecords);

    logStep("Purchase process completed successfully");

    return new Response(JSON.stringify({
      success: true,
      orderId: order.id,
      orderNumber: order.order_number,
      totalAmount: project.current_amount,
      contributorsCount: paidContributions.length
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });

    // If there was an error after capturing payments, we should handle refunds
    // This would be implemented based on specific business requirements

    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});