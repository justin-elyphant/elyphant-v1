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

// Utility function to extract first name from full name
const getFirstName = (fullName: string | null | undefined): string => {
  if (!fullName || fullName.trim() === '') return 'there';
  const firstName = fullName.trim().split(' ')[0];
  return firstName || 'there';
};

// Utility function to format scheduled delivery date
const formatScheduledDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

// Centralized price formatting utility (prevents raw .toFixed(2) bugs)
const formatPrice = (amount: number | null | undefined): string => {
  return `$${Number(amount || 0).toFixed(2)}`;
};

// Possessive grammar helper (handles names ending in 's')
const possessive = (name: string): string => {
  if (!name) return "'s";
  return name.endsWith('s') ? `${name}'` : `${name}'s`;
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

// Shared item list HTML generator (used by confirmation, shipped, failed templates)
const renderItemsHtml = (items: any[]): string => {
  if (!items || items.length === 0) return '';
  return items.map((item: any) => {
    const imageUrl = item.image_url || 'https://via.placeholder.com/80x80/e5e5e5/666666?text=Product';
    return `
    <table style="border-bottom: 1px solid #e5e5e5; padding: 16px 0; width: 100%;">
      <tr>
        <td style="padding-right: 16px; vertical-align: top;">
          <img src="${imageUrl}" alt="${truncateProductTitle(item.title)}" style="width: 80px; height: 80px; object-fit: cover; border-radius: 8px; display: block;" />
        </td>
        <td style="vertical-align: top;">
          <p style="margin: 0 0 5px 0; font-weight: 600; color: #1a1a1a;">${truncateProductTitle(item.title)}</p>
          <p style="margin: 0; color: #666666;">Qty: ${item.quantity} × ${formatPrice(item.price)}</p>
        </td>
      </tr>
    </table>
    `;
  }).join('');
};

// Shared pricing breakdown HTML generator
const renderPricingBreakdown = (props: any): string => {
  return `
    <table style="margin-top: 24px; width: 100%; border-top: 2px solid #e5e5e5; padding-top: 16px;">
      <tr>
        <td style="padding: 8px 0;"><p style="margin: 0; color: #666666; font-size: 14px;">Subtotal</p></td>
        <td align="right" style="padding: 8px 0;"><p style="margin: 0; color: #1a1a1a; font-size: 14px;">${formatPrice(props.subtotal)}</p></td>
      </tr>
      <tr>
        <td style="padding: 8px 0;"><p style="margin: 0; color: #666666; font-size: 14px;">Shipping</p></td>
        <td align="right" style="padding: 8px 0;"><p style="margin: 0; color: #1a1a1a; font-size: 14px;">${formatPrice(props.shipping_cost)}</p></td>
      </tr>
      ${props.tax_amount && props.tax_amount > 0 ? `
      <tr>
        <td style="padding: 8px 0;"><p style="margin: 0; color: #666666; font-size: 14px;">Tax</p></td>
        <td align="right" style="padding: 8px 0;"><p style="margin: 0; color: #1a1a1a; font-size: 14px;">${formatPrice(props.tax_amount)}</p></td>
      </tr>
      ` : ''}
      <tr>
        <td style="padding: 8px 0;"><p style="margin: 0; color: #666666; font-size: 14px;">Gifting Fee</p></td>
        <td align="right" style="padding: 8px 0;"><p style="margin: 0; color: #1a1a1a; font-size: 14px;">${formatPrice(props.gifting_fee)}</p></td>
      </tr>
      <tr style="border-top: 2px solid #e5e5e5;">
        <td style="padding: 16px 0 0 0;"><p style="margin: 0; color: #1a1a1a; font-size: 16px; font-weight: 700;">Total</p></td>
        <td align="right" style="padding: 16px 0 0 0;"><p style="margin: 0; color: #1a1a1a; font-size: 20px; font-weight: 700;">${formatPrice(props.total_amount)}</p></td>
      </tr>
    </table>
  `;
};

// Shared shipping address HTML generator
const renderShippingAddress = (shippingAddress: any): string => {
  if (!shippingAddress) return '';
  const parts = [
    shippingAddress.name,
    shippingAddress.address_line1 || shippingAddress.line1,
    shippingAddress.address_line2 || shippingAddress.line2,
    [shippingAddress.city, shippingAddress.state, shippingAddress.zip_code || shippingAddress.postal_code].filter(Boolean).join(', '),
  ].filter(Boolean);
  if (parts.length === 0) return '';
  return `
    <h3 style="margin: 24px 0 12px 0; font-size: 18px; font-weight: 600; color: #1a1a1a;">📍 Shipping Address</h3>
    <p style="margin: 0 0 24px 0; font-size: 14px; color: #666666; line-height: 22px;">
      ${parts.join('<br>')}
    </p>
  `;
};

// Privacy-aware shipping address for gift orders (city/state only)
const renderGiftShippingAddress = (shippingAddress: any): string => {
  if (!shippingAddress) return '';
  const name = shippingAddress.name || 'Recipient';
  const cityState = [shippingAddress.city, shippingAddress.state].filter(Boolean).join(', ');
  return `
    <h3 style="margin: 24px 0 12px 0; font-size: 18px; font-weight: 600; color: #1a1a1a;">📍 Delivery Address</h3>
    <p style="margin: 0 0 4px 0; font-size: 14px; color: #1a1a1a; font-weight: 600;">${name}</p>
    ${cityState ? `<p style="margin: 0 0 4px 0; font-size: 14px; color: #666666;">${cityState}</p>` : ''}
    <p style="margin: 0 0 24px 0; font-size: 12px; color: #999999;">
      🔒 Full address securely stored for delivery
    </p>
  `;
};

// Order Confirmation Template
const orderConfirmationTemplate = (props: any): string => {
  const firstName = getFirstName(props.customer_name);
  const content = `
    <h2 style="margin: 0 0 10px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 28px; font-weight: 700; color: #1a1a1a;">
      Order Confirmed! 🎉
    </h2>
    <p style="margin: 0 0 30px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 16px; color: #666666;">
      Hi ${firstName}, thank you for your order. We're preparing your items for shipment.
    </p>
    ${props.scheduled_delivery_date ? `
    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); border-radius: 8px; padding: 24px; margin-bottom: 30px; border-left: 4px solid #0ea5e9;">
      <tr><td>
        <p style="margin: 0 0 8px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 14px; color: #0284c7; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">📅 Scheduled Delivery</p>
        <p style="margin: 0 0 12px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 20px; color: #1a1a1a; font-weight: 700;">${formatScheduledDate(props.scheduled_delivery_date)}</p>
        <p style="margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 14px; color: #64748b; line-height: 1.6;">Your payment will be processed and your order will ship on the scheduled delivery date.</p>
      </td></tr>
    </table>
    ` : ''}
    <table style="background: linear-gradient(135deg, #faf5ff 0%, #f3e8ff 100%); border-radius: 8px; padding: 24px; margin-bottom: 30px; width: 100%;">
      <tr><td>
        <p style="margin: 0 0 5px 0; font-size: 12px; color: #9333ea; text-transform: uppercase;">Order Number</p>
        <p style="margin: 0 0 20px 0; font-size: 18px; color: #1a1a1a; font-weight: 600;">${props.order_number}</p>
        <p style="margin: 0 0 5px 0; font-size: 12px; color: #9333ea; text-transform: uppercase;">Total</p>
        <p style="margin: 0; font-size: 24px; color: #1a1a1a; font-weight: 700;">${formatPrice(props.total_amount)}</p>
      </td></tr>
    </table>
    ${props.items ? `
    <h3 style="margin: 0 0 16px 0; font-size: 20px; font-weight: 600; color: #1a1a1a;">Order Items</h3>
    ${renderItemsHtml(props.items)}
    ${renderPricingBreakdown(props)}
    ` : ''}
    ${props.shipping_address ? (props.is_gift ? renderGiftShippingAddress(props.shipping_address) : renderShippingAddress(props.shipping_address)) : ''}
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

// Order Pending Payment Template (for scheduled/deferred orders)
const orderPendingPaymentTemplate = (props: any): string => {
  const firstName = getFirstName(props.customer_name);
  
  const content = `
    <h2 style="margin: 0 0 10px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 28px; font-weight: 700; color: #1a1a1a;">
      Order Scheduled! 📅
    </h2>
    <p style="margin: 0 0 30px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 16px; color: #666666;">
      Hi ${firstName}, your gift has been scheduled for future delivery.
    </p>
    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); border-radius: 8px; padding: 24px; margin-bottom: 30px; border-left: 4px solid #0ea5e9;">
      <tr><td>
        <p style="margin: 0 0 8px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 14px; color: #0284c7; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">📅 Scheduled Arrival</p>
        <p style="margin: 0 0 12px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 20px; color: #1a1a1a; font-weight: 700;">${props.scheduled_date ? formatScheduledDate(props.scheduled_date) : 'Pending'}</p>
        <p style="margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 14px; color: #64748b; line-height: 1.6;">
          Your payment will be processed 7 days before delivery. We'll send you a confirmation when your order ships.
        </p>
      </td></tr>
    </table>
    <table style="background: linear-gradient(135deg, #faf5ff 0%, #f3e8ff 100%); border-radius: 8px; padding: 24px; margin-bottom: 30px; width: 100%;">
      <tr><td>
        <p style="margin: 0 0 5px 0; font-size: 12px; color: #9333ea; text-transform: uppercase;">Order Number</p>
        <p style="margin: 0; font-size: 18px; color: #1a1a1a; font-weight: 600;">${props.order_number}</p>
      </td></tr>
    </table>
    
    ${props.items && props.items.length > 0 ? `
    <h3 style="margin: 0 0 16px 0; font-size: 20px; font-weight: 600; color: #1a1a1a;">Order Items</h3>
    ${renderItemsHtml(props.items)}
    ${renderPricingBreakdown(props)}
    ` : `
    <table style="background: linear-gradient(135deg, #f5f5f5 0%, #e5e5e5 100%); border-radius: 8px; padding: 24px; margin-bottom: 20px; width: 100%;">
      <tr><td>
        <p style="margin: 0 0 5px 0; font-size: 12px; color: #666666; text-transform: uppercase;">Estimated Total</p>
        <p style="margin: 0; font-size: 24px; color: #1a1a1a; font-weight: 700;">${formatPrice(props.total_amount)}</p>
      </td></tr>
    </table>
    `}
    
    ${props.shipping_address ? renderGiftShippingAddress(props.shipping_address) : ''}
    
    ${props.is_gift && props.gift_message ? `
    <div style="background-color: #f0fdf4; border-left: 4px solid #10b981; padding: 16px; margin: 24px 0; border-radius: 8px;">
      <p style="margin: 0 0 8px 0; font-weight: 600; color: #047857; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">🎁 Gift Message:</p>
      <p style="margin: 0; color: #065f46; font-style: italic; font-size: 16px; line-height: 1.6;">"${props.gift_message}"</p>
    </div>
    ` : ''}
    
    <div style="background-color: #fffbeb; border-left: 4px solid #f59e0b; padding: 16px; margin: 24px 0; border-radius: 8px;">
      <p style="margin: 0 0 8px 0; font-weight: 600; color: #b45309; font-size: 14px;">💳 Payment Not Yet Charged</p>
      <p style="margin: 0; color: #92400e; font-size: 14px; line-height: 1.6;">Your payment method has been saved securely. We'll charge your card 7 days before the scheduled delivery date.</p>
    </div>
    <table style="margin-top: 30px; width: 100%;">
      <tr><td align="center">
        <a href="https://elyphant.ai/orders/${props.order_id}" style="display: inline-block; padding: 14px 32px; background: linear-gradient(90deg, #9333ea 0%, #7c3aed 100%); color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600;">
          View Order Details
        </a>
      </td></tr>
    </table>
  `;
  return baseEmailTemplate({ content, preheader: `Order ${props.order_number} scheduled for ${props.scheduled_date ? formatScheduledDate(props.scheduled_date) : 'delivery'}` });
};

// Order Shipped Template (ENRICHED with items, address, formatted dates)
const orderShippedTemplate = (props: any): string => {
  const firstName = getFirstName(props.customer_name);
  const formattedDelivery = props.estimated_delivery ? formatScheduledDate(props.estimated_delivery) : null;
  
  const content = `
    <h2 style="margin: 0 0 10px 0; font-size: 28px; font-weight: 700; color: #1a1a1a;">Your Order Has Shipped! 📦</h2>
    <p style="margin: 0 0 30px 0; font-size: 16px; color: #666666;">Hi ${firstName}, your order is on its way!</p>
    <table style="background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); border-radius: 8px; padding: 24px; margin-bottom: 30px; width: 100%;">
      <tr><td>
        <p style="margin: 0 0 5px 0; font-size: 12px; color: #0ea5e9; text-transform: uppercase;">Order Number</p>
        <p style="margin: 0 0 20px 0; font-size: 18px; font-weight: 600;">${props.order_number}</p>
        ${props.tracking_number ? `
        <p style="margin: 0 0 5px 0; font-size: 12px; color: #0ea5e9; text-transform: uppercase;">Tracking Number</p>
        <p style="margin: 0 0 20px 0; font-size: 16px; font-weight: 600; font-family: monospace;">${props.tracking_number}</p>
        ` : ''}
        ${formattedDelivery ? `
        <p style="margin: 0 0 5px 0; font-size: 12px; color: #0ea5e9; text-transform: uppercase;">Estimated Delivery</p>
        <p style="margin: 0; font-size: 16px; font-weight: 600;">${formattedDelivery}</p>
        ` : ''}
      </td></tr>
    </table>
    ${props.items && props.items.length > 0 ? `
    <h3 style="margin: 0 0 16px 0; font-size: 20px; font-weight: 600; color: #1a1a1a;">Items in This Shipment</h3>
    ${renderItemsHtml(props.items)}
    ${renderPricingBreakdown(props)}
    ` : ''}
    ${props.shipping_address ? (props.is_gift ? renderGiftShippingAddress(props.shipping_address) : renderShippingAddress(props.shipping_address)) : ''}
    <table style="margin-top: 30px; width: 100%;">
      ${props.tracking_url ? `
      <tr><td align="center" style="padding-bottom: 12px;">
        <a href="${props.tracking_url}" style="display: inline-block; padding: 14px 32px; background: linear-gradient(90deg, #0ea5e9 0%, #0284c7 100%); color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600;">
          Track Your Package
        </a>
      </td></tr>
      ` : ''}
      <tr><td align="center">
        <a href="https://elyphant.ai/orders/${props.order_id}" style="display: inline-block; padding: 14px 32px; background: ${props.tracking_url ? '#ffffff' : 'linear-gradient(90deg, #9333ea 0%, #7c3aed 100%)'}; color: ${props.tracking_url ? '#9333ea' : '#ffffff'}; text-decoration: none; border-radius: 8px; font-weight: 600; ${props.tracking_url ? 'border: 2px solid #9333ea;' : ''}">
          View Order Details
        </a>
      </td></tr>
    </table>
  `;
  return baseEmailTemplate({ content, preheader: `Order ${props.order_number} has shipped${formattedDelivery ? ` - arrives ${formattedDelivery}` : ''}` });
};

// Order Failed Template (ENRICHED with items and first-name greeting)
const orderFailedTemplate = (props: any): string => {
  const firstName = getFirstName(props.customer_name);
  const content = `
    <h2 style="margin: 0 0 10px 0; font-size: 28px; font-weight: 700; color: #1a1a1a;">Order Processing Issue ⚠️</h2>
    <p style="margin: 0 0 30px 0; font-size: 16px; color: #666666;">Hi ${firstName}, we encountered an issue with your order.</p>
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
    ${props.items && props.items.length > 0 ? `
    <h3 style="margin: 0 0 16px 0; font-size: 20px; font-weight: 600; color: #1a1a1a;">Affected Items</h3>
    ${renderItemsHtml(props.items)}
    ` : ''}
    <p style="margin: 0 0 20px 0; font-size: 14px; color: #666666;">Our team has been notified and is working to resolve this. You may also contact support for assistance.</p>
    <table style="margin-top: 30px; width: 100%;">
      <tr><td align="center" style="padding-bottom: 12px;">
        <a href="https://elyphant.ai/orders/${props.order_id}" style="display: inline-block; padding: 14px 32px; background: linear-gradient(90deg, #9333ea 0%, #7c3aed 100%); color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600;">
          View Order Details
        </a>
      </td></tr>
      <tr><td align="center">
        <a href="https://elyphant.ai/support" style="display: inline-block; padding: 14px 32px; background: #ffffff; color: #9333ea; text-decoration: none; border-radius: 8px; font-weight: 600; border: 2px solid #9333ea;">
          Contact Support
        </a>
      </td></tr>
    </table>
  `;
  return baseEmailTemplate({ content, preheader: `Issue with order ${props.order_number} - we're on it` });
};

// Connection Invitation Template (also used for gift invitations)
const connectionInvitationTemplate = (props: any): string => {
  // Build gift context banner if this invitation has a pending gift
  const giftContextBanner = props.has_pending_gift ? `
    <table style="background: linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%); border-radius: 8px; padding: 20px; margin-bottom: 30px; border-left: 4px solid #f97316; width: 100%;">
      <tr><td>
        <p style="margin: 0 0 8px 0; font-size: 16px; font-weight: 600; color: #c2410c;">🎁 ${props.sender_name} has a gift waiting for you!</p>
        ${props.gift_occasion ? `<p style="margin: 0; font-size: 14px; color: #ea580c;">For your ${props.gift_occasion}</p>` : ''}
      </td></tr>
    </table>
  ` : '';

  const content = `
    <h2 style="margin: 0 0 10px 0; font-size: 28px; font-weight: 700; color: #1a1a1a;">You've been invited! 🎉</h2>
    <p style="margin: 0 0 30px 0; font-size: 16px; color: #666666;">${props.sender_name} wants to connect with you on Elyphant!</p>
    ${giftContextBanner}
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
  
  const preheader = props.has_pending_gift 
    ? `🎁 ${props.sender_name} has a gift waiting for you on Elyphant!`
    : `${props.sender_name} invited you to connect`;
    
  return baseEmailTemplate({ content, preheader });
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

// Helper to format occasion names (birthday -> Birthday, mothers_day -> Mother's Day)
const formatOccasion = (occasion: string): string => {
  if (!occasion) return 'Special Occasion';
  const occasionMap: Record<string, string> = {
    'birthday': 'Birthday',
    'christmas': 'Christmas',
    'mothers_day': "Mother's Day",
    'fathers_day': "Father's Day",
    'valentine': "Valentine's Day",
    'valentines_day': "Valentine's Day",
    'anniversary': 'Anniversary',
    'graduation': 'Graduation',
    'wedding': 'Wedding',
    'housewarming': 'Housewarming',
    'baby_shower': 'Baby Shower',
    'retirement': 'Retirement',
  };
  return occasionMap[occasion.toLowerCase()] || occasion.replace(/_/g, ' ')
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

// Auto-gift Approval Template - Enhanced with event context and next steps
const autoGiftApprovalTemplate = (props: any): string => {
  const formattedOccasion = formatOccasion(props.occasion);
  const budgetDisplay = props.budget ? formatPrice(props.budget) : 'Flexible';
  
  const content = `
    <h2 style="margin: 0 0 10px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 28px; font-weight: 700; color: #1a1a1a;">
      Auto-Gift Approval Needed 🎁
    </h2>
    <p style="margin: 0 0 30px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 16px; color: #666666; line-height: 24px;">
      Hi ${props.first_name}, it's time to approve your upcoming auto-gift for <strong>${props.recipient_name}</strong>!
    </p>
    
    <!-- Upcoming Event Card -->
    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background: linear-gradient(135deg, #faf5ff 0%, #f3e8ff 100%); border-radius: 8px; margin-bottom: 30px; border-left: 4px solid #9333ea;">
      <tr><td style="padding: 24px;">
        <p style="margin: 0 0 8px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 12px; color: #9333ea; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">
          📅 UPCOMING EVENT
        </p>
        <p style="margin: 0 0 8px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 20px; color: #1a1a1a; font-weight: 700;">
          ${possessive(props.recipient_name)} ${formattedOccasion}
        </p>
        <p style="margin: 0 0 12px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 16px; color: #1a1a1a; font-weight: 600;">
          ${props.event_date || props.execution_date || 'Coming soon'}
        </p>
        <p style="margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 14px; color: #64748b;">
          Budget: Up to ${budgetDisplay}
        </p>
      </td></tr>
    </table>
    
    ${props.suggested_gifts && props.suggested_gifts.length > 0 ? `
    <h3 style="margin: 0 0 16px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 18px; font-weight: 600; color: #1a1a1a;">
      Suggested Gifts from Wishlist:
    </h3>
    ${props.suggested_gifts.map((gift: any) => `
    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="border-bottom: 1px solid #e5e5e5; padding: 16px 0;">
      <tr>
        <td style="padding-right: 16px; vertical-align: top; width: 80px;">
          ${gift.image_url ? `<img src="${gift.image_url}" alt="${truncateProductTitle(gift.name || 'Gift')}" style="width: 80px; height: 80px; object-fit: cover; border-radius: 8px; display: block;" />` : '<div style="width: 80px; height: 80px; background: #f0f0f0; border-radius: 8px;"></div>'}
        </td>
        <td style="vertical-align: top;">
          <p style="margin: 0 0 5px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-weight: 600; color: #1a1a1a; font-size: 14px;">
            ${truncateProductTitle(gift.name || 'Gift Item')}
          </p>
          <p style="margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; color: #666666; font-size: 14px;">
            ${typeof gift.price === 'number' ? formatPrice(gift.price) : (gift.price || '')}
          </p>
        </td>
      </tr>
    </table>
    `).join('')}
    ` : ''}
    
    <!-- What Happens Next Card -->
    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); border-radius: 8px; margin: 30px 0; border-left: 4px solid #0ea5e9;">
      <tr><td style="padding: 24px;">
        <p style="margin: 0 0 12px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 12px; color: #0284c7; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">
          🔔 WHAT HAPPENS NEXT
        </p>
        <p style="margin: 0 0 8px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 14px; color: #334155; line-height: 22px;">
          ${props.deadline_date ? `• <strong>Approve by ${props.deadline_date}</strong> to ensure on-time delivery` : '• Approve soon to ensure on-time delivery'}
        </p>
        <p style="margin: 0 0 8px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 14px; color: #334155; line-height: 22px;">
          • We'll order the gift and handle everything for you
        </p>
        <p style="margin: 0 0 8px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 14px; color: #334155; line-height: 22px;">
          • Payment charged 4 days before their special day
        </p>
        <p style="margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 14px; color: #334155; line-height: 22px;">
          • Gift arrives right on time! 🎉
        </p>
      </td></tr>
    </table>
    
    <!-- Action Buttons -->
    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-top: 30px;">
      <tr>
        <td align="center">
          <a href="${props.approve_url}" style="display: inline-block; padding: 16px 32px; background: linear-gradient(90deg, #22c55e 0%, #16a34a 100%); color: #ffffff; text-decoration: none; border-radius: 8px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 16px; font-weight: 600; margin-right: 12px;">
            ✅ Approve Gift
          </a>
          <a href="${props.reject_url}" style="display: inline-block; padding: 16px 32px; background: linear-gradient(90deg, #ef4444 0%, #dc2626 100%); color: #ffffff; text-decoration: none; border-radius: 8px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 16px; font-weight: 600;">
            ❌ Reject
          </a>
        </td>
      </tr>
    </table>
    
    <!-- Footer Help -->
    <p style="margin: 30px 0 0 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 14px; color: #64748b; text-align: center; line-height: 22px;">
      Questions? Reply to this email or visit your<br>
      <a href="https://elyphant.ai/auto-gifts" style="color: #9333ea; text-decoration: none; font-weight: 500;">Recurring Gifts Dashboard</a>
    </p>
  `;
  return baseEmailTemplate({ content, preheader: `Approve your auto-gift for ${possessive(props.recipient_name)} ${formattedOccasion}` });
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

// ZMA Low Balance Alert Template
const zmaLowBalanceAlertTemplate = (props: any): string => {
  const alertColor = props.is_critical ? '#dc2626' : '#f59e0b';
  const alertBg = props.is_critical ? 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)' : 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)';
  const alertIcon = props.is_critical ? '🚨' : '⚠️';
  
  const content = `
    <h2 style="margin: 0 0 10px 0; font-size: 28px; font-weight: 700; color: #1a1a1a;">${alertIcon} ZMA Balance Alert</h2>
    <p style="margin: 0 0 30px 0; font-size: 16px; color: #666666;">Your Zinc Managed Account balance requires attention.</p>
    
    <table style="background: ${alertBg}; border-radius: 8px; padding: 24px; margin-bottom: 30px; width: 100%; border-left: 4px solid ${alertColor};">
      <tr><td>
        <p style="margin: 0 0 5px 0; font-size: 12px; color: ${alertColor}; text-transform: uppercase; font-weight: 600;">Current Balance</p>
        <p style="margin: 0 0 20px 0; font-size: 32px; font-weight: 700; color: #1a1a1a;">${formatPrice(props.current_balance)}</p>
        
        <p style="margin: 0 0 5px 0; font-size: 12px; color: ${alertColor}; text-transform: uppercase; font-weight: 600;">Alert Threshold</p>
        <p style="margin: 0 0 20px 0; font-size: 18px; font-weight: 600; color: #1a1a1a;">${formatPrice(props.threshold)}</p>
        
        ${props.pending_orders_value ? `
        <p style="margin: 0 0 5px 0; font-size: 12px; color: #666666; text-transform: uppercase;">Pending Orders Value</p>
        <p style="margin: 0 0 20px 0; font-size: 18px; font-weight: 600; color: #1a1a1a;">${formatPrice(props.pending_orders_value)}</p>
        ` : ''}
        
        ${props.orders_waiting > 0 ? `
        <p style="margin: 0 0 5px 0; font-size: 12px; color: #dc2626; text-transform: uppercase; font-weight: 600;">Orders Waiting for Funds</p>
        <p style="margin: 0 0 20px 0; font-size: 18px; font-weight: 600; color: #dc2626;">${props.orders_waiting} orders on hold</p>
        ` : ''}
        
        ${props.recommended_transfer > 0 ? `
        <p style="margin: 0 0 5px 0; font-size: 12px; color: #059669; text-transform: uppercase; font-weight: 600;">Recommended Transfer</p>
        <p style="margin: 0; font-size: 24px; font-weight: 700; color: #059669;">${formatPrice(props.recommended_transfer)}</p>
        ` : ''}
      </td></tr>
    </table>
    
    <h3 style="margin: 0 0 16px 0; font-size: 18px; font-weight: 600; color: #1a1a1a;">Action Required:</h3>
    <ol style="margin: 0 0 30px 0; padding-left: 20px; color: #666666; font-size: 14px; line-height: 1.8;">
      <li>Log into your Chase bank account</li>
      <li>Transfer funds to Zinc via PayPal</li>
      <li>Record the transfer in the Trunkline dashboard</li>
      <li>Click "Retry Awaiting Orders" to process held orders</li>
    </ol>
    
    <table style="margin-top: 30px; width: 100%;">
      <tr><td align="center">
        <a href="https://elyphant.ai/trunkline/funding" style="display: inline-block; padding: 14px 32px; background: linear-gradient(90deg, #dc2626 0%, #b91c1c 100%); color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600;">
          View Funding Dashboard
        </a>
      </td></tr>
    </table>
  `;
  
  const preheader = props.is_critical 
    ? `CRITICAL: ZMA balance is ${formatPrice(props.current_balance)} - orders may be blocked`
    : `ZMA balance is ${formatPrice(props.current_balance)} - transfer recommended`;
    
  return baseEmailTemplate({ content, preheader });
};

// Wishlist Shared Template
const wishlistSharedTemplate = (props: any): string => {
  const content = `
    <h2 style="margin: 0 0 10px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 28px; font-weight: 700; color: #1a1a1a;">
      ${props.sender_name} shared a wishlist with you! 🎁
    </h2>
    <p style="margin: 0 0 30px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 16px; color: #666666;">
      Hi ${props.recipient_name}, check out what ${props.sender_name} wants you to see!
    </p>
    
    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background: linear-gradient(135deg, #faf5ff 0%, #f3e8ff 100%); border-radius: 8px; padding: 24px; margin-bottom: 30px;">
      <tr><td>
        <p style="margin: 0 0 8px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 20px; font-weight: 600; color: #1a1a1a;">
          ${props.wishlist_title}
        </p>
        <p style="margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 14px; color: #666666;">
          ${props.item_count} items • ${formatPrice(props.total_value)}
        </p>
      </td></tr>
    </table>
    
    ${props.message ? `
    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); border-left: 4px solid #9333ea; border-radius: 0 8px 8px 0; padding: 16px; margin-bottom: 30px;">
      <tr><td>
        <p style="margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 14px; color: #6b21a8; font-style: italic;">
          "${props.message}"
        </p>
      </td></tr>
    </table>
    ` : ''}
    
    <table style="margin-top: 30px; width: 100%;">
      <tr><td align="center">
        <a href="${props.wishlist_url}" style="display: inline-block; padding: 14px 32px; background: linear-gradient(90deg, #9333ea 0%, #7c3aed 100%); color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600;">
          View Wishlist
        </a>
      </td></tr>
    </table>
  `;
  return baseEmailTemplate({ content, preheader: `${props.sender_name} shared a wishlist with you` });
};

// Recurring Gift Rule Created Template (sent to shopper when they create recurring gift rules)
const recurringGiftRuleCreatedTemplate = (props: any): string => {
  const firstName = getFirstName(props.shopper_name);
  const recipientName = props.recipient_name || 'your friend';
  
  // Format events list
  const eventsHtml = (props.events || []).map((event: any) => {
    const occasionIcons: Record<string, string> = {
      birthday: '🎂',
      christmas: '🎄',
      valentine: '❤️',
      valentines_day: '❤️',
      mothers_day: '💐',
      fathers_day: '👔',
      anniversary: '💍',
    };
    const icon = occasionIcons[event.date_type?.toLowerCase()] || '🎁';
    const occasionName = event.occasion_name || formatOccasion(event.date_type) || 'Special Occasion';
    return `<li style="margin: 8px 0; color: #374151;">${icon} <strong>${occasionName}</strong>${event.date ? ` - ${event.date}` : ''}</li>`;
  }).join('');

  const content = `
    <h2 style="margin: 0 0 10px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 28px; font-weight: 700; color: #1a1a1a;">
      Recurring Gifts Set Up! 🔄
    </h2>
    <p style="margin: 0 0 30px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 16px; color: #666666;">
      Hi ${firstName}, you've successfully set up recurring gifts for <strong>${recipientName}</strong>.
    </p>
    
    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); border-radius: 8px; padding: 24px; margin-bottom: 30px; border-left: 4px solid #10b981;">
      <tr><td>
        <p style="margin: 0 0 16px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 14px; color: #047857; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">📅 Configured Events</p>
        <ul style="margin: 0; padding-left: 20px; font-size: 16px;">
          ${eventsHtml || `<li style="color: #374151;">🎁 <strong>${formatOccasion(props.occasion || props.rule_details?.occasion || '')}</strong>${props.scheduled_date ? ` - ${props.scheduled_date}` : ''}</li>`}
        </ul>
      </td></tr>
    </table>
    
    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background: linear-gradient(135deg, #faf5ff 0%, #f3e8ff 100%); border-radius: 8px; padding: 24px; margin-bottom: 30px;">
      <tr><td>
        <p style="margin: 0 0 5px 0; font-size: 12px; color: #9333ea; text-transform: uppercase;">Budget Per Gift</p>
        <p style="margin: 0 0 20px 0; font-size: 24px; color: #1a1a1a; font-weight: 700;">Up to ${formatPrice(props.budget || props.budget_limit || props.rule_details?.budget_limit || 50)}</p>
        <p style="margin: 0 0 5px 0; font-size: 12px; color: #9333ea; text-transform: uppercase;">Auto-Approve</p>
        <p style="margin: 0; font-size: 16px; color: #374151;">${(props.auto_approve || props.auto_approve_enabled) ? '✅ Enabled - Gifts will be sent automatically' : '🔔 Disabled - You\'ll approve each gift'}</p>
      </td></tr>
    </table>
    
    <div style="background-color: #eff6ff; border-left: 4px solid #3b82f6; padding: 16px; margin: 24px 0; border-radius: 8px;">
      <p style="margin: 0 0 8px 0; font-weight: 600; color: #1d4ed8; font-size: 14px;">💡 How It Works</p>
      <p style="margin: 0; color: #1e40af; font-size: 14px; line-height: 1.6;">We'll notify you 7 days before each event with gift suggestions from ${possessive(recipientName)} wishlist. ${(props.auto_approve || props.auto_approve_enabled) ? 'Gifts will be purchased and shipped automatically.' : 'You\'ll review and approve before we purchase.'}</p>
    </div>
    
    <table style="margin-top: 30px; width: 100%;">
      <tr><td align="center">
        <a href="https://elyphant.lovable.app/recurring-gifts" style="display: inline-block; padding: 14px 32px; background: linear-gradient(90deg, #9333ea 0%, #7c3aed 100%); color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600;">
          Manage Recurring Gifts
        </a>
      </td></tr>
    </table>
  `;
  return baseEmailTemplate({ content, preheader: `Recurring gifts for ${recipientName} are all set!` });
};

// Gift Coming Your Way Template (sent to recipient when a gift is purchased for them)
const giftComingYourWayTemplate = (props: any): string => {
  const firstName = getFirstName(props.recipient_name);
  
  // Format occasion nicely
  const getOccasionText = (occasion: string | null): string => {
    if (!occasion) return '';
    const occasionMap: Record<string, string> = {
      birthday: ' for your Birthday',
      christmas: ' for Christmas',
      valentine: ' for Valentine\'s Day',
      valentines_day: ' for Valentine\'s Day',
      mothers_day: ' for Mother\'s Day',
      fathers_day: ' for Father\'s Day',
      anniversary: ' for your Anniversary',
    };
    return occasionMap[occasion.toLowerCase()] || ` for ${occasion.replace(/_/g, ' ')}`;
  };

  const occasionText = getOccasionText(props.occasion);
  
  const content = `
    <h2 style="margin: 0 0 10px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 28px; font-weight: 700; color: #1a1a1a;">
      A Gift Is On Its Way! 🎁
    </h2>
    <p style="margin: 0 0 30px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 16px; color: #666666;">
      Hey ${firstName}, exciting news! <strong>${props.sender_name || 'Someone special'}</strong> just sent you a gift${occasionText}!
    </p>
    
    ${props.arrival_date ? `
    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); border-radius: 8px; padding: 24px; margin-bottom: 30px; border-left: 4px solid #0ea5e9;">
      <tr><td align="center">
        <p style="margin: 0 0 8px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 14px; color: #0284c7; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">📦 Expected Arrival</p>
        <p style="margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 24px; color: #1a1a1a; font-weight: 700;">${formatScheduledDate(props.arrival_date)}</p>
      </td></tr>
    </table>
    ` : ''}
    
    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background: linear-gradient(135deg, #faf5ff 0%, #f3e8ff 100%); border-radius: 8px; padding: 24px; margin-bottom: 30px;">
      <tr><td align="center">
        <p style="margin: 0 0 12px 0; font-size: 48px;">🤫</p>
        <p style="margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 16px; color: #6b21a8; font-style: italic;">
          We're keeping the details a surprise!
        </p>
      </td></tr>
    </table>
    
    <p style="margin: 0 0 30px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 14px; color: #666666; text-align: center;">
      Want to make sure ${props.sender_name?.split(' ')[0] || 'they'} knows exactly what you'd love? Keep your wishlist updated!
    </p>
    
    <table style="margin-top: 30px; width: 100%;">
      <tr><td align="center">
        <a href="https://elyphant.lovable.app/dashboard" style="display: inline-block; padding: 14px 32px; background: linear-gradient(90deg, #9333ea 0%, #7c3aed 100%); color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600;">
          View Your Dashboard
        </a>
      </td></tr>
    </table>
  `;
  return baseEmailTemplate({ content, preheader: `${props.sender_name || 'Someone special'} sent you a gift! 🎁` });
};

// Auto-Gift Payment Failed Template
const autoGiftPaymentFailedTemplate = (props: any): string => {
  const firstName = getFirstName(props.customer_name || props.recipient_name);
  const occasion = props.occasion?.replace(/_/g, ' ') || 'upcoming event';
  
  const content = `
    <h2 style="margin: 0 0 10px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 28px; font-weight: 700; color: #1a1a1a;">
      Payment Issue ⚠️
    </h2>
    <p style="margin: 0 0 30px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 16px; color: #666666;">
      Hi ${firstName}, we tried to process payment for <strong>${possessive(props.recipient_name || 'your recipient')}</strong> ${occasion} gift, but your saved card was declined.
    </p>
    
    <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 16px; margin: 24px 0; border-radius: 8px;">
      <p style="margin: 0 0 8px 0; font-weight: 600; color: #dc2626; font-size: 14px;">❌ Payment Declined</p>
      <p style="margin: 0; color: #991b1b; font-size: 14px; line-height: 1.6;">${props.error_summary || 'Your card could not be charged. Please update your payment method.'}</p>
    </div>
    
    <div style="background-color: #eff6ff; border-left: 4px solid #3b82f6; padding: 16px; margin: 24px 0; border-radius: 8px;">
      <p style="margin: 0 0 8px 0; font-weight: 600; color: #1d4ed8; font-size: 14px;">💡 What To Do</p>
      <p style="margin: 0; color: #1e40af; font-size: 14px; line-height: 1.6;">Update your payment method and we'll retry. If no action is taken, you'll be redirected to a checkout page to complete the purchase manually.</p>
    </div>
    
    <table style="margin-top: 30px; width: 100%;">
      <tr><td align="center">
        <a href="https://elyphant.lovable.app/recurring-gifts" style="display: inline-block; padding: 14px 32px; background: linear-gradient(90deg, #9333ea 0%, #7c3aed 100%); color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600;">
          Update Payment Method
        </a>
      </td></tr>
    </table>
  `;
  return baseEmailTemplate({ content, preheader: `Action needed: Payment failed for ${possessive(props.recipient_name || 'your')} gift` });
};

// Guest Order Confirmation Template (viral signup CTA)
const guestOrderConfirmationTemplate = (props: any): string => {
  const firstName = getFirstName(props.customer_name);
  const content = `
    <h2 style="margin: 0 0 10px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 28px; font-weight: 700; color: #1a1a1a;">
      Order Confirmed! 🎉
    </h2>
    <p style="margin: 0 0 30px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 16px; color: #666666;">
      Hi ${firstName}, thank you for your order. We're preparing your items for shipment.
    </p>
    ${props.scheduled_delivery_date ? `
    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); border-radius: 8px; padding: 24px; margin-bottom: 30px; border-left: 4px solid #0ea5e9;">
      <tr><td>
        <p style="margin: 0 0 8px 0; font-size: 14px; color: #0284c7; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">📅 Scheduled Delivery</p>
        <p style="margin: 0 0 12px 0; font-size: 20px; color: #1a1a1a; font-weight: 700;">${formatScheduledDate(props.scheduled_delivery_date)}</p>
        <p style="margin: 0; font-size: 14px; color: #64748b; line-height: 1.6;">Your payment will be processed and your order will ship on the scheduled delivery date.</p>
      </td></tr>
    </table>
    ` : ''}
    <table style="background: linear-gradient(135deg, #faf5ff 0%, #f3e8ff 100%); border-radius: 8px; padding: 24px; margin-bottom: 30px; width: 100%;">
      <tr><td>
        <p style="margin: 0 0 5px 0; font-size: 12px; color: #9333ea; text-transform: uppercase;">Order Number</p>
        <p style="margin: 0 0 20px 0; font-size: 18px; color: #1a1a1a; font-weight: 600;">${props.order_number}</p>
        <p style="margin: 0 0 5px 0; font-size: 12px; color: #9333ea; text-transform: uppercase;">Total</p>
        <p style="margin: 0; font-size: 24px; color: #1a1a1a; font-weight: 700;">${formatPrice(props.total_amount)}</p>
      </td></tr>
    </table>
    ${props.items ? `
    <h3 style="margin: 0 0 16px 0; font-size: 20px; font-weight: 600; color: #1a1a1a;">Order Items</h3>
    ${renderItemsHtml(props.items)}
    ${renderPricingBreakdown(props)}
    ` : ''}
    ${props.shipping_address ? (props.is_gift ? renderGiftShippingAddress(props.shipping_address) : renderShippingAddress(props.shipping_address)) : ''}
    ${props.is_gift && props.gift_message ? `
    <div style="background-color: #f0fdf4; border-left: 4px solid #10b981; padding: 16px; margin: 24px 0; border-radius: 8px;">
      <p style="margin: 0 0 8px 0; font-weight: 600; color: #047857; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">🎁 Gift Message:</p>
      <p style="margin: 0; color: #065f46; font-style: italic; font-size: 16px; line-height: 1.6;">"${props.gift_message}"</p>
    </div>
    ` : ''}

    <!-- Viral Signup CTA for Guest -->
    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background: linear-gradient(135deg, #faf5ff 0%, #ede9fe 50%, #e0f2fe 100%); border-radius: 12px; padding: 32px 24px; margin: 30px 0; border: 1px solid #c4b5fd;">
      <tr><td align="center">
        <p style="margin: 0 0 8px 0; font-size: 24px;">🐘</p>
        <h3 style="margin: 0 0 10px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 20px; font-weight: 700; color: #1a1a1a;">
          You're almost an Elyphant!
        </h3>
        <p style="margin: 0 0 20px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 14px; color: #666666; line-height: 22px;">
          Create a free account to track your order, save wishlists, set up auto-gifts, and get AI-powered gift recommendations.
        </p>
        <table border="0" cellpadding="0" cellspacing="0">
          <tr>
            <td style="padding-right: 12px;">
              <a href="https://elyphant.ai/auth/signup?email=${encodeURIComponent(props.guest_email || '')}" style="display: inline-block; padding: 14px 28px; background: linear-gradient(90deg, #9333ea 0%, #7c3aed 50%, #0ea5e9 100%); color: #ffffff; text-decoration: none; border-radius: 8px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 15px; font-weight: 600;">
                Create Free Account
              </a>
            </td>
          </tr>
        </table>
        <p style="margin: 16px 0 0 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 12px; color: #9333ea;">
          ✨ Track orders · Wishlists · Auto-Gifts · AI Recommendations
        </p>
      </td></tr>
    </table>

    <table style="margin-top: 10px; width: 100%;">
      <tr><td align="center">
        <a href="https://elyphant.ai/order-confirmation?session_id=${props.checkout_session_id || ''}" style="display: inline-block; padding: 14px 32px; background: #ffffff; color: #9333ea; text-decoration: none; border-radius: 8px; font-weight: 600; border: 2px solid #9333ea; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 15px;">
          View Order Details
        </a>
      </td></tr>
    </table>
  `;
  return baseEmailTemplate({ content, preheader: `Order ${props.order_number} confirmed! Create a free account to track it 🎁` });
};

// Template Router
const getEmailTemplate = (eventType: string, data: any): { html: string; subject: string } => {
  switch (eventType) {
    case 'wishlist_shared':
      return {
        html: wishlistSharedTemplate(data),
        subject: `${data.sender_name || 'A friend'} shared a wishlist with you! 🎁`
      };
    case 'order_confirmation':
      return {
        html: orderConfirmationTemplate(data),
        subject: `Order Confirmed - ${data.order_number || 'Your Order'}`
      };
    case 'order_pending_payment':
      return {
        html: orderPendingPaymentTemplate(data),
        subject: `Order Scheduled - ${data.order_number || 'Your Order'}`
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
    case 'gift_invitation':
      return {
        html: connectionInvitationTemplate(data),
        subject: data.has_pending_gift 
          ? `🎁 ${data.sender_name || 'Someone'} has a gift waiting for you!`
          : `${data.sender_name || 'Someone'} invited you to Elyphant! 🎉`
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
        subject: `Auto-Gift Approval Needed - ${possessive(data.recipient_name)} ${formatOccasion(data.occasion)} 🎁`
      };
    case 'recurring_gift_rule_created':
    case 'auto_gift_rule_created': // Alias for backward compatibility
      return {
        html: recurringGiftRuleCreatedTemplate(data),
        subject: `Recurring Gifts Set Up for ${data.recipient_name || 'Your Friend'}! 🔄`
      };
    case 'gift_coming_your_way':
      return {
        html: giftComingYourWayTemplate(data),
        subject: `${data.sender_name || 'Someone special'} sent you a gift! 🎁`
      };
    case 'zma_low_balance_alert':
      return {
        html: zmaLowBalanceAlertTemplate(data),
        subject: data.is_critical 
          ? `🚨 CRITICAL: ZMA Balance Alert - Orders Blocked`
          : `⚠️ ZMA Low Balance Alert - Transfer Recommended`
      };
    case 'auto_gift_payment_failed':
      return {
        html: autoGiftPaymentFailedTemplate(data),
        subject: `⚠️ Payment Failed for ${possessive(data.recipient_name || 'Your')} Gift - Action Needed`
      };
    case 'guest_order_confirmation':
      return {
        html: guestOrderConfirmationTemplate(data),
        subject: `Order Confirmed - ${data.order_number || 'Your Order'} 🎁`
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
    const { eventType, recipientEmail, data, orderId, metadata }: EmailRequest & { orderId?: string; metadata?: any } = await req.json();

    console.log(`📧 Orchestrating ${eventType} email for ${recipientEmail || 'recipient'}`);

    let emailData = data || metadata; // Support both 'data' and 'metadata' fields
    let emailRecipient = recipientEmail;

    // If orderId provided for order events, fetch full order details from DB
    const orderFetchEventTypes = ['order_confirmation', 'guest_order_confirmation', 'order_pending_payment', 'order_shipped', 'order_failed'];
    if (orderFetchEventTypes.includes(eventType) && orderId && !emailData) {
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const supabase = createClient(supabaseUrl, supabaseKey);

      const { data: order, error: orderError } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .single();

      if (orderError || !order) {
        throw new Error(`Failed to fetch order: ${orderError?.message || 'Order not found'}`);
      }

      // For guest orders, use guest_email; for authenticated users, fetch from profiles
      if (order.user_id) {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('email')
          .eq('id', order.user_id)
          .single();

        if (profileError || !profile?.email) {
          throw new Error(`Failed to fetch user email: ${profileError?.message || 'Email not found'}`);
        }
        emailRecipient = profile.email;
      } else if (order.guest_email) {
        emailRecipient = order.guest_email;
      } else if (recipientEmail) {
        // Use the recipientEmail passed in the request
        emailRecipient = recipientEmail;
      } else {
        throw new Error('No email found for order: no user_id, guest_email, or recipientEmail');
      }

      // Format order data for email template
      const lineItems = (order.line_items as any)?.items || [];
      const shippingAddress = order.shipping_address as any;
      const customerName = shippingAddress?.name || 'Customer';
      
      // Detect gift: check both camelCase (webhook) and snake_case variants,
      // plus heuristic: if shipping name differs from buyer profile, it's a gift
      const giftOpts = order.gift_options as any;
      const lineItems_raw = order.line_items as any;
      const hasGiftFlag = giftOpts?.isGift || giftOpts?.is_gift || false;
      const hasRecipientInItems = lineItems_raw?.items?.some((item: any) => item.recipient_id || item.recipient_name);
      
      // Look up buyer's name from profile to compare with shipping name
      let isGiftByNameMismatch = false;
      if (!hasGiftFlag && order.user_id) {
        const { data: buyerProfile } = await supabase
          .from('profiles')
          .select('first_name, last_name')
          .eq('id', order.user_id)
          .single();
        if (buyerProfile) {
          const buyerName = `${buyerProfile.first_name || ''} ${buyerProfile.last_name || ''}`.trim().toLowerCase();
          const shippingName = (shippingAddress?.name || '').trim().toLowerCase();
          if (buyerName && shippingName && buyerName !== shippingName) {
            isGiftByNameMismatch = true;
          }
        }
      }
      
      const effectiveIsGift = hasGiftFlag || !!hasRecipientInItems || isGiftByNameMismatch;

      emailData = {
        customer_name: customerName,
        order_number: order.order_number || `ORD-${order.id.slice(0, 8)}`,
        order_id: order.id,
        total_amount: order.total_amount || 0,
        // Values in line_items JSONB are stored in DOLLARS (not cents)
        subtotal: lineItems_raw?.subtotal || 0,
        shipping_cost: lineItems_raw?.shipping || 0,
        tax_amount: lineItems_raw?.tax || 0,
        gifting_fee: lineItems_raw?.gifting_fee || 0,
        items: lineItems.map((item: any) => ({
          title: item.title || item.product_name || 'Product',
          quantity: item.quantity || 1,
          price: item.price || 0, // Already in dollars
          image_url: item.image_url || item.image
        })),
        shipping_address: shippingAddress || null,
        is_gift: effectiveIsGift,
        gift_message: giftOpts?.giftMessage || giftOpts?.gift_message || null,
        scheduled_delivery_date: order.scheduled_delivery_date || null,
        scheduled_date: order.scheduled_delivery_date || null, // Alias for pending_payment template
        // For shipped emails
        tracking_number: order.tracking_number || null,
        estimated_delivery: order.estimated_delivery || order.scheduled_delivery_date || null,
        tracking_url: order.tracking_number ? `https://www.amazon.com/progress-tracker/package/?itemId=${order.tracking_number}` : null,
        // For failed emails
        error_message: order.notes || null,
        // For guest emails
        guest_email: order.guest_email || null,
        checkout_session_id: order.checkout_session_id || null,
      };
    }

    // Render template directly (no function invoke)
    const { html, subject } = getEmailTemplate(eventType, emailData);

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
        to: [emailRecipient],
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
