import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[GROUP-GIFT-CONTRIBUTION] ${step}${detailsStr}`);
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
    if (!user?.email) throw new Error("User not authenticated");
    logStep("User authenticated", { userId: user.id, email: user.email });

    const { groupGiftProjectId, contributionAmount } = await req.json();
    if (!groupGiftProjectId || !contributionAmount) {
      throw new Error("Missing required fields");
    }

    // Get group gift project details
    const { data: project, error: projectError } = await supabaseService
      .from('group_gift_projects')
      .select(`
        *,
        group_chats!inner(*)
      `)
      .eq('id', groupGiftProjectId)
      .single();

    if (projectError || !project) {
      throw new Error("Group gift project not found");
    }
    logStep("Found group gift project", { projectId: project.id, targetAmount: project.target_amount });

    // Check if user is a member of the group
    const { data: membership } = await supabaseService
      .from('group_chat_members')
      .select('*')
      .eq('group_chat_id', project.group_chat_id)
      .eq('user_id', user.id)
      .single();

    if (!membership) {
      throw new Error("User is not a member of this group");
    }

    // Check if user already contributed
    const { data: existingContribution } = await supabaseService
      .from('group_gift_contributions')
      .select('*')
      .eq('group_gift_project_id', groupGiftProjectId)
      .eq('contributor_id', user.id)
      .single();

    if (existingContribution && existingContribution.contribution_status === 'paid') {
      throw new Error("You have already contributed to this project");
    }

    // Initialize Stripe
    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });

    // Check or create Stripe customer
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
    } else {
      const customer = await stripe.customers.create({ email: user.email });
      customerId = customer.id;
    }
    logStep("Stripe customer ready", { customerId });

    // Create payment intent for contribution (held in escrow)
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(contributionAmount * 100), // Convert to cents
      currency: 'usd',
      customer: customerId,
      payment_method_types: ['card'],
      capture_method: 'manual', // Hold funds in escrow
      metadata: {
        type: 'group-gift-contribution',
        group_gift_project_id: groupGiftProjectId,
        contributor_id: user.id,
        project_name: project.project_name
      },
      description: `Contribution to "${project.project_name}" group gift`
    });

    logStep("Payment intent created", { paymentIntentId: paymentIntent.id, amount: contributionAmount });

    // Update or create contribution record
    const contributionData = {
      group_gift_project_id: groupGiftProjectId,
      contributor_id: user.id,
      committed_amount: contributionAmount,
      stripe_payment_intent_id: paymentIntent.id,
      contribution_status: 'pending'
    };

    if (existingContribution) {
      await supabaseService
        .from('group_gift_contributions')
        .update(contributionData)
        .eq('id', existingContribution.id);
    } else {
      await supabaseService
        .from('group_gift_contributions')
        .insert(contributionData);
    }

    logStep("Contribution record updated");

    return new Response(JSON.stringify({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      contributionAmount
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