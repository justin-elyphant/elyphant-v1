import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CONFIRM-GROUP-CONTRIBUTION] ${step}${detailsStr}`);
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

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseService.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user) throw new Error("User not authenticated");

    const { paymentIntentId } = await req.json();
    if (!paymentIntentId) {
      throw new Error("Payment intent ID is required");
    }

    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });

    // Retrieve payment intent to verify status
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    logStep("Payment intent retrieved", { status: paymentIntent.status, id: paymentIntentId });

    if (paymentIntent.status !== 'requires_confirmation' && paymentIntent.status !== 'succeeded') {
      throw new Error(`Payment intent has invalid status: ${paymentIntent.status}`);
    }

    const groupGiftProjectId = paymentIntent.metadata.group_gift_project_id;
    const contributorId = paymentIntent.metadata.contributor_id;

    if (contributorId !== user.id) {
      throw new Error("Payment intent does not belong to this user");
    }

    // Update contribution status to paid
    const { error: updateError } = await supabaseService
      .from('group_gift_contributions')
      .update({
        contribution_status: 'paid',
        paid_amount: paymentIntent.amount / 100, // Convert from cents
        payment_date: new Date().toISOString()
      })
      .eq('stripe_payment_intent_id', paymentIntentId);

    if (updateError) {
      throw new Error(`Failed to update contribution: ${updateError.message}`);
    }

    logStep("Contribution marked as paid");

    // Check if funding goal is reached
    const { data: project } = await supabaseService
      .from('group_gift_projects')
      .select('*, group_gift_contributions(*)')
      .eq('id', groupGiftProjectId)
      .single();

    if (project) {
      const totalPaid = project.group_gift_contributions
        .filter((c: any) => c.contribution_status === 'paid')
        .reduce((sum: number, c: any) => sum + parseFloat(c.paid_amount || 0), 0);

      logStep("Checking funding progress", { 
        totalPaid, 
        targetAmount: project.target_amount,
        isFullyFunded: totalPaid >= project.target_amount 
      });

      // Update current amount
      await supabaseService
        .from('group_gift_projects')
        .update({ current_amount: totalPaid })
        .eq('id', groupGiftProjectId);

      // If fully funded, trigger purchase process
      if (totalPaid >= project.target_amount && project.status === 'collecting') {
        logStep("Funding goal reached, triggering purchase");
        
        // Update project status
        await supabaseService
          .from('group_gift_projects')
          .update({ 
            status: 'ready_to_purchase',
            updated_at: new Date().toISOString()
          })
          .eq('id', groupGiftProjectId);

        // Trigger auto-purchase function
        await supabaseService.functions.invoke('trigger-group-gift-purchase', {
          body: { groupGiftProjectId }
        });
      }
    }

    // Send notification to group chat
    await supabaseService
      .from('messages')
      .insert({
        sender_id: user.id,
        group_chat_id: project?.group_chat_id,
        content: `💰 Contribution confirmed! ${paymentIntent.amount / 100} towards "${project?.project_name}"`,
        message_type: 'system'
      });

    return new Response(JSON.stringify({
      success: true,
      contributionAmount: paymentIntent.amount / 100,
      totalFunded: project ? project.current_amount : 0,
      targetAmount: project ? project.target_amount : 0
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});