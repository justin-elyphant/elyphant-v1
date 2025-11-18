import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Utility function to truncate product titles for email display
const truncateProductTitle = (title: string, maxLength: number = 60): string => {
  if (!title) return '';
  if (title.length <= maxLength) return title;
  return title.substring(0, maxLength).trim() + '...';
};

interface EmailRequest {
  eventType: string;
  recipientEmail: string;
  data: any;
}

// ===== EMAIL TEMPLATES =====

// Base Template
const baseEmailTemplate = ({ content, preheader }: { content: string; preheader?: string }): string => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="x-apple-disable-message-reformatting">
  <title>Elyphant</title>
  <style>
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }
    body { height: 100% !important; margin: 0 !important; padding: 0 !important; width: 100% !important; }
    body, table, td, p, a, li, blockquote { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    .brand-gradient { background-color: #9333ea; background: linear-gradient(90deg, #9333ea 0%, #7c3aed 50%, #0ea5e9 100%); }
    @media screen and (max-width: 600px) {
      .email-container { width: 100% !important; }
      .mobile-padding { padding: 20px !important; }
      .mobile-text { font-size: 16px !important; line-height: 24px !important; }
      .mobile-heading { font-size: 24px !important; line-height: 32px !important; }
    }
    @media (prefers-color-scheme: dark) {
      .dark-mode-bg { background-color: #1a1a1a !important; }
      .dark-mode-text { color: #ffffff !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #f5f5f5;">
  ${preheader ? `<div style="display: none; font-size: 1px; color: #fefefe; line-height: 1px; max-height: 0px; max-width: 0px; opacity: 0; overflow: hidden;">${preheader}</div>` : ''}
  <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f5f5f5;">
    <tr>
      <td align="center" style="padding: 40px 10px;">
        <table border="0" cellpadding="0" cellspacing="0" width="600" class="email-container" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <tr>
            <td align="center" style="padding: 40px 30px; background-color: #9333ea; background: linear-gradient(90deg, #9333ea 0%, #7c3aed 50%, #0ea5e9 100%);">
              <h1 style="margin: 0; font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 32px; font-weight: 700; color: #ffffff; letter-spacing: -0.02em;">🎁 Elyphant</h1>
            </td>
          </tr>
          <tr>
            <td class="mobile-padding" style="padding: 40px 30px;">
              ${content}
            </td>
          </tr>
          <tr>
            <td style="padding: 30px; background-color: #fafafa; border-top: 1px solid #e5e5e5;">
              <p style="margin: 0 0 15px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 14px; color: #666666; text-align: center;">
                © ${new Date().getFullYear()} Elyphant. All rights reserved.
              </p>
              <p style="margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 12px; color: #999999; text-align: center;">
                <a href="https://elyphant.ai" style="color: #9333ea; text-decoration: none;">Visit Website</a> | 
                <a href="https://elyphant.ai/privacy" style="color: #9333ea; text-decoration: none;">Privacy Policy</a> | 
                <a href="https://elyphant.ai/unsubscribe" style="color: #9333ea; text-decoration: none;">Unsubscribe</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

// Order Confirmation Template
const orderConfirmationTemplate = (props: any): string => {
  const content = `
    <h2 style="margin: 0 0 10px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 28px; font-weight: 700; color: #1a1a1a;">
      Order Confirmed! 🎉
    </h2>
    <p style="margin: 0 0 30px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 16px; color: #666666;">
      Hi ${props.customer_name}, thank you for your order. We're preparing your items for shipment.
    </p>
    <table style="background: linear-gradient(135deg, #faf5ff 0%, #f3e8ff 100%); border-radius: 8px; padding: 24px; margin-bottom: 30px; width: 100%;">
      <tr><td>
        <p style="margin: 0 0 5px 0; font-size: 12px; color: #9333ea; text-transform: uppercase;">Order Number</p>
        <p style="margin: 0 0 20px 0; font-size: 18px; color: #1a1a1a; font-weight: 600;">${props.order_number}</p>
        <p style="margin: 0 0 5px 0; font-size: 12px; color: #9333ea; text-transform: uppercase;">Total</p>
        <p style="margin: 0; font-size: 24px; color: #1a1a1a; font-weight: 700;">${props.currency || '$'}${props.total_amount}</p>
      </td></tr>
    </table>
    ${props.items ? `
    <h3 style="margin: 0 0 16px 0; font-size: 20px; font-weight: 600; color: #1a1a1a;">Order Items</h3>
    ${props.items.map((item: any) => {
      // Use item image if available, otherwise use placeholder
      const imageUrl = item.image_url || 'https://via.placeholder.com/80x80/e5e5e5/666666?text=Product';
      return `
    <table style="border-bottom: 1px solid #e5e5e5; padding: 16px 0; width: 100%;">
      <tr>
        <td style="padding-right: 16px; vertical-align: top;">
          <img src="${imageUrl}" alt="${truncateProductTitle(item.title)}" style="width: 80px; height: 80px; object-fit: cover; border-radius: 8px; display: block;" />
        </td>
        <td style="vertical-align: top;">
          <p style="margin: 0 0 5px 0; font-weight: 600; color: #1a1a1a;">${truncateProductTitle(item.title)}</p>
          <p style="margin: 0; color: #666666;">Qty: ${item.quantity} × ${item.currency || '$'}${item.price.toFixed(2)}</p>
        </td>
      </tr>
    </table>
    `;
    }).join('')}
    
    <!-- Pricing breakdown -->
    <table style="margin-top: 24px; width: 100%; border-top: 2px solid #e5e5e5; padding-top: 16px;">
      <tr>
        <td style="padding: 8px 0;"><p style="margin: 0; color: #666666; font-size: 14px;">Subtotal</p></td>
        <td align="right" style="padding: 8px 0;"><p style="margin: 0; color: #1a1a1a; font-size: 14px;">${props.currency || '$'}${props.subtotal ? props.subtotal.toFixed(2) : '0.00'}</p></td>
      </tr>
      <tr>
        <td style="padding: 8px 0;"><p style="margin: 0; color: #666666; font-size: 14px;">Shipping</p></td>
        <td align="right" style="padding: 8px 0;"><p style="margin: 0; color: #1a1a1a; font-size: 14px;">${props.currency || '$'}${props.shipping_cost ? props.shipping_cost.toFixed(2) : '0.00'}</p></td>
      </tr>
      ${props.tax_amount && props.tax_amount > 0 ? `
      <tr>
        <td style="padding: 8px 0;"><p style="margin: 0; color: #666666; font-size: 14px;">Tax</p></td>
        <td align="right" style="padding: 8px 0;"><p style="margin: 0; color: #1a1a1a; font-size: 14px;">${props.currency || '$'}${props.tax_amount.toFixed(2)}</p></td>
      </tr>
      ` : ''}
      <tr>
        <td style="padding: 8px 0;"><p style="margin: 0; color: #666666; font-size: 14px;">Gifting Fee</p></td>
        <td align="right" style="padding: 8px 0;"><p style="margin: 0; color: #1a1a1a; font-size: 14px;">${props.currency || '$'}${props.gifting_fee ? props.gifting_fee.toFixed(2) : '0.00'}</p></td>
      </tr>
      <tr style="border-top: 2px solid #e5e5e5;">
        <td style="padding: 16px 0 0 0;"><p style="margin: 0; color: #1a1a1a; font-size: 16px; font-weight: 700;">Total</p></td>
        <td align="right" style="padding: 16px 0 0 0;"><p style="margin: 0; color: #1a1a1a; font-size: 20px; font-weight: 700;">${props.currency || '$'}${props.total_amount ? props.total_amount.toFixed(2) : '0.00'}</p></td>
      </tr>
    </table>
    ` : ''}
    ${props.is_gift && props.gift_message ? `
    <div style="background-color: #f0fdf4; border-left: 4px solid #10b981; padding: 16px; margin: 24px 0; border-radius: 8px;">
      <p style="margin: 0 0 8px 0; font-weight: 600; color: #047857; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">🎁 Gift Message:</p>
      <p style="margin: 0; color: #065f46; font-style: italic; font-size: 16px; line-height: 1.6;">"${props.gift_message}"</p>
    </div>
    ` : ''}
    <table style="margin-top: 30px; width: 100%;">
      <tr><td align="center">
        <a href="https://elyphant.ai/orders/${props.order_id}" style="display: inline-block; padding: 14px 32px; background: linear-gradient(90deg, #9333ea 0%, #7c3aed 100%); color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600;">
          View Order Details
        </a>
      </td></tr>
    </table>
  `;
  return baseEmailTemplate({ content, preheader: `Order ${props.order_number} confirmed` });
};

// Order Shipped Template
const orderShippedTemplate = (props: any): string => {
  const content = `
    <h2 style="margin: 0 0 10px 0; font-size: 28px; font-weight: 700; color: #1a1a1a;">Your Order Has Shipped! 📦</h2>
    <p style="margin: 0 0 30px 0; font-size: 16px; color: #666666;">${props.customer_name ? `Hi ${props.customer_name}, your` : 'Your'} order is on its way!</p>
    <table style="background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); border-radius: 8px; padding: 24px; margin-bottom: 30px; width: 100%;">
      <tr><td>
        <p style="margin: 0 0 5px 0; font-size: 12px; color: #0ea5e9; text-transform: uppercase;">Order Number</p>
        <p style="margin: 0 0 20px 0; font-size: 18px; font-weight: 600;">${props.order_number}</p>
        ${props.tracking_number ? `
        <p style="margin: 0 0 5px 0; font-size: 12px; color: #0ea5e9; text-transform: uppercase;">Tracking Number</p>
        <p style="margin: 0 0 20px 0; font-size: 16px; font-weight: 600; font-family: monospace;">${props.tracking_number}</p>
        ` : ''}
        ${props.estimated_delivery ? `
        <p style="margin: 0 0 5px 0; font-size: 12px; color: #0ea5e9; text-transform: uppercase;">Estimated Delivery</p>
        <p style="margin: 0; font-size: 16px; font-weight: 600;">${props.estimated_delivery}</p>
        ` : ''}
      </td></tr>
    </table>
    ${props.tracking_url ? `
    <table style="margin-top: 30px; width: 100%;">
      <tr><td align="center">
        <a href="${props.tracking_url}" style="display: inline-block; padding: 14px 32px; background: linear-gradient(90deg, #0ea5e9 0%, #0284c7 100%); color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600;">
          Track Your Package
        </a>
      </td></tr>
    </table>
    ` : ''}
  `;
  return baseEmailTemplate({ content, preheader: `Order ${props.order_number} has shipped` });
};

// Order Failed Template
const orderFailedTemplate = (props: any): string => {
  const content = `
    <h2 style="margin: 0 0 10px 0; font-size: 28px; font-weight: 700; color: #1a1a1a;">Order Processing Issue ⚠️</h2>
    <p style="margin: 0 0 30px 0; font-size: 16px; color: #666666;">${props.customer_name ? `Hi ${props.customer_name}, we` : 'We'} encountered an issue with your order.</p>
    <table style="background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%); border-radius: 8px; padding: 24px; margin-bottom: 30px; width: 100%;">
      <tr><td>
        <p style="margin: 0 0 5px 0; font-size: 12px; color: #ef4444; text-transform: uppercase;">Order Number</p>
        <p style="margin: 0 0 20px 0; font-size: 18px; font-weight: 600;">${props.order_number}</p>
        ${props.error_message ? `
        <p style="margin: 0 0 5px 0; font-size: 12px; color: #ef4444; text-transform: uppercase;">Issue Details</p>
        <p style="margin: 0; font-size: 14px; color: #666666;">${props.error_message}</p>
        ` : ''}
      </td></tr>
    </table>
    <p style="margin: 0 0 20px 0; font-size: 14px; color: #666666;">Our team has been notified and is working to resolve this. You may also contact support for assistance.</p>
    <table style="margin-top: 30px; width: 100%;">
      <tr><td align="center">
        <a href="https://elyphant.ai/support" style="display: inline-block; padding: 14px 32px; background: linear-gradient(90deg, #9333ea 0%, #7c3aed 100%); color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600;">
          Contact Support
        </a>
      </td></tr>
    </table>
  `;
  return baseEmailTemplate({ content, preheader: `Issue with order ${props.order_number}` });
};

// Connection Invitation Template
const connectionInvitationTemplate = (props: any): string => {
  const content = `
    <h2 style="margin: 0 0 10px 0; font-size: 28px; font-weight: 700; color: #1a1a1a;">You've been invited! 🎉</h2>
    <p style="margin: 0 0 30px 0; font-size: 16px; color: #666666;">${props.sender_name} wants to connect with you on Elyphant!</p>
    ${props.custom_message ? `
    <table style="background: linear-gradient(135deg, #faf5ff 0%, #f3e8ff 100%); border-radius: 8px; padding: 24px; margin-bottom: 30px; border-left: 4px solid #9333ea; width: 100%;">
      <tr><td>
        <p style="margin: 0; font-size: 14px; color: #6b21a8; font-style: italic;">"${props.custom_message}"</p>
      </td></tr>
    </table>
    ` : ''}
    <h3 style="margin: 0 0 16px 0; font-size: 20px; font-weight: 600;">Why connect on Elyphant?</h3>
    <p style="margin: 0 0 10px 0; font-size: 14px;">🎁 <strong>Share wishlists</strong> - Never guess what to give again</p>
    <p style="margin: 0 0 10px 0; font-size: 14px;">🤖 <strong>Auto-gift special occasions</strong> - Set it and forget it</p>
    <p style="margin: 0 0 30px 0; font-size: 14px;">💬 <strong>Stay connected</strong> - Chat and coordinate group gifts</p>
    <table style="margin-top: 30px; width: 100%;">
      <tr><td align="center">
        <a href="${props.invitation_url}" style="display: inline-block; padding: 14px 32px; background: linear-gradient(90deg, #9333ea 0%, #7c3aed 100%); color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600;">
          Accept Invitation
        </a>
      </td></tr>
    </table>
  `;
  return baseEmailTemplate({ content, preheader: `${props.sender_name} invited you to connect` });
};

// Welcome Email Template
const welcomeEmailTemplate = (props: any): string => {
  const content = `
    <h2 style="margin: 0 0 10px 0; font-size: 28px; font-weight: 700; color: #1a1a1a;">Welcome to Elyphant! 🎉</h2>
    <p style="margin: 0 0 30px 0; font-size: 16px; color: #666666;">Hi ${props.first_name}, we're excited to have you here!</p>
    <h3 style="margin: 0 0 16px 0; font-size: 20px; font-weight: 600;">Get started with these features:</h3>
    <p style="margin: 0 0 10px 0; font-size: 14px;">🎁 <strong>Create wishlists</strong> - Share what you actually want</p>
    <p style="margin: 0 0 10px 0; font-size: 14px;">🤝 <strong>Connect with friends</strong> - Exchange gifts effortlessly</p>
    <p style="margin: 0 0 30px 0; font-size: 14px;">🤖 <strong>Set up auto-gifts</strong> - Never miss a special occasion</p>
    <table style="margin-top: 30px; width: 100%;">
      <tr><td align="center">
        <a href="${props.wishlists_url || 'https://elyphant.ai/wishlists'}" style="display: inline-block; padding: 14px 32px; background: linear-gradient(90deg, #9333ea 0%, #7c3aed 100%); color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; margin-right: 10px;">
          Create Your First Wishlist
        </a>
        <a href="${props.gifting_url || 'https://elyphant.ai/gifting'}" style="display: inline-block; padding: 14px 32px; background: linear-gradient(90deg, #7c3aed 0%, #0ea5e9 100%); color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600;">
          Start Gifting
        </a>
      </td></tr>
    </table>
  `;
  return baseEmailTemplate({ content, preheader: `Welcome to Elyphant, ${props.first_name}!` });
};

// Auto-gift Approval Template
const autoGiftApprovalTemplate = (props: any): string => {
  const content = `
    <h2 style="margin: 0 0 10px 0; font-size: 28px; font-weight: 700; color: #1a1a1a;">Auto-Gift Approval Needed 🎁</h2>
    <p style="margin: 0 0 30px 0; font-size: 16px; color: #666666;">Hi ${props.recipient_name}, it's time to approve your upcoming auto-gift for ${props.occasion}!</p>
    ${props.suggested_gifts && props.suggested_gifts.length > 0 ? `
    <h3 style="margin: 0 0 16px 0; font-size: 20px; font-weight: 600;">Suggested Gifts:</h3>
    ${props.suggested_gifts.map((gift: any) => `
    <table style="border-bottom: 1px solid #e5e5e5; padding: 16px 0; width: 100%;">
      <tr>
        <td style="padding-right: 16px;">
          ${gift.image_url ? `<img src="${gift.image_url}" alt="${gift.title}" style="width: 80px; height: 80px; object-fit: cover; border-radius: 8px;" />` : ''}
        </td>
        <td>
          <p style="margin: 0 0 5px 0; font-weight: 600; color: #1a1a1a;">${gift.title}</p>
          <p style="margin: 0; color: #666666;">${gift.price}</p>
        </td>
      </tr>
    </table>
    `).join('')}
    ` : ''}
    <table style="margin-top: 30px; width: 100%;">
      <tr><td align="center">
        <a href="${props.approve_url}" style="display: inline-block; padding: 14px 32px; background: linear-gradient(90deg, #22c55e 0%, #16a34a 100%); color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; margin-right: 10px;">
          ✅ Approve Gift
        </a>
        <a href="${props.reject_url}" style="display: inline-block; padding: 14px 32px; background: linear-gradient(90deg, #ef4444 0%, #dc2626 100%); color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600;">
          ❌ Reject
        </a>
      </td></tr>
    </table>
  `;
  return baseEmailTemplate({ content, preheader: `Approve your auto-gift for ${props.occasion}` });
};

// Connection Established Template
const connectionEstablishedTemplate = (props: any): string => {
  const content = `
    <h2 style="margin: 0 0 10px 0; font-size: 28px; font-weight: 700; color: #1a1a1a;">You're Now Connected! 🎉</h2>
    <p style="margin: 0 0 30px 0; font-size: 16px; color: #666666;">Hi ${props.recipient_name}, you and ${props.connection_name} are now connected on Elyphant!</p>
    <h3 style="margin: 0 0 16px 0; font-size: 20px; font-weight: 600;">What you can do now:</h3>
    <p style="margin: 0 0 10px 0; font-size: 14px;">🎁 <strong>View each other's wishlists</strong> - See what they really want</p>
    <p style="margin: 0 0 10px 0; font-size: 14px;">🤖 <strong>Set up auto-gifts</strong> - Never miss their special occasions</p>
    <p style="margin: 0 0 30px 0; font-size: 14px;">💬 <strong>Start chatting</strong> - Coordinate gifts and stay in touch</p>
    <table style="margin-top: 30px; width: 100%;">
      <tr><td align="center">
        <a href="https://elyphant.ai/gifting" style="display: inline-block; padding: 14px 32px; background: linear-gradient(90deg, #9333ea 0%, #7c3aed 100%); color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600;">
          Explore Gifting
        </a>
      </td></tr>
    </table>
  `;
  return baseEmailTemplate({ content, preheader: `You're now connected with ${props.connection_name}` });
};

// Template Router
const getEmailTemplate = (eventType: string, data: any): { html: string; subject: string } => {
  switch (eventType) {
    case 'order_confirmation':
      return {
        html: orderConfirmationTemplate(data),
        subject: `Order Confirmed - ${data.order_number || 'Your Order'}`
      };
    case 'order_shipped':
      return {
        html: orderShippedTemplate(data),
        subject: `Your Order Has Shipped - ${data.order_number || 'Tracking Available'}`
      };
    case 'order_failed':
      return {
        html: orderFailedTemplate(data),
        subject: `Order Processing Issue - ${data.order_number || 'Action Required'}`
      };
    case 'connection_invitation':
      return {
        html: connectionInvitationTemplate(data),
        subject: `${data.sender_name || 'Someone'} invited you to Elyphant! 🎉`
      };
    case 'connection_established':
      return {
        html: connectionEstablishedTemplate(data),
        subject: `You're now connected with ${data.connection_name || 'a friend'}! 🎉`
      };
    case 'welcome_email':
      return {
        html: welcomeEmailTemplate(data),
        subject: `Welcome to Elyphant! 🎉`
      };
    case 'auto_gift_approval':
      return {
        html: autoGiftApprovalTemplate(data),
        subject: `Auto-Gift Approval Needed - ${data.occasion || 'Special Occasion'}`
      };
    default:
      throw new Error(`Unknown email event type: ${eventType}`);
  }
};

// ===== HANDLER =====

const handler = async (req: Request): Promise<Response> => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { eventType, recipientEmail, data }: EmailRequest = await req.json();

    console.log(`📧 Orchestrating ${eventType} email for ${recipientEmail}`);

    // Render template directly (no function invoke)
    const { html, subject } = getEmailTemplate(eventType, data);

    if (!html || !subject) {
      throw new Error('Email template rendering returned invalid data');
    }

    // Send email via Resend
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    if (!resendApiKey) {
      throw new Error('RESEND_API_KEY not configured');
    }

    // Get sender configuration from environment (with fallback to verified domain)
    const fromName = Deno.env.get('RESEND_FROM_NAME') || 'Elyphant';
    const fromEmail = Deno.env.get('RESEND_FROM_EMAIL') || 'notifications@elyphant.ai';
    const senderAddress = `${fromName} <${fromEmail}>`;

    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: senderAddress,
        to: [recipientEmail],
        subject: subject,
        html: html,
      }),
    });

    if (!resendResponse.ok) {
      const errorText = await resendResponse.text();
      console.error('❌ Resend API error:', errorText);
      throw new Error(`Resend API error: ${errorText}`);
    }

    const resendData = await resendResponse.json();
    console.log(`✅ Email sent successfully via Resend:`, resendData);

    return new Response(
      JSON.stringify({ 
        success: true, 
        messageId: resendData.id 
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error: any) {
    console.error('❌ Email orchestration error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Failed to send email'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
};

serve(handler);
