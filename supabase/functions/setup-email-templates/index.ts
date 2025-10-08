import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { baseEmailTemplate } from "../ecommerce-email-orchestrator/email-templates/base-template.ts";
import { orderConfirmationTemplate } from "../ecommerce-email-orchestrator/email-templates/order-confirmation.ts";
import { paymentConfirmationTemplate } from "../ecommerce-email-orchestrator/email-templates/payment-confirmation.ts";
import { welcomeEmailTemplate } from "../ecommerce-email-orchestrator/email-templates/welcome-email.ts";
import { giftInvitationTemplate } from "../ecommerce-email-orchestrator/email-templates/gift-invitation.ts";
import { autoGiftApprovalTemplate } from "../ecommerce-email-orchestrator/email-templates/auto-gift-approval.ts";
import { orderStatusUpdateTemplate } from "../ecommerce-email-orchestrator/email-templates/order-status-update.ts";
import { cartAbandonedTemplate } from "../ecommerce-email-orchestrator/email-templates/cart-abandoned.ts";
import { postPurchaseFollowupTemplate } from "../ecommerce-email-orchestrator/email-templates/post-purchase-followup.ts";
import { connectionInvitationTemplate } from "../ecommerce-email-orchestrator/email-templates/connection-invitation.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Check if user is business admin
    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data: { user } } = await supabase.auth.getUser(token);

    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: isAdmin } = await supabase.rpc("is_business_admin", {
      check_user_id: user.id,
    });

    if (!isAdmin) {
      return new Response(JSON.stringify({ error: "Admin access required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Generate sample HTML for each template
    const templates = [
      {
        template_type: "order_confirmation",
        template_name: "Order Confirmation Email",
        subject_line: "Order Confirmed - {{order_number}}",
        html_content: orderConfirmationTemplate({
          first_name: "{{first_name}}",
          order_number: "{{order_number}}",
          order_date: "{{order_date}}",
          order_total: "{{order_total}}",
          items: [],
          shipping_address: {
            name: "{{shipping_name}}",
            address_line1: "{{address_line1}}",
            city: "{{city}}",
            state: "{{state}}",
            zip: "{{zip}}",
            country: "{{country}}",
          },
          tracking_url: "{{tracking_url}}",
        }),
        preheader: "Thank you for your order!",
      },
      {
        template_type: "payment_confirmation",
        template_name: "Payment Confirmation Email",
        subject_line: "Payment Received - {{order_number}}",
        html_content: paymentConfirmationTemplate({
          first_name: "{{first_name}}",
          order_number: "{{order_number}}",
          amount: "{{amount}}",
          payment_method: "{{payment_method}}",
          transaction_date: "{{transaction_date}}",
        }),
        preheader: "Your payment has been processed successfully",
      },
      {
        template_type: "welcome_email",
        template_name: "Welcome Email",
        subject_line: "Welcome to Elyphant! 🎁",
        html_content: welcomeEmailTemplate({
          first_name: "{{first_name}}",
          dashboard_url: "{{dashboard_url}}",
          profile_url: "{{profile_url}}",
        }),
        preheader: "Start your gifting journey with Elyphant",
      },
      {
        template_type: "gift_invitation",
        template_name: "Gift Invitation Email",
        subject_line: "{{sender_name}} sent you a gift via Elyphant!",
        html_content: giftInvitationTemplate({
          sender_name: "{{sender_name}}",
          recipient_name: "{{recipient_name}}",
          invitation_url: "{{invitation_url}}",
          occasion: "{{occasion}}",
          custom_message: "{{custom_message}}",
        }),
        preheader: "You've received a gift invitation!",
      },
      {
        template_type: "auto_gift_approval",
        template_name: "Auto Gift Approval Request",
        subject_line: "Approve Gift for {{recipient_name}}",
        html_content: autoGiftApprovalTemplate({
          first_name: "{{first_name}}",
          recipient_name: "{{recipient_name}}",
          occasion: "{{occasion}}",
          scheduled_date: "{{scheduled_date}}",
          suggested_gifts: [],
          approve_url: "{{approve_url}}",
          reject_url: "{{reject_url}}",
          edit_url: "{{edit_url}}",
        }),
        preheader: "Review and approve your automated gift",
      },
      {
        template_type: "order_status_update",
        template_name: "Order Status Update",
        subject_line: "Order Update - {{order_number}}",
        html_content: orderStatusUpdateTemplate({
          first_name: "{{first_name}}",
          order_number: "{{order_number}}",
          status: "{{status}}",
          status_message: "{{status_message}}",
          tracking_url: "{{tracking_url}}",
          estimated_delivery: "{{estimated_delivery}}",
        }),
        preheader: "Your order status has been updated",
      },
      {
        template_type: "cart_abandoned",
        template_name: "Abandoned Cart Recovery",
        subject_line: "Your cart is waiting! 🛒",
        html_content: cartAbandonedTemplate({
          first_name: "{{first_name}}",
          cart_items: [],
          cart_total: "{{cart_total}}",
          cart_url: "{{cart_url}}",
        }),
        preheader: "Complete your purchase before items are gone",
      },
      {
        template_type: "post_purchase_followup",
        template_name: "Post-Purchase Follow-up",
        subject_line: "How was your gift? 💝",
        html_content: postPurchaseFollowupTemplate({
          first_name: "{{first_name}}",
          order_number: "{{order_number}}",
          product_names: [],
          feedback_url: "{{feedback_url}}",
          support_url: "{{support_url}}",
        }),
        preheader: "We'd love your feedback!",
      },
      {
        template_type: "connection_invitation",
        template_name: "Connection Invitation",
        subject_line: "{{sender_name}} wants to connect on Elyphant",
        html_content: connectionInvitationTemplate({
          sender_name: "{{sender_name}}",
          recipient_email: "{{recipient_email}}",
          invitation_url: "{{invitation_url}}",
          personal_message: "{{personal_message}}",
        }),
        preheader: "Join Elyphant and connect with friends",
      },
    ];

    // Insert templates
    const { data: insertedTemplates, error: insertError } = await supabase
      .from("email_templates")
      .upsert(templates, { onConflict: "template_type" })
      .select();

    if (insertError) {
      console.error("Error inserting templates:", insertError);
      return new Response(
        JSON.stringify({ error: "Failed to insert templates", details: insertError.message }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log(`Successfully inserted ${insertedTemplates?.length} templates`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Successfully set up ${insertedTemplates?.length} email templates`,
        templates: insertedTemplates,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error in setup-email-templates:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
