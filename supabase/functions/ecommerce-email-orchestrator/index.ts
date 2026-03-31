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

// Shared font stack
const fontStack = `-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif`;

// Base Template — minimalist, Lululemon-inspired
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
    @media screen and (max-width: 600px) {
      .email-container { width: 100% !important; }
      .mobile-padding { padding: 20px !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #f5f5f5;">
  ${preheader ? `<div style="display: none; font-size: 1px; color: #fefefe; line-height: 1px; max-height: 0px; max-width: 0px; opacity: 0; overflow: hidden;">${preheader}</div>` : ''}
  <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f5f5f5;">
    <tr>
      <td align="center" style="padding: 40px 10px;">
        <table border="0" cellpadding="0" cellspacing="0" width="600" class="email-container" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 4px rgba(0,0,0,0.06);">
          <!-- Header: Logo + gradient wordmark -->
          <tr>
            <td align="center" style="padding: 40px 30px 24px 30px;">
              <table border="0" cellpadding="0" cellspacing="0" style="margin: 0 auto;">
                <tr>
                  <td valign="middle" style="padding-right: 8px;">
                    <img src="https://elyphant.ai/lovable-uploads/9b4f3dc7-ff8b-46c4-9eb3-56681e8c73b9.png" alt="Elyphant" width="36" height="36" style="display: block; border: 0;" />
                  </td>
                  <td valign="middle">
                    <h1 style="margin: 0; font-family: ${fontStack}; font-size: 26px; font-weight: 700; letter-spacing: -0.02em;">
                      <span style="color: #9333ea;">Ely</span><span style="color: #7c3aed;">ph</span><span style="color: #6d28d9;">a</span><span style="color: #4f46e5;">n</span><span style="color: #0ea5e9;">t</span>
                    </h1>
                  </td>
                </tr>
              </table>
              <div style="width: 40px; height: 2px; background: linear-gradient(90deg, #9333ea 0%, #0ea5e9 100%); margin: 16px auto 0 auto;"></div>
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td class="mobile-padding" style="padding: 0 30px 40px 30px;">
              ${content}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding: 30px; border-top: 1px solid #f3f4f6;">
              <p style="margin: 0 0 12px 0; font-family: ${fontStack}; font-size: 13px; color: #9ca3af; text-align: center;">
                &copy; ${new Date().getFullYear()} Elyphant. All rights reserved.
              </p>
              <p style="margin: 0; font-family: ${fontStack}; font-size: 12px; color: #9ca3af; text-align: center; line-height: 1.8;">
                <a href="https://elyphant.ai" style="color: #9ca3af; text-decoration: underline;">Website</a> &nbsp;&middot;&nbsp;
                <a href="https://elyphant.ai/privacy" style="color: #9ca3af; text-decoration: underline;">Privacy</a> &nbsp;&middot;&nbsp;
                <a href="https://elyphant.ai/unsubscribe" style="color: #9ca3af; text-decoration: underline;">Unsubscribe</a>
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
    <p style="margin: 24px 0 8px 0; font-family: ${fontStack}; font-size: 13px; text-transform: uppercase; letter-spacing: 0.08em; color: #9ca3af; font-weight: 500;">Shipping address</p>
    <p style="margin: 0 0 24px 0; font-family: ${fontStack}; font-size: 14px; color: #4b5563; line-height: 22px;">
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
    <p style="margin: 24px 0 8px 0; font-family: ${fontStack}; font-size: 13px; text-transform: uppercase; letter-spacing: 0.08em; color: #9ca3af; font-weight: 500;">Delivery address</p>
    <p style="margin: 0 0 4px 0; font-family: ${fontStack}; font-size: 14px; color: #1a1a1a; font-weight: 600;">${name}</p>
    ${cityState ? `<p style="margin: 0 0 4px 0; font-family: ${fontStack}; font-size: 14px; color: #4b5563;">${cityState}</p>` : ''}
    <p style="margin: 0 0 24px 0; font-family: ${fontStack}; font-size: 12px; color: #9ca3af;">
      Full address securely stored for delivery
    </p>
  `;
};

// Order Confirmation Template
const orderConfirmationTemplate = (props: any): string => {
  const firstName = getFirstName(props.customer_name);
  const content = `
    <h2 style="margin: 0 0 8px 0; font-family: ${fontStack}; font-size: 28px; font-weight: 300; color: #1a1a1a; letter-spacing: -0.02em;">
      Your order is confirmed.
    </h2>
    <p style="margin: 0 0 32px 0; font-family: ${fontStack}; font-size: 16px; color: #6b7280; line-height: 1.6;">
      Hi ${firstName}, thank you for your order. We're preparing your items for shipment.
    </p>
    ${props.scheduled_delivery_date ? `
    <div style="border: 1px solid #e5e7eb; border-radius: 8px; padding: 24px; margin-bottom: 24px;">
      <p style="margin: 0 0 8px 0; font-family: ${fontStack}; font-size: 13px; text-transform: uppercase; letter-spacing: 0.08em; color: #9ca3af; font-weight: 500;">Scheduled delivery</p>
      <p style="margin: 0 0 12px 0; font-family: ${fontStack}; font-size: 18px; color: #1a1a1a; font-weight: 600;">${formatScheduledDate(props.scheduled_delivery_date)}</p>
      <p style="margin: 0; font-family: ${fontStack}; font-size: 14px; color: #6b7280; line-height: 1.6;">Your payment will be processed and your order will ship on the scheduled delivery date.</p>
    </div>
    ` : ''}
    <div style="border: 1px solid #e5e7eb; border-radius: 8px; padding: 24px; margin-bottom: 24px;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td style="padding: 8px 0; font-family: ${fontStack}; font-size: 13px; text-transform: uppercase; letter-spacing: 0.08em; color: #9ca3af;">Order number</td>
          <td align="right" style="padding: 8px 0; font-family: ${fontStack}; font-size: 15px; font-weight: 600; color: #1a1a1a;">${props.order_number}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; border-top: 1px solid #f3f4f6; font-family: ${fontStack}; font-size: 13px; text-transform: uppercase; letter-spacing: 0.08em; color: #9ca3af;">Total</td>
          <td align="right" style="padding: 8px 0; border-top: 1px solid #f3f4f6; font-family: ${fontStack}; font-size: 18px; font-weight: 700; color: #1a1a1a;">${formatPrice(props.total_amount)}</td>
        </tr>
      </table>
    </div>
    ${props.items ? `
    <p style="margin: 0 0 16px 0; font-family: ${fontStack}; font-size: 13px; text-transform: uppercase; letter-spacing: 0.08em; color: #9ca3af; font-weight: 500;">Order items</p>
    ${renderItemsHtml(props.items)}
    ${renderPricingBreakdown(props)}
    ` : ''}
    ${props.shipping_address ? (props.is_gift ? renderGiftShippingAddress(props.shipping_address) : renderShippingAddress(props.shipping_address)) : ''}
    ${props.is_gift && props.gift_message ? `
    <div style="border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 24px 0;">
      <p style="margin: 0 0 8px 0; font-family: ${fontStack}; font-size: 13px; text-transform: uppercase; letter-spacing: 0.08em; color: #9ca3af; font-weight: 500;">Gift message</p>
      <p style="margin: 0; font-family: ${fontStack}; color: #4b5563; font-style: italic; font-size: 15px; line-height: 1.6;">"${props.gift_message}"</p>
    </div>
    ` : ''}
    <table style="margin-top: 32px; width: 100%;">
      <tr><td align="center">
        <a href="https://elyphant.ai/orders/${props.order_id}" style="display: inline-block; padding: 14px 40px; background: #1a1a1a; color: #ffffff; text-decoration: none; border-radius: 6px; font-family: ${fontStack}; font-size: 14px; font-weight: 500; letter-spacing: 0.02em;">
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
    <h2 style="margin: 0 0 8px 0; font-family: ${fontStack}; font-size: 28px; font-weight: 300; color: #1a1a1a; letter-spacing: -0.02em;">
      Your order is scheduled.
    </h2>
    <p style="margin: 0 0 32px 0; font-family: ${fontStack}; font-size: 16px; color: #6b7280; line-height: 1.6;">
      Hi ${firstName}, your gift has been scheduled for future delivery.
    </p>
    <div style="border: 1px solid #e5e7eb; border-radius: 8px; padding: 24px; margin-bottom: 24px;">
      <p style="margin: 0 0 8px 0; font-family: ${fontStack}; font-size: 13px; text-transform: uppercase; letter-spacing: 0.08em; color: #9ca3af; font-weight: 500;">Scheduled arrival</p>
      <p style="margin: 0 0 12px 0; font-family: ${fontStack}; font-size: 18px; color: #1a1a1a; font-weight: 600;">${props.scheduled_date ? formatScheduledDate(props.scheduled_date) : 'Pending'}</p>
      <p style="margin: 0; font-family: ${fontStack}; font-size: 14px; color: #6b7280; line-height: 1.6;">
        Your payment will be processed 7 days before delivery. We'll send you a confirmation when your order ships.
      </p>
    </div>
    <div style="border: 1px solid #e5e7eb; border-radius: 8px; padding: 24px; margin-bottom: 24px;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td style="padding: 8px 0; font-family: ${fontStack}; font-size: 13px; text-transform: uppercase; letter-spacing: 0.08em; color: #9ca3af;">Order number</td>
          <td align="right" style="padding: 8px 0; font-family: ${fontStack}; font-size: 15px; font-weight: 600; color: #1a1a1a;">${props.order_number}</td>
        </tr>
      </table>
    </div>
    
    ${props.items && props.items.length > 0 ? `
    <p style="margin: 0 0 16px 0; font-family: ${fontStack}; font-size: 13px; text-transform: uppercase; letter-spacing: 0.08em; color: #9ca3af; font-weight: 500;">Order items</p>
    ${renderItemsHtml(props.items)}
    ${renderPricingBreakdown(props)}
    ` : `
    <div style="border: 1px solid #e5e7eb; border-radius: 8px; padding: 24px; margin-bottom: 24px;">
      <p style="margin: 0 0 4px 0; font-family: ${fontStack}; font-size: 13px; text-transform: uppercase; letter-spacing: 0.08em; color: #9ca3af;">Estimated total</p>
      <p style="margin: 0; font-family: ${fontStack}; font-size: 20px; color: #1a1a1a; font-weight: 700;">${formatPrice(props.total_amount)}</p>
    </div>
    `}
    
    ${props.shipping_address ? renderGiftShippingAddress(props.shipping_address) : ''}
    
    ${props.is_gift && props.gift_message ? `
    <div style="border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 24px 0;">
      <p style="margin: 0 0 8px 0; font-family: ${fontStack}; font-size: 13px; text-transform: uppercase; letter-spacing: 0.08em; color: #9ca3af; font-weight: 500;">Gift message</p>
      <p style="margin: 0; font-family: ${fontStack}; color: #4b5563; font-style: italic; font-size: 15px; line-height: 1.6;">"${props.gift_message}"</p>
    </div>
    ` : ''}
    
    <div style="border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 24px 0;">
      <p style="margin: 0 0 8px 0; font-family: ${fontStack}; font-weight: 600; color: #1a1a1a; font-size: 14px;">Payment not yet charged</p>
      <p style="margin: 0; font-family: ${fontStack}; color: #6b7280; font-size: 14px; line-height: 1.6;">Your payment method has been saved securely. We'll charge your card 7 days before the scheduled delivery date.</p>
    </div>
    <table style="margin-top: 32px; width: 100%;">
      <tr><td align="center">
        <a href="https://elyphant.ai/orders/${props.order_id}" style="display: inline-block; padding: 14px 40px; background: #1a1a1a; color: #ffffff; text-decoration: none; border-radius: 6px; font-family: ${fontStack}; font-size: 14px; font-weight: 500; letter-spacing: 0.02em;">
          View Order Details
        </a>
      </td></tr>
    </table>
  `;
  return baseEmailTemplate({ content, preheader: `Order ${props.order_number} scheduled for ${props.scheduled_date ? formatScheduledDate(props.scheduled_date) : 'delivery'}` });
};

// Order Shipped Template
const orderShippedTemplate = (props: any): string => {
  const firstName = getFirstName(props.customer_name);
  const formattedDelivery = props.estimated_delivery ? formatScheduledDate(props.estimated_delivery) : null;
  
  const content = `
    <h2 style="margin: 0 0 8px 0; font-family: ${fontStack}; font-size: 28px; font-weight: 300; color: #1a1a1a; letter-spacing: -0.02em;">Your order has shipped.</h2>
    <p style="margin: 0 0 32px 0; font-family: ${fontStack}; font-size: 16px; color: #6b7280; line-height: 1.6;">Hi ${firstName}, your order is on its way.</p>
    <div style="border: 1px solid #e5e7eb; border-radius: 8px; padding: 24px; margin-bottom: 24px;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td style="padding: 8px 0; font-family: ${fontStack}; font-size: 13px; text-transform: uppercase; letter-spacing: 0.08em; color: #9ca3af;">Order number</td>
          <td align="right" style="padding: 8px 0; font-family: ${fontStack}; font-size: 15px; font-weight: 600; color: #1a1a1a;">${props.order_number}</td>
        </tr>
        ${props.tracking_number ? `
        <tr>
          <td style="padding: 8px 0; border-top: 1px solid #f3f4f6; font-family: ${fontStack}; font-size: 13px; text-transform: uppercase; letter-spacing: 0.08em; color: #9ca3af;">Tracking</td>
          <td align="right" style="padding: 8px 0; border-top: 1px solid #f3f4f6; font-family: ${fontStack}; font-size: 14px; font-weight: 600; color: #1a1a1a; font-variant-numeric: tabular-nums;">${props.tracking_number}</td>
        </tr>
        ` : ''}
        ${formattedDelivery ? `
        <tr>
          <td style="padding: 8px 0; border-top: 1px solid #f3f4f6; font-family: ${fontStack}; font-size: 13px; text-transform: uppercase; letter-spacing: 0.08em; color: #9ca3af;">Estimated delivery</td>
          <td align="right" style="padding: 8px 0; border-top: 1px solid #f3f4f6; font-family: ${fontStack}; font-size: 15px; font-weight: 600; color: #1a1a1a;">${formattedDelivery}</td>
        </tr>
        ` : ''}
      </table>
    </div>
    ${props.items && props.items.length > 0 ? `
    <p style="margin: 0 0 16px 0; font-family: ${fontStack}; font-size: 13px; text-transform: uppercase; letter-spacing: 0.08em; color: #9ca3af; font-weight: 500;">Items in this shipment</p>
    ${renderItemsHtml(props.items)}
    ${renderPricingBreakdown(props)}
    ` : ''}
    ${props.shipping_address ? (props.is_gift ? renderGiftShippingAddress(props.shipping_address) : renderShippingAddress(props.shipping_address)) : ''}
    <table style="margin-top: 32px; width: 100%;">
      ${props.tracking_url ? `
      <tr><td align="center" style="padding-bottom: 12px;">
        <a href="${props.tracking_url}" style="display: inline-block; padding: 14px 40px; background: #1a1a1a; color: #ffffff; text-decoration: none; border-radius: 6px; font-family: ${fontStack}; font-size: 14px; font-weight: 500; letter-spacing: 0.02em;">
          Track Your Package
        </a>
      </td></tr>
      ` : ''}
      <tr><td align="center">
        <a href="https://elyphant.ai/orders/${props.order_id}" style="display: inline-block; padding: 14px 40px; background: ${props.tracking_url ? '#ffffff' : '#1a1a1a'}; color: ${props.tracking_url ? '#1a1a1a' : '#ffffff'}; text-decoration: none; border-radius: 6px; font-family: ${fontStack}; font-size: 14px; font-weight: 500; letter-spacing: 0.02em; ${props.tracking_url ? 'border: 1px solid #1a1a1a;' : ''}">
          View Order Details
        </a>
      </td></tr>
    </table>
  `;
  return baseEmailTemplate({ content, preheader: `Order ${props.order_number} has shipped${formattedDelivery ? ` — arrives ${formattedDelivery}` : ''}` });
};

// Order Failed Template
const orderFailedTemplate = (props: any): string => {
  const firstName = getFirstName(props.customer_name);
  const content = `
    <h2 style="margin: 0 0 8px 0; font-family: ${fontStack}; font-size: 28px; font-weight: 300; color: #1a1a1a; letter-spacing: -0.02em;">There's an issue with your order.</h2>
    <p style="margin: 0 0 32px 0; font-family: ${fontStack}; font-size: 16px; color: #6b7280; line-height: 1.6;">Hi ${firstName}, we encountered an issue processing your order.</p>
    <div style="border: 1px solid #e5e7eb; border-radius: 8px; padding: 24px; margin-bottom: 24px;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td style="padding: 8px 0; font-family: ${fontStack}; font-size: 13px; text-transform: uppercase; letter-spacing: 0.08em; color: #9ca3af;">Order number</td>
          <td align="right" style="padding: 8px 0; font-family: ${fontStack}; font-size: 15px; font-weight: 600; color: #1a1a1a;">${props.order_number}</td>
        </tr>
        ${props.error_message ? `
        <tr>
          <td colspan="2" style="padding: 12px 0 0 0; border-top: 1px solid #f3f4f6; font-family: ${fontStack}; font-size: 14px; color: #6b7280; line-height: 1.6;">${props.error_message}</td>
        </tr>
        ` : ''}
      </table>
    </div>
    ${props.items && props.items.length > 0 ? `
    <p style="margin: 0 0 16px 0; font-family: ${fontStack}; font-size: 13px; text-transform: uppercase; letter-spacing: 0.08em; color: #9ca3af; font-weight: 500;">Affected items</p>
    ${renderItemsHtml(props.items)}
    ` : ''}
    <p style="margin: 0 0 24px 0; font-family: ${fontStack}; font-size: 14px; color: #6b7280; line-height: 1.6;">Our team has been notified and is working to resolve this. You may also contact support for assistance.</p>
    <table style="margin-top: 32px; width: 100%;">
      <tr><td align="center" style="padding-bottom: 12px;">
        <a href="https://elyphant.ai/orders/${props.order_id}" style="display: inline-block; padding: 14px 40px; background: #1a1a1a; color: #ffffff; text-decoration: none; border-radius: 6px; font-family: ${fontStack}; font-size: 14px; font-weight: 500; letter-spacing: 0.02em;">
          View Order Details
        </a>
      </td></tr>
      <tr><td align="center">
        <a href="https://elyphant.ai/support" style="display: inline-block; padding: 14px 40px; background: #ffffff; color: #1a1a1a; text-decoration: none; border-radius: 6px; font-family: ${fontStack}; font-size: 14px; font-weight: 500; letter-spacing: 0.02em; border: 1px solid #1a1a1a;">
          Contact Support
        </a>
      </td></tr>
    </table>
  `;
  return baseEmailTemplate({ content, preheader: `Issue with order ${props.order_number} — we're on it` });
};

// Connection Invitation Template (also used for gift invitations)
const connectionInvitationTemplate = (props: any): string => {
  const giftContextBanner = props.has_pending_gift ? `
    <div style="border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
      <p style="margin: 0 0 4px 0; font-family: ${fontStack}; font-size: 15px; font-weight: 600; color: #1a1a1a;">${props.sender_name} has a gift waiting for you</p>
      ${props.gift_occasion ? `<p style="margin: 0; font-family: ${fontStack}; font-size: 14px; color: #6b7280;">For your ${props.gift_occasion}</p>` : ''}
    </div>
  ` : '';

  const content = `
    <h2 style="margin: 0 0 8px 0; font-family: ${fontStack}; font-size: 28px; font-weight: 300; color: #1a1a1a; letter-spacing: -0.02em;">You've been invited.</h2>
    <p style="margin: 0 0 32px 0; font-family: ${fontStack}; font-size: 16px; color: #6b7280; line-height: 1.6;">${props.sender_name} wants to connect with you on Elyphant.</p>
    ${giftContextBanner}
    ${props.custom_message ? `
    <div style="border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
      <p style="margin: 0; font-family: ${fontStack}; font-size: 14px; color: #4b5563; font-style: italic; line-height: 1.6;">"${props.custom_message}"</p>
    </div>
    ` : ''}
    <p style="margin: 0 0 16px 0; font-family: ${fontStack}; font-size: 13px; text-transform: uppercase; letter-spacing: 0.08em; color: #9ca3af; font-weight: 500;">Why connect on Elyphant</p>
    <p style="margin: 0 0 8px 0; font-family: ${fontStack}; font-size: 14px; color: #4b5563; line-height: 1.6;"><strong>Share wishlists</strong> — never guess what to give again</p>
    <p style="margin: 0 0 8px 0; font-family: ${fontStack}; font-size: 14px; color: #4b5563; line-height: 1.6;"><strong>Auto-gift special occasions</strong> — set it and forget it</p>
    <p style="margin: 0 0 32px 0; font-family: ${fontStack}; font-size: 14px; color: #4b5563; line-height: 1.6;"><strong>Stay connected</strong> — chat and coordinate group gifts</p>
    <table style="width: 100%;">
      <tr><td align="center">
        <a href="${props.invitation_url}" style="display: inline-block; padding: 14px 40px; background: #1a1a1a; color: #ffffff; text-decoration: none; border-radius: 6px; font-family: ${fontStack}; font-size: 14px; font-weight: 500; letter-spacing: 0.02em;">
          Accept Invitation
        </a>
      </td></tr>
    </table>
  `;
  
  const preheader = props.has_pending_gift 
    ? `${props.sender_name} has a gift waiting for you on Elyphant`
    : `${props.sender_name} invited you to connect`;
    
  return baseEmailTemplate({ content, preheader });
};

// Welcome Email Template
const welcomeEmailTemplate = (props: any): string => {
  const content = `
    <h2 style="margin: 0 0 8px 0; font-family: ${fontStack}; font-size: 28px; font-weight: 300; color: #1a1a1a; letter-spacing: -0.02em;">Welcome to Elyphant.</h2>
    <p style="margin: 0 0 32px 0; font-family: ${fontStack}; font-size: 16px; color: #6b7280; line-height: 1.6;">Hi ${props.first_name}, we're excited to have you here.</p>
    <p style="margin: 0 0 16px 0; font-family: ${fontStack}; font-size: 13px; text-transform: uppercase; letter-spacing: 0.08em; color: #9ca3af; font-weight: 500;">Get started</p>
    <p style="margin: 0 0 8px 0; font-family: ${fontStack}; font-size: 14px; color: #4b5563; line-height: 1.6;"><strong>Create wishlists</strong> — share what you actually want</p>
    <p style="margin: 0 0 8px 0; font-family: ${fontStack}; font-size: 14px; color: #4b5563; line-height: 1.6;"><strong>Connect with friends</strong> — exchange gifts effortlessly</p>
    <p style="margin: 0 0 32px 0; font-family: ${fontStack}; font-size: 14px; color: #4b5563; line-height: 1.6;"><strong>Set up auto-gifts</strong> — never miss a special occasion</p>
    <table style="width: 100%;">
      <tr><td align="center" style="padding-bottom: 12px;">
        <a href="${props.wishlists_url || 'https://elyphant.ai/wishlists'}" style="display: inline-block; padding: 14px 40px; background: #1a1a1a; color: #ffffff; text-decoration: none; border-radius: 6px; font-family: ${fontStack}; font-size: 14px; font-weight: 500; letter-spacing: 0.02em;">
          Create Your First Wishlist
        </a>
      </td></tr>
      <tr><td align="center">
        <a href="${props.gifting_url || 'https://elyphant.ai/gifting'}" style="display: inline-block; padding: 14px 40px; background: #ffffff; color: #1a1a1a; text-decoration: none; border-radius: 6px; font-family: ${fontStack}; font-size: 14px; font-weight: 500; letter-spacing: 0.02em; border: 1px solid #1a1a1a;">
          Start Gifting
        </a>
      </td></tr>
    </table>
  `;
  return baseEmailTemplate({ content, preheader: `Welcome to Elyphant, ${props.first_name}` });
};

// Helper to format occasion names
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

// Auto-gift Approval Template
const autoGiftApprovalTemplate = (props: any): string => {
  const formattedOccasion = formatOccasion(props.occasion);
  const budgetDisplay = props.budget ? formatPrice(props.budget) : 'Flexible';
  
  const content = `
    <h2 style="margin: 0 0 8px 0; font-family: ${fontStack}; font-size: 28px; font-weight: 300; color: #1a1a1a; letter-spacing: -0.02em;">
      Auto-gift approval needed.
    </h2>
    <p style="margin: 0 0 32px 0; font-family: ${fontStack}; font-size: 16px; color: #6b7280; line-height: 1.6;">
      Hi ${props.first_name}, it's time to approve your upcoming auto-gift for <strong>${props.recipient_name}</strong>.
    </p>
    
    <!-- Upcoming Event Card -->
    <div style="border: 1px solid #e5e7eb; border-radius: 8px; padding: 24px; margin-bottom: 24px;">
      <p style="margin: 0 0 8px 0; font-family: ${fontStack}; font-size: 13px; text-transform: uppercase; letter-spacing: 0.08em; color: #9ca3af; font-weight: 500;">Upcoming event</p>
      <p style="margin: 0 0 8px 0; font-family: ${fontStack}; font-size: 18px; color: #1a1a1a; font-weight: 600;">
        ${possessive(props.recipient_name)} ${formattedOccasion}
      </p>
      <p style="margin: 0 0 12px 0; font-family: ${fontStack}; font-size: 15px; color: #1a1a1a; font-weight: 600;">
        ${props.event_date || props.execution_date || 'Coming soon'}
      </p>
      <p style="margin: 0; font-family: ${fontStack}; font-size: 14px; color: #6b7280;">
        Budget: Up to ${budgetDisplay}
      </p>
    </div>
    
    ${props.suggested_gifts && props.suggested_gifts.length > 0 ? `
    <p style="margin: 0 0 16px 0; font-family: ${fontStack}; font-size: 13px; text-transform: uppercase; letter-spacing: 0.08em; color: #9ca3af; font-weight: 500;">Suggested gifts from wishlist</p>
    ${props.suggested_gifts.map((gift: any) => `
    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="border-bottom: 1px solid #f3f4f6; padding: 16px 0;">
      <tr>
        <td style="padding-right: 16px; vertical-align: top; width: 80px;">
          ${gift.image_url ? `<img src="${gift.image_url}" alt="${truncateProductTitle(gift.name || 'Gift')}" style="width: 80px; height: 80px; object-fit: cover; border-radius: 8px; display: block;" />` : '<div style="width: 80px; height: 80px; background: #f3f4f6; border-radius: 8px;"></div>'}
        </td>
        <td style="vertical-align: top;">
          <p style="margin: 0 0 5px 0; font-family: ${fontStack}; font-weight: 600; color: #1a1a1a; font-size: 14px;">
            ${truncateProductTitle(gift.name || 'Gift Item')}
          </p>
          <p style="margin: 0; font-family: ${fontStack}; color: #6b7280; font-size: 14px;">
            ${typeof gift.price === 'number' ? formatPrice(gift.price) : (gift.price || '')}
          </p>
        </td>
      </tr>
    </table>
    `).join('')}
    ` : ''}
    
    <!-- What Happens Next -->
    <div style="border: 1px solid #e5e7eb; border-radius: 8px; padding: 24px; margin: 24px 0;">
      <p style="margin: 0 0 12px 0; font-family: ${fontStack}; font-size: 13px; text-transform: uppercase; letter-spacing: 0.08em; color: #9ca3af; font-weight: 500;">What happens next</p>
      <p style="margin: 0 0 8px 0; font-family: ${fontStack}; font-size: 14px; color: #4b5563; line-height: 1.6;">
        ${props.deadline_date ? `Approve by <strong>${props.deadline_date}</strong> to ensure on-time delivery` : 'Approve soon to ensure on-time delivery'}
      </p>
      <p style="margin: 0 0 8px 0; font-family: ${fontStack}; font-size: 14px; color: #4b5563; line-height: 1.6;">
        We'll order the gift and handle everything for you
      </p>
      <p style="margin: 0 0 8px 0; font-family: ${fontStack}; font-size: 14px; color: #4b5563; line-height: 1.6;">
        Payment charged 4 days before their special day
      </p>
      <p style="margin: 0; font-family: ${fontStack}; font-size: 14px; color: #4b5563; line-height: 1.6;">
        Gift arrives right on time
      </p>
    </div>
    
    <!-- Action Buttons -->
    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-top: 32px;">
      <tr><td align="center" style="padding-bottom: 12px;">
        <a href="${props.approve_url}" style="display: inline-block; padding: 14px 40px; background: #1a1a1a; color: #ffffff; text-decoration: none; border-radius: 6px; font-family: ${fontStack}; font-size: 14px; font-weight: 500; letter-spacing: 0.02em;">
          Approve Gift
        </a>
      </td></tr>
      <tr><td align="center">
        <a href="${props.reject_url}" style="display: inline-block; padding: 14px 40px; background: #ffffff; color: #1a1a1a; text-decoration: none; border-radius: 6px; font-family: ${fontStack}; font-size: 14px; font-weight: 500; letter-spacing: 0.02em; border: 1px solid #1a1a1a;">
          Decline
        </a>
      </td></tr>
    </table>
    
    <p style="margin: 32px 0 0 0; font-family: ${fontStack}; font-size: 13px; color: #9ca3af; text-align: center; line-height: 1.6;">
      Questions? Reply to this email or visit your
      <a href="https://elyphant.ai/auto-gifts" style="color: #9ca3af; text-decoration: underline;">Recurring Gifts Dashboard</a>
    </p>
  `;
  return baseEmailTemplate({ content, preheader: `Approve your auto-gift for ${possessive(props.recipient_name)} ${formattedOccasion}` });
};

// Connection Established Template
const connectionEstablishedTemplate = (props: any): string => {
  const content = `
    <h2 style="margin: 0 0 8px 0; font-family: ${fontStack}; font-size: 28px; font-weight: 300; color: #1a1a1a; letter-spacing: -0.02em;">You're now connected.</h2>
    <p style="margin: 0 0 32px 0; font-family: ${fontStack}; font-size: 16px; color: #6b7280; line-height: 1.6;">Hi ${props.recipient_name}, you and ${props.connection_name} are now connected on Elyphant.</p>
    <p style="margin: 0 0 16px 0; font-family: ${fontStack}; font-size: 13px; text-transform: uppercase; letter-spacing: 0.08em; color: #9ca3af; font-weight: 500;">What you can do now</p>
    <p style="margin: 0 0 8px 0; font-family: ${fontStack}; font-size: 14px; color: #4b5563; line-height: 1.6;"><strong>View each other's wishlists</strong> — see what they really want</p>
    <p style="margin: 0 0 8px 0; font-family: ${fontStack}; font-size: 14px; color: #4b5563; line-height: 1.6;"><strong>Set up auto-gifts</strong> — never miss their special occasions</p>
    <p style="margin: 0 0 32px 0; font-family: ${fontStack}; font-size: 14px; color: #4b5563; line-height: 1.6;"><strong>Start chatting</strong> — coordinate gifts and stay in touch</p>
    <table style="width: 100%;">
      <tr><td align="center">
        <a href="https://elyphant.ai/gifting" style="display: inline-block; padding: 14px 40px; background: #1a1a1a; color: #ffffff; text-decoration: none; border-radius: 6px; font-family: ${fontStack}; font-size: 14px; font-weight: 500; letter-spacing: 0.02em;">
          Explore Gifting
        </a>
      </td></tr>
    </table>
  `;
  return baseEmailTemplate({ content, preheader: `You're now connected with ${props.connection_name}` });
};

// ZMA Low Balance Alert Template
const zmaLowBalanceAlertTemplate = (props: any): string => {
  const content = `
    <h2 style="margin: 0 0 8px 0; font-family: ${fontStack}; font-size: 28px; font-weight: 300; color: #1a1a1a; letter-spacing: -0.02em;">${props.is_critical ? 'Critical:' : ''} ZMA balance alert.</h2>
    <p style="margin: 0 0 32px 0; font-family: ${fontStack}; font-size: 16px; color: #6b7280; line-height: 1.6;">Your Zinc Managed Account balance requires attention.</p>
    
    <div style="border: 1px solid #e5e7eb; border-radius: 8px; padding: 24px; margin-bottom: 24px;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td style="padding: 8px 0; font-family: ${fontStack}; font-size: 13px; text-transform: uppercase; letter-spacing: 0.08em; color: #9ca3af;">Current balance</td>
          <td align="right" style="padding: 8px 0; font-family: ${fontStack}; font-size: 24px; font-weight: 700; color: ${props.is_critical ? '#b91c1c' : '#1a1a1a'};">${formatPrice(props.current_balance)}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; border-top: 1px solid #f3f4f6; font-family: ${fontStack}; font-size: 13px; text-transform: uppercase; letter-spacing: 0.08em; color: #9ca3af;">Alert threshold</td>
          <td align="right" style="padding: 8px 0; border-top: 1px solid #f3f4f6; font-family: ${fontStack}; font-size: 15px; font-weight: 600; color: #1a1a1a;">${formatPrice(props.threshold)}</td>
        </tr>
        ${props.pending_orders_value ? `
        <tr>
          <td style="padding: 8px 0; border-top: 1px solid #f3f4f6; font-family: ${fontStack}; font-size: 13px; text-transform: uppercase; letter-spacing: 0.08em; color: #9ca3af;">Pending orders value</td>
          <td align="right" style="padding: 8px 0; border-top: 1px solid #f3f4f6; font-family: ${fontStack}; font-size: 15px; font-weight: 600; color: #1a1a1a;">${formatPrice(props.pending_orders_value)}</td>
        </tr>
        ` : ''}
        ${props.orders_waiting > 0 ? `
        <tr>
          <td style="padding: 8px 0; border-top: 1px solid #f3f4f6; font-family: ${fontStack}; font-size: 13px; text-transform: uppercase; letter-spacing: 0.08em; color: #9ca3af;">Orders on hold</td>
          <td align="right" style="padding: 8px 0; border-top: 1px solid #f3f4f6; font-family: ${fontStack}; font-size: 15px; font-weight: 600; color: #b91c1c;">${props.orders_waiting} orders</td>
        </tr>
        ` : ''}
        ${props.recommended_transfer > 0 ? `
        <tr>
          <td style="padding: 8px 0; border-top: 1px solid #f3f4f6; font-family: ${fontStack}; font-size: 13px; text-transform: uppercase; letter-spacing: 0.08em; color: #9ca3af;">Recommended transfer</td>
          <td align="right" style="padding: 8px 0; border-top: 1px solid #f3f4f6; font-family: ${fontStack}; font-size: 18px; font-weight: 700; color: #047857;">${formatPrice(props.recommended_transfer)}</td>
        </tr>
        ` : ''}
      </table>
    </div>
    
    <p style="margin: 0 0 16px 0; font-family: ${fontStack}; font-size: 13px; text-transform: uppercase; letter-spacing: 0.08em; color: #9ca3af; font-weight: 500;">Action required</p>
    <ol style="margin: 0 0 32px 0; padding-left: 20px; font-family: ${fontStack}; color: #4b5563; font-size: 14px; line-height: 1.8;">
      <li>Log into your Chase bank account</li>
      <li>Transfer funds to Zinc via PayPal</li>
      <li>Record the transfer in the Trunkline dashboard</li>
      <li>Click "Retry Awaiting Orders" to process held orders</li>
    </ol>
    
    <table style="width: 100%;">
      <tr><td align="center">
        <a href="https://elyphant.ai/trunkline/funding" style="display: inline-block; padding: 14px 40px; background: #1a1a1a; color: #ffffff; text-decoration: none; border-radius: 6px; font-family: ${fontStack}; font-size: 14px; font-weight: 500; letter-spacing: 0.02em;">
          View Funding Dashboard
        </a>
      </td></tr>
    </table>
  `;
  
  const preheader = props.is_critical 
    ? `CRITICAL: ZMA balance is ${formatPrice(props.current_balance)} — orders may be blocked`
    : `ZMA balance is ${formatPrice(props.current_balance)} — transfer recommended`;
    
  return baseEmailTemplate({ content, preheader });
};

// Wishlist Shared Template
const wishlistSharedTemplate = (props: any): string => {
  const content = `
    <h2 style="margin: 0 0 8px 0; font-family: ${fontStack}; font-size: 28px; font-weight: 300; color: #1a1a1a; letter-spacing: -0.02em;">
      ${props.sender_name} shared a wishlist with you.
    </h2>
    <p style="margin: 0 0 32px 0; font-family: ${fontStack}; font-size: 16px; color: #6b7280; line-height: 1.6;">
      Hi ${props.recipient_name}, check out what ${props.sender_name} wants you to see.
    </p>
    
    <div style="border: 1px solid #e5e7eb; border-radius: 8px; padding: 24px; margin-bottom: 24px;">
      <p style="margin: 0 0 8px 0; font-family: ${fontStack}; font-size: 18px; font-weight: 600; color: #1a1a1a;">
        ${props.wishlist_title}
      </p>
      <p style="margin: 0; font-family: ${fontStack}; font-size: 14px; color: #6b7280;">
        ${props.item_count} items &middot; ${formatPrice(props.total_value)}
      </p>
    </div>
    
    ${props.message ? `
    <div style="border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
      <p style="margin: 0; font-family: ${fontStack}; font-size: 14px; color: #4b5563; font-style: italic; line-height: 1.6;">
        "${props.message}"
      </p>
    </div>
    ` : ''}
    
    <table style="width: 100%;">
      <tr><td align="center">
        <a href="${props.wishlist_url}" style="display: inline-block; padding: 14px 40px; background: #1a1a1a; color: #ffffff; text-decoration: none; border-radius: 6px; font-family: ${fontStack}; font-size: 14px; font-weight: 500; letter-spacing: 0.02em;">
          View Wishlist
        </a>
      </td></tr>
    </table>
  `;
  return baseEmailTemplate({ content, preheader: `${props.sender_name} shared a wishlist with you` });
};

// Recurring Gift Rule Created Template
const recurringGiftRuleCreatedTemplate = (props: any): string => {
  const firstName = getFirstName(props.shopper_name);
  const recipientName = props.recipient_name || 'your friend';
  
  const eventsHtml = (props.events || []).map((event: any) => {
    const occasionName = event.occasion_name || formatOccasion(event.date_type) || 'Special Occasion';
    return `<li style="margin: 8px 0; font-family: ${fontStack}; color: #4b5563;"><strong>${occasionName}</strong>${event.date ? ` — ${event.date}` : ''}</li>`;
  }).join('');

  const content = `
    <h2 style="margin: 0 0 8px 0; font-family: ${fontStack}; font-size: 28px; font-weight: 300; color: #1a1a1a; letter-spacing: -0.02em;">
      Recurring gifts set up.
    </h2>
    <p style="margin: 0 0 32px 0; font-family: ${fontStack}; font-size: 16px; color: #6b7280; line-height: 1.6;">
      Hi ${firstName}, you've successfully set up recurring gifts for <strong>${recipientName}</strong>.
    </p>
    
    <div style="border: 1px solid #e5e7eb; border-radius: 8px; padding: 24px; margin-bottom: 24px;">
      <p style="margin: 0 0 12px 0; font-family: ${fontStack}; font-size: 13px; text-transform: uppercase; letter-spacing: 0.08em; color: #9ca3af; font-weight: 500;">Configured events</p>
      <ul style="margin: 0; padding-left: 20px; font-size: 15px;">
        ${eventsHtml || `<li style="font-family: ${fontStack}; color: #4b5563;"><strong>${formatOccasion(props.occasion || props.rule_details?.occasion || '')}</strong>${props.scheduled_date ? ` — ${props.scheduled_date}` : ''}</li>`}
      </ul>
    </div>
    
    <div style="border: 1px solid #e5e7eb; border-radius: 8px; padding: 24px; margin-bottom: 24px;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td style="padding: 8px 0; font-family: ${fontStack}; font-size: 13px; text-transform: uppercase; letter-spacing: 0.08em; color: #9ca3af;">Budget per gift</td>
          <td align="right" style="padding: 8px 0; font-family: ${fontStack}; font-size: 18px; color: #1a1a1a; font-weight: 700;">Up to ${formatPrice(props.budget || props.budget_limit || props.rule_details?.budget_limit || 50)}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; border-top: 1px solid #f3f4f6; font-family: ${fontStack}; font-size: 13px; text-transform: uppercase; letter-spacing: 0.08em; color: #9ca3af;">Auto-approve</td>
          <td align="right" style="padding: 8px 0; border-top: 1px solid #f3f4f6; font-family: ${fontStack}; font-size: 15px; color: #1a1a1a;">${(props.auto_approve || props.auto_approve_enabled) ? 'Enabled — gifts sent automatically' : 'Disabled — you approve each gift'}</td>
        </tr>
      </table>
    </div>
    
    <div style="border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
      <p style="margin: 0 0 8px 0; font-family: ${fontStack}; font-weight: 600; color: #1a1a1a; font-size: 14px;">How it works</p>
      <p style="margin: 0; font-family: ${fontStack}; color: #6b7280; font-size: 14px; line-height: 1.6;">We'll notify you 7 days before each event with gift suggestions from ${possessive(recipientName)} wishlist. ${(props.auto_approve || props.auto_approve_enabled) ? 'Gifts will be purchased and shipped automatically.' : "You'll review and approve before we purchase."}</p>
    </div>
    
    <table style="width: 100%;">
      <tr><td align="center">
        <a href="https://elyphant.ai/recurring-gifts" style="display: inline-block; padding: 14px 40px; background: #1a1a1a; color: #ffffff; text-decoration: none; border-radius: 6px; font-family: ${fontStack}; font-size: 14px; font-weight: 500; letter-spacing: 0.02em;">
          Manage Recurring Gifts
        </a>
      </td></tr>
    </table>
  `;
  return baseEmailTemplate({ content, preheader: `Recurring gifts for ${recipientName} are all set` });
};

// Gift Coming Your Way Template
const giftComingYourWayTemplate = (props: any): string => {
  const firstName = getFirstName(props.recipient_name);
  
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
    <h2 style="margin: 0 0 8px 0; font-family: ${fontStack}; font-size: 28px; font-weight: 300; color: #1a1a1a; letter-spacing: -0.02em;">
      A gift is on its way.
    </h2>
    <p style="margin: 0 0 32px 0; font-family: ${fontStack}; font-size: 16px; color: #6b7280; line-height: 1.6;">
      Hey ${firstName}, exciting news — <strong>${props.sender_name || 'Someone special'}</strong> just sent you a gift${occasionText}.
    </p>
    
    ${props.arrival_date ? `
    <div style="border: 1px solid #e5e7eb; border-radius: 8px; padding: 24px; margin-bottom: 24px;">
      <p style="margin: 0 0 8px 0; font-family: ${fontStack}; font-size: 13px; text-transform: uppercase; letter-spacing: 0.08em; color: #9ca3af; font-weight: 500;">Expected arrival</p>
      <p style="margin: 0; font-family: ${fontStack}; font-size: 18px; color: #1a1a1a; font-weight: 600;">${formatScheduledDate(props.arrival_date)}</p>
    </div>
    ` : ''}
    
    <div style="border: 1px solid #e5e7eb; border-radius: 8px; padding: 24px; margin-bottom: 24px; text-align: center;">
      <p style="margin: 0; font-family: ${fontStack}; font-size: 15px; color: #6b7280; font-style: italic;">
        We're keeping the details a surprise.
      </p>
    </div>
    
    <p style="margin: 0 0 32px 0; font-family: ${fontStack}; font-size: 14px; color: #6b7280; text-align: center; line-height: 1.6;">
      Want to make sure ${props.sender_name?.split(' ')[0] || 'they'} knows exactly what you'd love? Keep your wishlist updated.
    </p>
    
    <table style="width: 100%;">
      <tr><td align="center">
        <a href="https://elyphant.ai/dashboard" style="display: inline-block; padding: 14px 40px; background: #1a1a1a; color: #ffffff; text-decoration: none; border-radius: 6px; font-family: ${fontStack}; font-size: 14px; font-weight: 500; letter-spacing: 0.02em;">
          View Your Dashboard
        </a>
      </td></tr>
    </table>
  `;
  return baseEmailTemplate({ content, preheader: `${props.sender_name || 'Someone special'} sent you a gift` });
};

// Auto-Gift Payment Failed Template
const autoGiftPaymentFailedTemplate = (props: any): string => {
  const firstName = getFirstName(props.customer_name || props.recipient_name);
  const occasion = props.occasion?.replace(/_/g, ' ') || 'upcoming event';
  
  const content = `
    <h2 style="margin: 0 0 8px 0; font-family: ${fontStack}; font-size: 28px; font-weight: 300; color: #1a1a1a; letter-spacing: -0.02em;">
      Payment issue.
    </h2>
    <p style="margin: 0 0 32px 0; font-family: ${fontStack}; font-size: 16px; color: #6b7280; line-height: 1.6;">
      Hi ${firstName}, we tried to process payment for <strong>${possessive(props.recipient_name || 'your recipient')}</strong> ${occasion} gift, but your saved card was declined.
    </p>
    
    <div style="border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
      <p style="margin: 0 0 8px 0; font-family: ${fontStack}; font-weight: 600; color: #b91c1c; font-size: 14px;">Payment declined</p>
      <p style="margin: 0; font-family: ${fontStack}; color: #6b7280; font-size: 14px; line-height: 1.6;">${props.error_summary || 'Your card could not be charged. Please update your payment method.'}</p>
    </div>
    
    <div style="border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
      <p style="margin: 0 0 8px 0; font-family: ${fontStack}; font-weight: 600; color: #1a1a1a; font-size: 14px;">What to do</p>
      <p style="margin: 0; font-family: ${fontStack}; color: #6b7280; font-size: 14px; line-height: 1.6;">Update your payment method and we'll retry. If no action is taken, you'll be redirected to a checkout page to complete the purchase manually.</p>
    </div>
    
    <table style="width: 100%;">
      <tr><td align="center">
        <a href="https://elyphant.ai/recurring-gifts" style="display: inline-block; padding: 14px 40px; background: #1a1a1a; color: #ffffff; text-decoration: none; border-radius: 6px; font-family: ${fontStack}; font-size: 14px; font-weight: 500; letter-spacing: 0.02em;">
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
    <h2 style="margin: 0 0 8px 0; font-family: ${fontStack}; font-size: 28px; font-weight: 300; color: #1a1a1a; letter-spacing: -0.02em;">
      Your order is confirmed.
    </h2>
    <p style="margin: 0 0 32px 0; font-family: ${fontStack}; font-size: 16px; color: #6b7280; line-height: 1.6;">
      Hi ${firstName}, thank you for your order. We're preparing your items for shipment.
    </p>
    ${props.scheduled_delivery_date ? `
    <div style="border: 1px solid #e5e7eb; border-radius: 8px; padding: 24px; margin-bottom: 24px;">
      <p style="margin: 0 0 8px 0; font-family: ${fontStack}; font-size: 13px; text-transform: uppercase; letter-spacing: 0.08em; color: #9ca3af; font-weight: 500;">Scheduled delivery</p>
      <p style="margin: 0 0 12px 0; font-family: ${fontStack}; font-size: 18px; color: #1a1a1a; font-weight: 600;">${formatScheduledDate(props.scheduled_delivery_date)}</p>
      <p style="margin: 0; font-family: ${fontStack}; font-size: 14px; color: #6b7280; line-height: 1.6;">Your payment will be processed and your order will ship on the scheduled delivery date.</p>
    </div>
    ` : ''}
    <div style="border: 1px solid #e5e7eb; border-radius: 8px; padding: 24px; margin-bottom: 24px;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td style="padding: 8px 0; font-family: ${fontStack}; font-size: 13px; text-transform: uppercase; letter-spacing: 0.08em; color: #9ca3af;">Order number</td>
          <td align="right" style="padding: 8px 0; font-family: ${fontStack}; font-size: 15px; font-weight: 600; color: #1a1a1a;">${props.order_number}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; border-top: 1px solid #f3f4f6; font-family: ${fontStack}; font-size: 13px; text-transform: uppercase; letter-spacing: 0.08em; color: #9ca3af;">Total</td>
          <td align="right" style="padding: 8px 0; border-top: 1px solid #f3f4f6; font-family: ${fontStack}; font-size: 18px; font-weight: 700; color: #1a1a1a;">${formatPrice(props.total_amount)}</td>
        </tr>
      </table>
    </div>
    ${props.items ? `
    <p style="margin: 0 0 16px 0; font-family: ${fontStack}; font-size: 13px; text-transform: uppercase; letter-spacing: 0.08em; color: #9ca3af; font-weight: 500;">Order items</p>
    ${renderItemsHtml(props.items)}
    ${renderPricingBreakdown(props)}
    ` : ''}
    ${props.shipping_address ? (props.is_gift ? renderGiftShippingAddress(props.shipping_address) : renderShippingAddress(props.shipping_address)) : ''}
    ${props.is_gift && props.gift_message ? `
    <div style="border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 24px 0;">
      <p style="margin: 0 0 8px 0; font-family: ${fontStack}; font-size: 13px; text-transform: uppercase; letter-spacing: 0.08em; color: #9ca3af; font-weight: 500;">Gift message</p>
      <p style="margin: 0; font-family: ${fontStack}; color: #4b5563; font-style: italic; font-size: 15px; line-height: 1.6;">"${props.gift_message}"</p>
    </div>
    ` : ''}

    <!-- Signup CTA -->
    <div style="border: 1px solid #e5e7eb; border-radius: 8px; padding: 32px 24px; margin: 32px 0; text-align: center;">
      <h3 style="margin: 0 0 8px 0; font-family: ${fontStack}; font-size: 18px; font-weight: 600; color: #1a1a1a;">
        Create your free account.
      </h3>
      <p style="margin: 0 0 20px 0; font-family: ${fontStack}; font-size: 14px; color: #6b7280; line-height: 1.6;">
        Track your order, save wishlists, set up auto-gifts, and get AI-powered gift recommendations.
      </p>
      <table border="0" cellpadding="0" cellspacing="0" style="margin: 0 auto;">
        <tr><td>
          <a href="https://elyphant.ai/auth/signup?email=${encodeURIComponent(props.guest_email || '')}" style="display: inline-block; padding: 14px 40px; background: #1a1a1a; color: #ffffff; text-decoration: none; border-radius: 6px; font-family: ${fontStack}; font-size: 14px; font-weight: 500; letter-spacing: 0.02em;">
            Create Free Account
          </a>
        </td></tr>
      </table>
    </div>

    <table style="width: 100%;">
      <tr><td align="center">
        <a href="https://elyphant.ai/order-confirmation?session_id=${props.checkout_session_id || ''}" style="display: inline-block; padding: 14px 40px; background: #ffffff; color: #1a1a1a; text-decoration: none; border-radius: 6px; font-family: ${fontStack}; font-size: 14px; font-weight: 500; letter-spacing: 0.02em; border: 1px solid #1a1a1a;">
          View Order Details
        </a>
      </td></tr>
    </table>
  `;
  return baseEmailTemplate({ content, preheader: `Order ${props.order_number} confirmed — create a free account to track it` });
};

// Vendor New Order Template
const vendorNewOrderTemplate = (props: any): string => {
  const content = `
    <h1 style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 24px; font-weight: 700; color: #1a1a1a; margin: 0 0 8px 0;">
      New Order Received
    </h1>
    <p style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 16px; color: #666666; margin: 0 0 24px 0;">
      Hi ${props.vendor_name || 'Vendor'}, you have a new order to fulfill.
    </p>

    <!-- Order Summary Card -->
    <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 12px; padding: 24px; margin: 0 0 24px 0;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td style="padding: 8px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 14px; color: #6b7280;">Order ID</td>
          <td align="right" style="padding: 8px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 14px; font-weight: 600; color: #1a1a1a; font-variant-numeric: tabular-nums;">${(props.order_id || '').substring(0, 8)}...</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 14px; color: #6b7280;">Items</td>
          <td align="right" style="padding: 8px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 14px; font-weight: 600; color: #1a1a1a;">${props.item_count || 0} item(s)</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 14px; color: #6b7280;">Order Total</td>
          <td align="right" style="padding: 8px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 14px; font-weight: 600; color: #1a1a1a;">${formatPrice(props.total_amount)}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; border-top: 1px solid #e5e7eb; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 14px; color: #6b7280;">Your Payout (85%)</td>
          <td align="right" style="padding: 8px 0; border-top: 1px solid #e5e7eb; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 16px; font-weight: 700; color: #047857;">${formatPrice(props.vendor_payout)}</td>
        </tr>
      </table>
    </div>

    <!-- CTA -->
    <table border="0" cellpadding="0" cellspacing="0" width="100%">
      <tr><td align="center">
        <a href="https://elyphant.ai/vendor/orders" style="display: inline-block; padding: 14px 32px; background: #1a1a1a; color: #ffffff; text-decoration: none; border-radius: 8px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 15px; font-weight: 600;">
          View &amp; Fulfill Order
        </a>
      </td></tr>
    </table>

    <p style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 13px; color: #9ca3af; margin: 24px 0 0 0; text-align: center;">
      Please fulfill this order within 3 business days. Update the status and add tracking in your vendor portal.
    </p>
  `;
  return baseEmailTemplate({ content, preheader: `New order received — ${props.item_count || ''} item(s) | ${formatPrice(props.total_amount)}` });
};
// Vendor Application Approved Template (Lululemon-inspired editorial)
const vendorApplicationApprovedTemplate = (props: any): string => {
  const companyName = props.company_name || 'Your Company';
  const approvedDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const content = `
    <div style="padding: 48px 0 24px 0; text-align: center;">
      <h1 style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 32px; font-weight: 300; letter-spacing: -0.02em; color: #1a1a1a; margin: 0 0 12px 0; line-height: 1.2;">
        Welcome to Elyphant,
      </h1>
      <h1 style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 32px; font-weight: 600; letter-spacing: -0.02em; color: #1a1a1a; margin: 0 0 24px 0; line-height: 1.2;">
        ${companyName}.
      </h1>
      <p style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 16px; color: #6b7280; margin: 0 0 40px 0; line-height: 1.6; max-width: 420px; margin-left: auto; margin-right: auto;">
        Congratulations — your application to the Elyphant Vendor Program has been approved. You now have full access to your Vendor Portal.
      </p>
    </div>

    <!-- Status Card -->
    <div style="border: 1px solid #e5e7eb; border-radius: 8px; padding: 28px 24px; margin: 0 0 32px 0;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td style="padding: 10px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 13px; text-transform: uppercase; letter-spacing: 0.08em; color: #9ca3af;">Company</td>
          <td align="right" style="padding: 10px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 15px; font-weight: 600; color: #1a1a1a;">${companyName}</td>
        </tr>
        <tr>
          <td style="padding: 10px 0; border-top: 1px solid #f3f4f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 13px; text-transform: uppercase; letter-spacing: 0.08em; color: #9ca3af;">Status</td>
          <td align="right" style="padding: 10px 0; border-top: 1px solid #f3f4f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 15px; font-weight: 600; color: #047857;">Approved ✓</td>
        </tr>
        <tr>
          <td style="padding: 10px 0; border-top: 1px solid #f3f4f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 13px; text-transform: uppercase; letter-spacing: 0.08em; color: #9ca3af;">Approved On</td>
          <td align="right" style="padding: 10px 0; border-top: 1px solid #f3f4f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 15px; font-weight: 600; color: #1a1a1a;">${approvedDate}</td>
        </tr>
      </table>
    </div>

    <!-- What's Next -->
    <div style="padding: 0 0 32px 0; text-align: center;">
      <p style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 13px; text-transform: uppercase; letter-spacing: 0.1em; color: #9ca3af; margin: 0 0 16px 0; font-weight: 500;">What's next</p>
      <p style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 15px; color: #4b5563; margin: 0; line-height: 1.7;">
        Connect your Shopify store or add products manually. Once your catalog is live, customers can discover and purchase your products through Elyphant.
      </p>
    </div>

    <!-- CTA -->
    <table border="0" cellpadding="0" cellspacing="0" width="100%">
      <tr><td align="center" style="padding: 0 0 40px 0;">
        <a href="https://elyphant.ai/vendor-portal" style="display: inline-block; padding: 14px 40px; background: #1a1a1a; color: #ffffff; text-decoration: none; border-radius: 6px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 14px; font-weight: 500; letter-spacing: 0.02em;">
          Open Your Vendor Portal
        </a>
      </td></tr>
    </table>

    <p style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 13px; color: #9ca3af; margin: 0; text-align: center; line-height: 1.6;">
      Questions? Simply reply to this email — we're here to help.
    </p>
  `;
  return baseEmailTemplate({ content, preheader: `You're approved — welcome to the Elyphant Vendor Program` });
};

// Vendor Application Rejected Template (Lululemon-inspired editorial)
const vendorApplicationRejectedTemplate = (props: any): string => {
  const companyName = props.company_name || 'Your Company';
  const content = `
    <div style="padding: 48px 0 24px 0; text-align: center;">
      <h1 style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 32px; font-weight: 300; letter-spacing: -0.02em; color: #1a1a1a; margin: 0 0 12px 0; line-height: 1.2;">
        An update on your application,
      </h1>
      <h1 style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 32px; font-weight: 600; letter-spacing: -0.02em; color: #1a1a1a; margin: 0 0 24px 0; line-height: 1.2;">
        ${companyName}.
      </h1>
      <p style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 16px; color: #6b7280; margin: 0 0 40px 0; line-height: 1.6; max-width: 420px; margin-left: auto; margin-right: auto;">
        After careful review, we're unable to move forward with your application to the Elyphant Vendor Program at this time.
      </p>
    </div>

    <!-- Status Card -->
    <div style="border: 1px solid #e5e7eb; border-radius: 8px; padding: 28px 24px; margin: 0 0 32px 0;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td style="padding: 10px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 13px; text-transform: uppercase; letter-spacing: 0.08em; color: #9ca3af;">Company</td>
          <td align="right" style="padding: 10px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 15px; font-weight: 600; color: #1a1a1a;">${companyName}</td>
        </tr>
        <tr>
          <td style="padding: 10px 0; border-top: 1px solid #f3f4f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 13px; text-transform: uppercase; letter-spacing: 0.08em; color: #9ca3af;">Status</td>
          <td align="right" style="padding: 10px 0; border-top: 1px solid #f3f4f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 15px; font-weight: 600; color: #b91c1c;">Not Approved</td>
        </tr>
      </table>
    </div>

    <!-- Encouragement -->
    <div style="padding: 0 0 32px 0; text-align: center;">
      <p style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 13px; text-transform: uppercase; letter-spacing: 0.1em; color: #9ca3af; margin: 0 0 16px 0; font-weight: 500;">This doesn't have to be the end</p>
      <p style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 15px; color: #4b5563; margin: 0; line-height: 1.7;">
        We encourage you to reapply in the future. If you have questions about what we look for, or how to strengthen your application, feel free to reach out — we're happy to help.
      </p>
    </div>

    <!-- CTA -->
    <table border="0" cellpadding="0" cellspacing="0" width="100%">
      <tr><td align="center" style="padding: 0 0 40px 0;">
        <a href="https://elyphant.ai" style="display: inline-block; padding: 14px 40px; background: #1a1a1a; color: #ffffff; text-decoration: none; border-radius: 6px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 14px; font-weight: 500; letter-spacing: 0.02em;">
          Visit Elyphant
        </a>
      </td></tr>
    </table>

    <p style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 13px; color: #9ca3af; margin: 0; text-align: center; line-height: 1.6;">
      Questions? Simply reply to this email — we're here to help.
    </p>
  `;
  return baseEmailTemplate({ content, preheader: `Update on your Elyphant Vendor Program application` });
};

// Vendor Application Received Template (Lululemon-inspired editorial)
const vendorApplicationReceivedTemplate = (props: any): string => {
  const companyName = props.company_name || 'Your Company';
  const content = `
    <div style="padding: 48px 0 24px 0; text-align: center;">
      <h1 style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 32px; font-weight: 300; letter-spacing: -0.02em; color: #1a1a1a; margin: 0 0 12px 0; line-height: 1.2;">
        Thank you for applying,
      </h1>
      <h1 style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 32px; font-weight: 600; letter-spacing: -0.02em; color: #1a1a1a; margin: 0 0 24px 0; line-height: 1.2;">
        ${companyName}.
      </h1>
      <p style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 16px; color: #6b7280; margin: 0 0 40px 0; line-height: 1.6; max-width: 420px; margin-left: auto; margin-right: auto;">
        We've received your application to join the Elyphant Vendor Program. Our team will review your submission and get back to you shortly.
      </p>
    </div>

    <!-- Application Summary Card -->
    <div style="border: 1px solid #e5e7eb; border-radius: 8px; padding: 28px 24px; margin: 0 0 32px 0;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td style="padding: 10px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 13px; text-transform: uppercase; letter-spacing: 0.08em; color: #9ca3af;">Company</td>
          <td align="right" style="padding: 10px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 15px; font-weight: 600; color: #1a1a1a;">${companyName}</td>
        </tr>
        ${props.website ? `<tr>
          <td style="padding: 10px 0; border-top: 1px solid #f3f4f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 13px; text-transform: uppercase; letter-spacing: 0.08em; color: #9ca3af;">Website</td>
          <td align="right" style="padding: 10px 0; border-top: 1px solid #f3f4f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 15px; color: #1a1a1a;">${props.website}</td>
        </tr>` : ''}
        ${props.description ? `<tr>
          <td colspan="2" style="padding: 10px 0; border-top: 1px solid #f3f4f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 13px; text-transform: uppercase; letter-spacing: 0.08em; color: #9ca3af;">About</td>
        </tr>
        <tr>
          <td colspan="2" style="padding: 0 0 10px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 14px; color: #4b5563; line-height: 1.6;">${props.description}</td>
        </tr>` : ''}
        <tr>
          <td style="padding: 10px 0; border-top: 1px solid #f3f4f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 13px; text-transform: uppercase; letter-spacing: 0.08em; color: #9ca3af;">Status</td>
          <td align="right" style="padding: 10px 0; border-top: 1px solid #f3f4f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 15px; font-weight: 600; color: #d97706;">Under Review</td>
        </tr>
        <tr>
          <td style="padding: 10px 0; border-top: 1px solid #f3f4f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 13px; text-transform: uppercase; letter-spacing: 0.08em; color: #9ca3af;">Expected Response</td>
          <td align="right" style="padding: 10px 0; border-top: 1px solid #f3f4f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 15px; font-weight: 600; color: #1a1a1a;">Within 72 hours</td>
        </tr>
      </table>
    </div>

    <!-- What Happens Next -->
    <div style="padding: 0 0 32px 0; text-align: center;">
      <p style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 13px; text-transform: uppercase; letter-spacing: 0.1em; color: #9ca3af; margin: 0 0 16px 0; font-weight: 500;">What happens next</p>
      <p style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 15px; color: #4b5563; margin: 0; line-height: 1.7;">
        Once approved, you'll receive an email with access to your Vendor Portal — where you can list products, manage orders, and track payouts.
      </p>
    </div>

    <!-- CTA -->
    <table border="0" cellpadding="0" cellspacing="0" width="100%">
      <tr><td align="center" style="padding: 0 0 40px 0;">
        <a href="https://elyphant.ai" style="display: inline-block; padding: 14px 40px; background: #1a1a1a; color: #ffffff; text-decoration: none; border-radius: 6px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 14px; font-weight: 500; letter-spacing: 0.02em;">
          Visit Elyphant
        </a>
      </td></tr>
    </table>

    <p style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 13px; color: #9ca3af; margin: 0; text-align: center; line-height: 1.6;">
      Questions? Simply reply to this email — we're here to help.
    </p>
  `;
  return baseEmailTemplate({ content, preheader: `Application received — we'll review ${companyName} within 72 hours` });
};

// Connection Request Template (for existing platform users)
const connectionRequestTemplate = (data: any): string => {
  const senderName = data.sender_name || 'Someone';
  const recipientFirstName = getFirstName(data.recipient_name);
  const content = `
    <h1 style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 24px; font-weight: 600; color: #1a1a1a; margin: 0 0 8px 0; letter-spacing: -0.02em;">
      New Connection Request
    </h1>
    <p style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 16px; color: #6b7280; margin: 0 0 32px 0; line-height: 1.5;">
      Hi ${recipientFirstName}, <strong>${senderName}</strong> wants to connect with you on Elyphant!
    </p>
    <p style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 15px; color: #374151; margin: 0 0 32px 0; line-height: 1.6;">
      Once connected, you can share wishlists, exchange gift ideas, and make gifting effortless for each other.
    </p>
    <table border="0" cellpadding="0" cellspacing="0" width="100%">
      <tr><td align="center" style="padding: 0 0 40px 0;">
        <a href="https://elyphant.ai/connections" style="display: inline-block; padding: 14px 40px; background: #1a1a1a; color: #ffffff; text-decoration: none; border-radius: 6px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 14px; font-weight: 500; letter-spacing: 0.02em;">
          View Request
        </a>
      </td></tr>
    </table>
    <p style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 13px; color: #9ca3af; margin: 0; text-align: center; line-height: 1.6;">
      You can accept or decline this request from your Connections page.
    </p>
  `;
  return baseEmailTemplate({ content, preheader: `${senderName} wants to connect with you on Elyphant` });
};

// Nudge Reminder Template
const nudgeReminderTemplate = (data: any): string => {
  const senderName = data.sender_name || 'Someone';
  const recipientFirstName = getFirstName(data.recipient_name);
  const content = `
    <h1 style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 24px; font-weight: 600; color: #1a1a1a; margin: 0 0 8px 0; letter-spacing: -0.02em;">
      Friendly Reminder
    </h1>
    <p style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 16px; color: #6b7280; margin: 0 0 32px 0; line-height: 1.5;">
      Hi ${recipientFirstName}, <strong>${senderName}</strong> is still waiting to connect with you on Elyphant!
    </p>
    <p style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 15px; color: #374151; margin: 0 0 32px 0; line-height: 1.6;">
      Don't miss out — connecting makes it easy to share wishlists and send thoughtful gifts to each other.
    </p>
    <table border="0" cellpadding="0" cellspacing="0" width="100%">
      <tr><td align="center" style="padding: 0 0 40px 0;">
        <a href="https://elyphant.ai/connections" style="display: inline-block; padding: 14px 40px; background: #1a1a1a; color: #ffffff; text-decoration: none; border-radius: 6px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 14px; font-weight: 500; letter-spacing: 0.02em;">
          View Pending Request
        </a>
      </td></tr>
    </table>
    <p style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 13px; color: #9ca3af; margin: 0; text-align: center; line-height: 1.6;">
      You can accept or decline this request from your Connections page.
    </p>
  `;
  return baseEmailTemplate({ content, preheader: `${senderName} is waiting to connect with you` });
};

// Beta Approval Needed Template — Internal alert to justin@elyphant.com
const betaApprovalNeededTemplate = (props: any): string => {
  const content = `
    <p style="margin: 0 0 8px 0; font-family: ${fontStack}; font-size: 13px; text-transform: uppercase; letter-spacing: 0.08em; color: #9ca3af; font-weight: 500;">Internal — Beta Program</p>
    <h2 style="margin: 0 0 8px 0; font-family: ${fontStack}; font-size: 28px; font-weight: 300; color: #1a1a1a; letter-spacing: -0.02em;">
      New beta tester pending approval.
    </h2>
    <p style="margin: 0 0 32px 0; font-family: ${fontStack}; font-size: 16px; color: #6b7280; line-height: 1.6;">
      A new referral has come in and needs your review before a $${props.credit_amount || 100} credit is issued.
    </p>
    <div style="border: 1px solid #e5e7eb; border-radius: 8px; padding: 24px; margin-bottom: 24px;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td style="padding: 8px 0; font-family: ${fontStack}; font-size: 13px; text-transform: uppercase; letter-spacing: 0.08em; color: #9ca3af;">Referred by</td>
          <td align="right" style="padding: 8px 0; font-family: ${fontStack}; font-size: 15px; font-weight: 600; color: #1a1a1a;">${props.referrer_name || 'Unknown'}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; border-top: 1px solid #f3f4f6; font-family: ${fontStack}; font-size: 13px; text-transform: uppercase; letter-spacing: 0.08em; color: #9ca3af;">Referrer email</td>
          <td align="right" style="padding: 8px 0; border-top: 1px solid #f3f4f6; font-family: ${fontStack}; font-size: 14px; color: #4b5563;">${props.referrer_email || 'N/A'}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; border-top: 1px solid #f3f4f6; font-family: ${fontStack}; font-size: 13px; text-transform: uppercase; letter-spacing: 0.08em; color: #9ca3af;">Invitee</td>
          <td align="right" style="padding: 8px 0; border-top: 1px solid #f3f4f6; font-family: ${fontStack}; font-size: 15px; font-weight: 600; color: #1a1a1a;">${props.invitee_name || 'Unknown'}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; border-top: 1px solid #f3f4f6; font-family: ${fontStack}; font-size: 13px; text-transform: uppercase; letter-spacing: 0.08em; color: #9ca3af;">Invitee email</td>
          <td align="right" style="padding: 8px 0; border-top: 1px solid #f3f4f6; font-family: ${fontStack}; font-size: 14px; color: #4b5563;">${props.invitee_email || 'N/A'}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; border-top: 1px solid #f3f4f6; font-family: ${fontStack}; font-size: 13px; text-transform: uppercase; letter-spacing: 0.08em; color: #9ca3af;">Credit amount</td>
          <td align="right" style="padding: 8px 0; border-top: 1px solid #f3f4f6; font-family: ${fontStack}; font-size: 18px; font-weight: 700; color: #1a1a1a;">$${props.credit_amount || 100}.00</td>
        </tr>
      </table>
    </div>
    <table style="margin-top: 32px; width: 100%;">
      <tr><td align="center">
        <a href="https://elyphant.ai/trunkline/referrals" style="display: inline-block; padding: 14px 40px; background: #1a1a1a; color: #ffffff; text-decoration: none; border-radius: 6px; font-family: ${fontStack}; font-size: 14px; font-weight: 500; letter-spacing: 0.02em;">
          Review in Trunkline
        </a>
      </td></tr>
    </table>
  `;
  return baseEmailTemplate({ content, preheader: `New beta referral: ${props.invitee_name || props.invitee_email} needs approval` });
};

// Beta Invite Welcome Template — Sent to invitee
const betaInviteWelcomeTemplate = (props: any): string => {
  const firstName = getFirstName(props.recipient_name);
  const content = `
    <h2 style="margin: 0 0 8px 0; font-family: ${fontStack}; font-size: 28px; font-weight: 300; color: #1a1a1a; letter-spacing: -0.02em;">
      You're invited to the Elyphant beta.
    </h2>
    <p style="margin: 0 0 24px 0; font-family: ${fontStack}; font-size: 16px; color: #6b7280; line-height: 1.6;">
      Hi ${firstName}, ${props.sender_name || 'a friend'} has invited you to join the Elyphant beta program — a smarter way to discover and send gifts to the people you care about.
    </p>
    <div style="border: 1px solid #e5e7eb; border-radius: 8px; padding: 24px; margin-bottom: 24px;">
      <p style="margin: 0 0 8px 0; font-family: ${fontStack}; font-size: 13px; text-transform: uppercase; letter-spacing: 0.08em; color: #9ca3af; font-weight: 500;">What you'll receive</p>
      <p style="margin: 0 0 12px 0; font-family: ${fontStack}; font-size: 24px; color: #1a1a1a; font-weight: 700;">$${props.credit_amount || 100} store credit</p>
      <p style="margin: 0; font-family: ${fontStack}; font-size: 14px; color: #6b7280; line-height: 1.6;">
        Once your account is approved, you'll receive $${props.credit_amount || 100} in store credit to shop, test gifting features, and explore the platform — across as many orders as you'd like.
      </p>
    </div>
    <div style="border: 1px solid #e5e7eb; border-radius: 8px; padding: 24px; margin-bottom: 24px;">
      <p style="margin: 0 0 12px 0; font-family: ${fontStack}; font-size: 15px; font-weight: 600; color: #1a1a1a;">How it works</p>
      <table width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td style="padding: 8px 0; font-family: ${fontStack}; font-size: 14px; color: #4b5563; line-height: 1.6;">
            <strong style="color: #1a1a1a;">1.</strong> Sign up using the link below
          </td>
        </tr>
        <tr>
          <td style="padding: 8px 0; border-top: 1px solid #f3f4f6; font-family: ${fontStack}; font-size: 14px; color: #4b5563; line-height: 1.6;">
            <strong style="color: #1a1a1a;">2.</strong> Complete your profile and preferences
          </td>
        </tr>
        <tr>
          <td style="padding: 8px 0; border-top: 1px solid #f3f4f6; font-family: ${fontStack}; font-size: 14px; color: #4b5563; line-height: 1.6;">
            <strong style="color: #1a1a1a;">3.</strong> Once approved, your $${props.credit_amount || 100} credit is ready to use
          </td>
        </tr>
      </table>
    </div>
    ${props.custom_message ? `
    <div style="border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
      <p style="margin: 0 0 8px 0; font-family: ${fontStack}; font-size: 13px; text-transform: uppercase; letter-spacing: 0.08em; color: #9ca3af; font-weight: 500;">Message from ${props.sender_name || 'your friend'}</p>
      <p style="margin: 0; font-family: ${fontStack}; color: #4b5563; font-style: italic; font-size: 15px; line-height: 1.6;">"${props.custom_message}"</p>
    </div>
    ` : ''}
    <table style="margin-top: 32px; width: 100%;">
      <tr><td align="center">
        <a href="${props.invitation_url || 'https://elyphant.ai/auth'}" style="display: inline-block; padding: 14px 40px; background: #1a1a1a; color: #ffffff; text-decoration: none; border-radius: 6px; font-family: ${fontStack}; font-size: 14px; font-weight: 500; letter-spacing: 0.02em;">
          Join the Beta
        </a>
      </td></tr>
    </table>
  `;
  return baseEmailTemplate({ content, preheader: `${props.sender_name || 'A friend'} invited you to the Elyphant beta — $${props.credit_amount || 100} credit awaits` });
};

// Beta Approved Template — Sent to approved tester
const betaApprovedTemplate = (props: any): string => {
  const firstName = getFirstName(props.recipient_name);
  const content = `
    <h2 style="margin: 0 0 8px 0; font-family: ${fontStack}; font-size: 28px; font-weight: 300; color: #1a1a1a; letter-spacing: -0.02em;">
      Welcome to the beta, ${firstName}.
    </h2>
    <p style="margin: 0 0 24px 0; font-family: ${fontStack}; font-size: 16px; color: #6b7280; line-height: 1.6;">
      You've been approved as an Elyphant beta tester. Your store credit is loaded and ready to use.
    </p>
    <div style="border: 1px solid #e5e7eb; border-radius: 8px; padding: 24px; margin-bottom: 24px;">
      <p style="margin: 0 0 8px 0; font-family: ${fontStack}; font-size: 13px; text-transform: uppercase; letter-spacing: 0.08em; color: #9ca3af; font-weight: 500;">Your beta credit</p>
      <p style="margin: 0 0 4px 0; font-family: ${fontStack}; font-size: 36px; color: #1a1a1a; font-weight: 700;">$${props.credit_amount || 100}.00</p>
      <p style="margin: 0; font-family: ${fontStack}; font-size: 14px; color: #6b7280;">Up to $25 per order across multiple purchases</p>
    </div>
    <div style="margin-bottom: 24px;">
      <p style="margin: 0 0 8px 0; font-family: ${fontStack}; font-size: 15px; font-weight: 600; color: #1a1a1a;">Why your testing matters</p>
      <p style="margin: 0; font-family: ${fontStack}; font-size: 14px; color: #4b5563; line-height: 1.6;">
        You're part of a small group of testers shaping Elyphant before our public launch. Every purchase you make, gift you schedule, and piece of feedback you share directly influences the product we ship. This isn't just free shopping — your real-world usage is how we find and fix what matters.
      </p>
    </div>
    <div style="border: 1px solid #e5e7eb; border-radius: 8px; padding: 24px; margin-bottom: 24px;">
      <p style="margin: 0 0 16px 0; font-family: ${fontStack}; font-size: 15px; font-weight: 600; color: #1a1a1a;">Your testing guide</p>
      <table width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td style="padding: 10px 0; font-family: ${fontStack}; font-size: 14px; color: #4b5563; line-height: 1.6;">
            <strong style="color: #1a1a1a;">1. Build your wishlist</strong> — Search for products and add items you'd actually want. This tests our product search and wishlist system.
          </td>
        </tr>
        <tr>
          <td style="padding: 10px 0; border-top: 1px solid #f3f4f6; font-family: ${fontStack}; font-size: 14px; color: #4b5563; line-height: 1.6;">
            <strong style="color: #1a1a1a;">2. Invite a friend or family member</strong> — Share your invite link so you can test gifting to each other. They'll get $100 in credit too.
          </td>
        </tr>
        <tr>
          <td style="padding: 10px 0; border-top: 1px solid #f3f4f6; font-family: ${fontStack}; font-size: 14px; color: #4b5563; line-height: 1.6;">
            <strong style="color: #1a1a1a;">3. Schedule a gift</strong> — Pick something from their wishlist and schedule it for delivery. This tests our core gifting and scheduling engine.
          </td>
        </tr>
        <tr>
          <td style="padding: 10px 0; border-top: 1px solid #f3f4f6; font-family: ${fontStack}; font-size: 14px; color: #4b5563; line-height: 1.6;">
            <strong style="color: #1a1a1a;">4. Buy something for yourself</strong> — Use your credit on a personal purchase to test the standard checkout experience.
          </td>
        </tr>
        <tr>
          <td style="padding: 10px 0; border-top: 1px solid #f3f4f6; font-family: ${fontStack}; font-size: 14px; color: #4b5563; line-height: 1.6;">
            <strong style="color: #1a1a1a;">5. Share your feedback</strong> — We'll email you a short feedback survey starting on Day 2, then weekly after that. Each survey takes about 2 minutes and adapts to what you've actually tried. Your responses directly shape what we build.
          </td>
        </tr>
      </table>
    </div>
    <div style="border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
      <p style="margin: 0 0 8px 0; font-family: ${fontStack}; font-size: 13px; text-transform: uppercase; letter-spacing: 0.08em; color: #9ca3af; font-weight: 500;">How credits work</p>
      <p style="margin: 0; font-family: ${fontStack}; font-size: 14px; color: #4b5563; line-height: 1.6;">
        Your $${props.credit_amount || 100} credit is automatically applied at checkout — up to $25 per order, so you can spread it across at least 4 purchases and test different parts of the platform. No minimum purchase required. Your remaining balance is always visible in your account.
      </p>
    </div>
    <div style="border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
      <p style="margin: 0 0 8px 0; font-family: ${fontStack}; font-size: 13px; text-transform: uppercase; letter-spacing: 0.08em; color: #9ca3af; font-weight: 500;">What to expect</p>
      <table width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td style="padding: 8px 0; font-family: ${fontStack}; font-size: 14px; color: #4b5563; line-height: 1.6;">
            <strong style="color: #1a1a1a;">Day 2</strong> — Your first feedback check-in covering onboarding impressions
          </td>
        </tr>
        <tr>
          <td style="padding: 8px 0; border-top: 1px solid #f3f4f6; font-family: ${fontStack}; font-size: 14px; color: #4b5563; line-height: 1.6;">
            <strong style="color: #1a1a1a;">Weekly after that</strong> — Short surveys that evolve based on what you've actually used
          </td>
        </tr>
        <tr>
          <td style="padding: 8px 0; border-top: 1px solid #f3f4f6; font-family: ${fontStack}; font-size: 14px; color: #4b5563; line-height: 1.6;">
            <strong style="color: #1a1a1a;">Secure links</strong> — Each email includes a direct link, no login required
          </td>
        </tr>
        <tr>
          <td style="padding: 8px 0; border-top: 1px solid #f3f4f6; font-family: ${fontStack}; font-size: 14px; color: #4b5563; line-height: 1.6;">
            <strong style="color: #1a1a1a;">7-day window</strong> — Links expire after a week, so respond when it's fresh
          </td>
        </tr>
      </table>
    </div>
    <table style="margin-top: 32px; width: 100%;">
      <tr><td align="center">
        <a href="https://elyphant.ai/marketplace" style="display: inline-block; padding: 14px 40px; background: #1a1a1a; color: #ffffff; text-decoration: none; border-radius: 6px; font-family: ${fontStack}; font-size: 14px; font-weight: 500; letter-spacing: 0.02em;">
          Start Shopping
        </a>
      </td></tr>
    </table>
  `;
  return baseEmailTemplate({ content, preheader: `Your $${props.credit_amount || 100} beta credit is ready — start shopping on Elyphant` });
};

// Beta Check-In Template — Stage-aware personalized progress email
const betaCheckinTemplate = (props: any): string => {
  const firstName = getFirstName(props.recipient_name);
  const stageIntro = props.stage_intro || 'Here\'s a look at what you\'ve explored so far — and what\'s still waiting for you.';
  
  const stepRow = (label: string, done: boolean): string => `
    <tr>
      <td style="padding: 10px 0; border-top: 1px solid #f3f4f6; font-family: ${fontStack}; font-size: 14px; color: ${done ? '#1a1a1a' : '#9ca3af'}; line-height: 1.6;">
        <span style="display: inline-block; width: 20px; text-align: center; margin-right: 8px;">${done ? '&#10003;' : '&#9675;'}</span>
        ${label}
      </td>
    </tr>
  `;

  const content = `
    <h2 style="margin: 0 0 8px 0; font-family: ${fontStack}; font-size: 28px; font-weight: 300; color: #1a1a1a; letter-spacing: -0.02em;">
      Hey ${firstName}, quick check-in.
    </h2>
    <p style="margin: 0 0 24px 0; font-family: ${fontStack}; font-size: 16px; color: #6b7280; line-height: 1.6;">
      ${stageIntro}
    </p>

    <div style="border: 1px solid #e5e7eb; border-radius: 8px; padding: 24px; margin-bottom: 24px;">
      <p style="margin: 0 0 12px 0; font-family: ${fontStack}; font-size: 13px; text-transform: uppercase; letter-spacing: 0.08em; color: #9ca3af; font-weight: 500;">Your progress</p>
      <table width="100%" cellpadding="0" cellspacing="0" border="0">
        ${stepRow('Signed up and approved', true)}
        ${stepRow('Built a wishlist', props.has_wishlist)}
        ${stepRow('Invited a friend', props.has_invited)}
        ${stepRow('Scheduled a gift', props.has_scheduled_gift)}
        ${stepRow('Made a purchase', props.has_purchased)}
      </table>
    </div>

    ${props.wishlist_count > 0 || props.order_count > 0 ? `
    <div style="border: 1px solid #e5e7eb; border-radius: 8px; padding: 24px; margin-bottom: 24px;">
      <p style="margin: 0 0 12px 0; font-family: ${fontStack}; font-size: 13px; text-transform: uppercase; letter-spacing: 0.08em; color: #9ca3af; font-weight: 500;">Your activity</p>
      <table width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td style="padding: 8px 0; font-family: ${fontStack}; font-size: 14px; color: #4b5563;">Wishlists created</td>
          <td align="right" style="padding: 8px 0; font-family: ${fontStack}; font-size: 15px; font-weight: 600; color: #1a1a1a;">${props.wishlist_count || 0}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; border-top: 1px solid #f3f4f6; font-family: ${fontStack}; font-size: 14px; color: #4b5563;">Orders placed</td>
          <td align="right" style="padding: 8px 0; border-top: 1px solid #f3f4f6; font-family: ${fontStack}; font-size: 15px; font-weight: 600; color: #1a1a1a;">${props.order_count || 0}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; border-top: 1px solid #f3f4f6; font-family: ${fontStack}; font-size: 14px; color: #4b5563;">Features explored</td>
          <td align="right" style="padding: 8px 0; border-top: 1px solid #f3f4f6; font-family: ${fontStack}; font-size: 15px; font-weight: 600; color: #1a1a1a;">${props.features_used || 0}</td>
        </tr>
      </table>
    </div>
    ` : ''}

    ${!props.has_wishlist || !props.has_invited || !props.has_scheduled_gift || !props.has_purchased ? `
    <div style="margin-bottom: 24px;">
      <p style="margin: 0 0 8px 0; font-family: ${fontStack}; font-size: 15px; font-weight: 600; color: #1a1a1a;">What to try next</p>
      <p style="margin: 0; font-family: ${fontStack}; font-size: 14px; color: #4b5563; line-height: 1.6;">
        ${!props.has_wishlist ? 'Start by searching for products and building your first wishlist. ' : ''}
        ${!props.has_invited ? 'Invite a friend or family member so you can test gifting to each other. ' : ''}
        ${!props.has_scheduled_gift ? 'Try scheduling a gift for someone — it tests our core delivery engine. ' : ''}
        ${!props.has_purchased ? 'Use your beta credit to make a purchase and experience the full checkout flow. ' : ''}
      </p>
    </div>
    ` : ''}

    <p style="margin: 0 0 32px 0; font-family: ${fontStack}; font-size: 16px; color: #6b7280; line-height: 1.6;">
      We'd love to hear what's working and what's not. Click below to share quick feedback tailored to where you are in the beta.
    </p>
    <table style="margin-top: 0; width: 100%;">
      <tr><td align="center">
        <a href="${props.feedback_url || 'https://elyphant.ai/beta-feedback'}" style="display: inline-block; padding: 14px 40px; background: #1a1a1a; color: #ffffff; text-decoration: none; border-radius: 6px; font-family: ${fontStack}; font-size: 14px; font-weight: 500; letter-spacing: 0.02em;">
          Give Feedback
        </a>
      </td></tr>
    </table>
  `;
  return baseEmailTemplate({ content, preheader: `See your beta progress and share feedback, ${firstName}` });
};

const getEmailTemplate = (eventType: string, data: any): { html: string; subject: string } => {
  switch (eventType) {
    case 'wishlist_shared':
      return {
        html: wishlistSharedTemplate(data),
        subject: `${data.sender_name || 'A friend'} shared a wishlist with you`
      };
    case 'order_confirmation':
      return {
        html: orderConfirmationTemplate(data),
        subject: `Order Confirmed — ${data.order_number || 'Your Order'}`
      };
    case 'order_pending_payment':
      return {
        html: orderPendingPaymentTemplate(data),
        subject: `Order Scheduled — ${data.order_number || 'Your Order'}`
      };
    case 'order_shipped':
      return {
        html: orderShippedTemplate(data),
        subject: `Your Order Has Shipped — ${data.order_number || 'Tracking Available'}`
      };
    case 'order_failed':
      return {
        html: orderFailedTemplate(data),
        subject: `Order Processing Issue — ${data.order_number || 'Action Required'}`
      };
    case 'connection_invitation':
    case 'gift_invitation':
      return {
        html: connectionInvitationTemplate(data),
        subject: data.has_pending_gift 
          ? `${data.sender_name || 'Someone'} has a gift waiting for you`
          : `${data.sender_name || 'Someone'} invited you to Elyphant`
      };
    case 'connection_established':
      return {
        html: connectionEstablishedTemplate(data),
        subject: `You're now connected with ${data.connection_name || 'a friend'}`
      };
    case 'welcome_email':
      return {
        html: welcomeEmailTemplate(data),
        subject: `Welcome to Elyphant`
      };
    case 'auto_gift_approval':
      return {
        html: autoGiftApprovalTemplate(data),
        subject: `Auto-Gift Approval Needed — ${possessive(data.recipient_name)} ${formatOccasion(data.occasion)}`
      };
    case 'recurring_gift_rule_created':
    case 'auto_gift_rule_created':
      return {
        html: recurringGiftRuleCreatedTemplate(data),
        subject: `Recurring Gifts Set Up for ${data.recipient_name || 'Your Friend'}`
      };
    case 'gift_coming_your_way':
      return {
        html: giftComingYourWayTemplate(data),
        subject: `${data.sender_name || 'Someone special'} sent you a gift`
      };
    case 'zma_low_balance_alert':
      return {
        html: zmaLowBalanceAlertTemplate(data),
        subject: data.is_critical 
          ? `CRITICAL: ZMA Balance Alert — Orders Blocked`
          : `ZMA Low Balance Alert — Transfer Recommended`
      };
    case 'auto_gift_payment_failed':
      return {
        html: autoGiftPaymentFailedTemplate(data),
        subject: `Payment Failed for ${possessive(data.recipient_name || 'Your')} Gift — Action Needed`
      };
    case 'guest_order_confirmation':
      return {
        html: guestOrderConfirmationTemplate(data),
        subject: `Order Confirmed — ${data.order_number || 'Your Order'}`
      };
    case 'vendor_new_order':
      return {
        html: vendorNewOrderTemplate(data),
        subject: `New Order Received — ${data.item_count || ''} item(s) | ${formatPrice(data.total_amount)}`
      };
    case 'vendor_application_received':
      return {
        html: vendorApplicationReceivedTemplate(data),
        subject: `Application Received — ${data.company_name || 'Your Company'} | Elyphant Vendor Program`
      };
    case 'vendor_application_approved':
      return {
        html: vendorApplicationApprovedTemplate(data),
        subject: `You're Approved — Welcome to Elyphant, ${data.company_name || 'Partner'}`
      };
    case 'vendor_application_rejected':
      return {
        html: vendorApplicationRejectedTemplate(data),
        subject: `Application Update — ${data.company_name || 'Your Company'} | Elyphant Vendor Program`
      };
    case 'connection_request':
      return {
        html: connectionRequestTemplate(data),
        subject: `${data.sender_name || 'Someone'} wants to connect with you on Elyphant`
      };
    case 'nudge_reminder':
      return {
        html: nudgeReminderTemplate(data),
        subject: `Reminder: ${data.sender_name || 'Someone'} is waiting to connect with you`
      };
    case 'beta_approval_needed':
      return {
        html: betaApprovalNeededTemplate(data),
        subject: `New Beta Tester Pending Approval — ${data.invitee_name || data.invitee_email || 'New Referral'}`
      };
    case 'beta_invite_welcome':
      return {
        html: betaInviteWelcomeTemplate(data),
        subject: `You're Invited to the Elyphant Beta`
      };
    case 'beta_approved':
      return {
        html: betaApprovedTemplate(data),
        subject: `Welcome to the Elyphant Beta — Your $${data.credit_amount || 100} Credit is Ready`
      };
    case 'beta_checkin':
      return {
        html: betaCheckinTemplate(data),
        subject: data.stage_subject || `Your Elyphant Beta Check-In`
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
    const { eventType, recipientEmail, data, orderId, metadata, preview }: EmailRequest & { orderId?: string; metadata?: any; preview?: boolean } = await req.json();

    // Preview mode: render template with provided data and return HTML without sending
    if (preview) {
      const previewData = data || metadata || {};
      const { html, subject } = getEmailTemplate(eventType, previewData);
      return new Response(
        JSON.stringify({ html, subject }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

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
