import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};
import {
  orderConfirmationTemplate,
  paymentConfirmationTemplate,
  welcomeEmailTemplate,
  giftInvitationTemplate,
  autoGiftApprovalTemplate,
  orderStatusUpdateTemplate,
  cartAbandonedTemplate,
  postPurchaseFollowupTemplate,
  connectionInvitationTemplate,
} from "../ecommerce-email-orchestrator/email-templates/index.ts";

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { template_type } = await req.json();

    let html = '';
    
    // Sample data for each template type
    switch (template_type) {
      case 'order_confirmation':
        html = orderConfirmationTemplate({
          first_name: 'Sarah',
          order_number: 'ORD-20250107-1234',
          total_amount: '$127.50',
          order_date: 'January 7, 2025',
          items: [
            { name: 'Premium Wireless Headphones', quantity: 1, price: '$99.99' },
            { name: 'Phone Case - Blue', quantity: 2, price: '$27.51' }
          ],
          shipping_address: '123 Main Street\nApartment 4B\nSan Francisco, CA 94102\nUnited States',
          tracking_url: 'https://example.com/track/ABC123'
        });
        break;

      case 'payment_confirmation':
        html = paymentConfirmationTemplate({
          first_name: 'Sarah',
          order_number: 'ORD-20250107-1234',
          total_amount: '$127.50',
          payment_date: 'January 7, 2025',
          payment_method: 'Visa ending in 4242',
          receipt_url: 'https://example.com/receipt/ABC123'
        });
        break;

      case 'welcome_email':
        html = welcomeEmailTemplate({
          first_name: 'Sarah',
          dashboard_url: 'https://example.com/dashboard',
          profile_url: 'https://example.com/profile'
        });
        break;

      case 'gift_invitation':
        html = giftInvitationTemplate({
          sender_name: 'John Smith',
          recipient_name: 'Sarah',
          occasion: 'Birthday',
          acceptance_url: 'https://example.com/accept/ABC123',
          message: 'I thought you might enjoy picking out something special for your birthday! 🎁'
        });
        break;

      case 'auto_gift_approval':
        html = autoGiftApprovalTemplate({
          first_name: 'Sarah',
          recipient_name: 'Mom',
          occasion: 'Birthday',
          suggested_gifts: [
            {
              name: 'Cozy Throw Blanket',
              price: '$49.99',
              image_url: 'https://via.placeholder.com/150',
              reason: 'Perfect for relaxing evenings'
            }
          ],
          approval_url: 'https://example.com/approve/ABC123',
          scheduled_date: 'January 15, 2025'
        });
        break;

      case 'order_status_update':
        html = orderStatusUpdateTemplate({
          first_name: 'Sarah',
          order_number: 'ORD-20250107-1234',
          status: 'shipped',
          status_message: 'Your order has been shipped and is on its way!',
          tracking_number: 'TRK123456789',
          tracking_url: 'https://example.com/track/ABC123',
          estimated_delivery: 'January 12, 2025'
        });
        break;

      case 'cart_abandoned':
        html = cartAbandonedTemplate({
          first_name: 'Sarah',
          cart_items: [
            { name: 'Premium Wireless Headphones', price: '$99.99', image_url: 'https://via.placeholder.com/100' }
          ],
          cart_total: '$99.99',
          cart_url: 'https://example.com/cart'
        });
        break;

      case 'post_purchase_followup':
        html = postPurchaseFollowupTemplate({
          first_name: 'Sarah',
          order_number: 'ORD-20250107-1234',
          product_names: 'Premium Wireless Headphones',
          feedback_url: 'https://example.com/feedback',
          support_url: 'https://example.com/support'
        });
        break;

      case 'connection_invitation':
        html = connectionInvitationTemplate({
          sender_name: 'John Smith',
          recipient_name: 'Sarah',
          acceptance_url: 'https://example.com/connect/ABC123',
          message: 'I would love to connect with you on Elyphant!'
        });
        break;

      default:
        throw new Error(`Unknown template type: ${template_type}`);
    }

    return new Response(
      JSON.stringify({ html }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error: any) {
    console.error('Error rendering template:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
