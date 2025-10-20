import { baseEmailTemplate } from './base-template.ts';

export interface OrderConfirmationProps {
  first_name: string;
  order_number: string;
  total_amount: string;
  order_date: string;
  items: Array<{
    name: string;
    quantity: number;
    price: string;
    image?: string;
  }>;
  shipping_address: string;
  tracking_url?: string;
  
  // Payment details
  payment_method?: string;
  payment_brand?: string;
  payment_last4?: string;
  transaction_date?: string;
  transaction_id?: string;
  order_details_url?: string;
  estimated_delivery?: string;
  subtotal?: string;
  shipping_cost?: string;
  tax_amount?: string;
  
  // Multi-recipient support
  is_multi_recipient?: boolean;
  recipient_count?: number;
  child_orders?: Array<{
    recipient_name: string;
    recipient_location: string; // City, State ZIP only for privacy
    items: Array<{
      name: string;
      quantity: number;
      price: string;
      image?: string;
    }>;
    gift_message?: string;
    estimated_delivery?: string;
    order_details_url?: string;
  }>;
}

export const orderConfirmationTemplate = (props: OrderConfirmationProps): string => {
  // Helper function to render single-recipient items
  const renderSingleRecipientItems = () => {
    const itemsHtml = props.items.map(item => `
      <tr>
        <td style="padding: 10px 0; border-bottom: 1px solid #f0f0f0;">
          <p style="margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 14px; color: #333333; font-weight: 500;">
            ${item.name}
          </p>
          <p style="margin: 5px 0 0 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 12px; color: #666666;">
            Quantity: ${item.quantity}
          </p>
        </td>
        <td align="right" style="padding: 10px 0; border-bottom: 1px solid #f0f0f0;">
          <p style="margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 14px; color: #333333; font-weight: 600;">
            ${item.price}
          </p>
        </td>
      </tr>
    `).join('');

    return `
      <h3 style="margin: 0 0 20px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 18px; font-weight: 600; color: #1a1a1a;">
        Order Items
      </h3>
      <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 30px;">
        ${itemsHtml}
      </table>
    `;
  };

  // Helper function to render multi-recipient gifts
  const renderMultiRecipientGifts = () => {
    if (!props.child_orders || props.child_orders.length === 0) return '';
    
    return props.child_orders.map((childOrder, index) => {
      const childItemsHtml = childOrder.items.map(item => `
        <tr>
          <td style="padding: 8px 0; border-bottom: 1px solid #f0f0f0;">
            <p style="margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 13px; color: #333333; font-weight: 500;">
              ${item.name}
            </p>
            <p style="margin: 3px 0 0 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 11px; color: #666666;">
              Qty: ${item.quantity}
            </p>
          </td>
          <td align="right" style="padding: 8px 0; border-bottom: 1px solid #f0f0f0;">
            <p style="margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 13px; color: #333333; font-weight: 600;">
              ${item.price}
            </p>
          </td>
        </tr>
      `).join('');

      return `
        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f8f9fa; border-radius: 8px; padding: 20px; margin-bottom: 20px; border: 1px solid #e5e7eb;">
          <tr>
            <td>
              <p style="margin: 0 0 10px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 16px; color: #1a1a1a; font-weight: 600;">
                🎁 Gift ${index + 1} of ${props.child_orders.length}: ${childOrder.recipient_name}
              </p>
              <p style="margin: 0 0 15px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 12px; color: #666666;">
                Shipping to: ${childOrder.recipient_location}
              </p>
              ${childOrder.gift_message ? `
                <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #ffffff; border-radius: 6px; padding: 12px; margin-bottom: 15px; border-left: 3px solid #9333ea;">
                  <tr>
                    <td>
                      <p style="margin: 0 0 5px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 11px; color: #999999; text-transform: uppercase; letter-spacing: 0.5px;">
                        Gift Message
                      </p>
                      <p style="margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 13px; color: #333333; font-style: italic;">
                        "${childOrder.gift_message}"
                      </p>
                    </td>
                  </tr>
                </table>
              ` : ''}
              <table border="0" cellpadding="0" cellspacing="0" width="100%">
                ${childItemsHtml}
              </table>
              ${childOrder.estimated_delivery ? `
                <p style="margin: 15px 0 0 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 12px; color: #666666;">
                  📦 Estimated Delivery: ${childOrder.estimated_delivery}
                </p>
              ` : ''}
            </td>
          </tr>
        </table>
      `;
    }).join('');
  };

  const content = `
    <!-- Payment Success Badge -->
    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); border-radius: 8px; padding: 16px; margin-bottom: 20px; border: 1px solid #86efac;">
      <tr>
        <td align="center">
          <p style="margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 14px; color: #166534; font-weight: 600;">
            ✅ Payment Confirmed | Order Confirmed! 🎉
          </p>
        </td>
      </tr>
    </table>

    <h2 style="margin: 0 0 10px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 28px; font-weight: 700; color: #1a1a1a; line-height: 1.2;">
      ${props.is_multi_recipient ? `Gifts Confirmed for ${props.recipient_count} Recipients! 🎁` : 'Order Confirmed! 🎉'}
    </h2>
    
    <p style="margin: 0 0 30px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 16px; color: #666666; line-height: 24px;">
      Hi ${props.first_name}, ${props.is_multi_recipient ? `your gifts for ${props.recipient_count} people are confirmed and your payment has been successfully processed!` : 'thanks for your order! Your payment has been processed and we\'re getting everything ready.'}
    </p>
    
    <!-- Order summary box -->
    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f8f9fa; border-radius: 8px; padding: 20px; margin-bottom: 30px;">
      <tr>
        <td>
          <p style="margin: 0 0 5px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 12px; color: #999999; text-transform: uppercase; letter-spacing: 0.5px;">
            Order Number
          </p>
          <p style="margin: 0 0 15px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 18px; color: #1a1a1a; font-weight: 600;">
            ${props.order_number}
          </p>
          
          <p style="margin: 0 0 5px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 12px; color: #999999; text-transform: uppercase; letter-spacing: 0.5px;">
            Order Date
          </p>
          <p style="margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 14px; color: #666666;">
            ${props.order_date}
          </p>
        </td>
      </tr>
    </table>
    
    <!-- Order items or multi-recipient gifts -->
    ${props.is_multi_recipient ? `
      <h3 style="margin: 0 0 20px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 18px; font-weight: 600; color: #1a1a1a;">
        🎁 Your Gifts (${props.recipient_count} Recipients)
      </h3>
      ${renderMultiRecipientGifts()}
    ` : renderSingleRecipientItems()}
    
    <!-- Order totals -->
    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f8f9fa; border-radius: 8px; padding: 20px; margin-bottom: 30px;">
      <tr>
        <td>
          ${props.subtotal ? `
            <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 8px;">
              <tr>
                <td>
                  <p style="margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 14px; color: #666666;">
                    Subtotal
                  </p>
                </td>
                <td align="right">
                  <p style="margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 14px; color: #333333; font-weight: 500;">
                    ${props.subtotal}
                  </p>
                </td>
              </tr>
            </table>
          ` : ''}
          ${props.shipping_cost ? `
            <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 8px;">
              <tr>
                <td>
                  <p style="margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 14px; color: #666666;">
                    Shipping
                  </p>
                </td>
                <td align="right">
                  <p style="margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 14px; color: #333333; font-weight: 500;">
                    ${props.shipping_cost}
                  </p>
                </td>
              </tr>
            </table>
          ` : ''}
          ${props.tax_amount ? `
            <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 15px;">
              <tr>
                <td>
                  <p style="margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 14px; color: #666666;">
                    Tax
                  </p>
                </td>
                <td align="right">
                  <p style="margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 14px; color: #333333; font-weight: 500;">
                    ${props.tax_amount}
                  </p>
                </td>
              </tr>
            </table>
          ` : ''}
          <table border="0" cellpadding="0" cellspacing="0" width="100%" style="border-top: 2px solid #d1d5db; padding-top: 15px;">
            <tr>
              <td>
                <p style="margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 16px; color: #1a1a1a; font-weight: 600;">
                  Total
                </p>
              </td>
              <td align="right">
                <p style="margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 24px; color: #1a1a1a; font-weight: 700;">
                  ${props.total_amount}
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
    
    <!-- Payment details -->
    ${props.payment_method ? `
      <h3 style="margin: 0 0 15px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 18px; font-weight: 600; color: #1a1a1a;">
        💳 Payment Details
      </h3>
      <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #fafafa; border-radius: 8px; padding: 20px; margin-bottom: 30px;">
        <tr>
          <td>
            <table border="0" cellpadding="0" cellspacing="0" width="100%">
              <tr>
                <td style="padding: 8px 0;">
                  <p style="margin: 0 0 3px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 12px; color: #999999; text-transform: uppercase; letter-spacing: 0.5px;">
                    Payment Method
                  </p>
                  <p style="margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 14px; color: #333333;">
                    ${props.payment_method}
                  </p>
                </td>
              </tr>
              ${props.transaction_date ? `
                <tr>
                  <td style="padding: 8px 0;">
                    <p style="margin: 0 0 3px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 12px; color: #999999; text-transform: uppercase; letter-spacing: 0.5px;">
                      Transaction Date
                    </p>
                    <p style="margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 14px; color: #333333;">
                      ${props.transaction_date}
                    </p>
                  </td>
                </tr>
              ` : ''}
              ${props.transaction_id ? `
                <tr>
                  <td style="padding: 8px 0;">
                    <p style="margin: 0 0 3px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 12px; color: #999999; text-transform: uppercase; letter-spacing: 0.5px;">
                      Transaction ID
                    </p>
                    <p style="margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 11px; color: #666666; font-family: 'Courier New', monospace;">
                      ${props.transaction_id}
                    </p>
                  </td>
                </tr>
              ` : ''}
            </table>
          </td>
        </tr>
      </table>
    ` : ''}
    
    <!-- Shipping address (only for single-recipient orders) -->
    ${!props.is_multi_recipient && props.shipping_address ? `
      <h3 style="margin: 0 0 15px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 18px; font-weight: 600; color: #1a1a1a;">
        📍 Shipping Address
      </h3>
      <p style="margin: 0 0 30px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 14px; color: #666666; line-height: 22px;">
        ${props.shipping_address.replace(/\n/g, '<br>')}
      </p>
      ${props.estimated_delivery ? `
        <p style="margin: 0 0 30px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 14px; color: #666666;">
          📦 Estimated Delivery: ${props.estimated_delivery}
        </p>
      ` : ''}
    ` : ''}
    
    <!-- View order details button -->
    ${props.order_details_url ? `
      <table border="0" cellpadding="0" cellspacing="0" width="100%">
        <tr>
          <td align="center" style="padding: 20px 0;">
            <a href="${props.order_details_url}" style="display: inline-block; padding: 16px 32px; background: linear-gradient(90deg, #9333ea 0%, #7c3aed 50%, #0ea5e9 100%); color: #ffffff; text-decoration: none; border-radius: 8px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 16px; font-weight: 600;">
              View Order Details
            </a>
          </td>
        </tr>
      </table>
    ` : ''}
    
    <!-- What's next section -->
    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #fafafa; border-radius: 8px; padding: 20px; margin-top: 30px;">
      <tr>
        <td>
          <h3 style="margin: 0 0 15px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 16px; font-weight: 600; color: #1a1a1a;">
            📬 What's Next?
          </h3>
          <p style="margin: 0 0 10px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 14px; color: #666666; line-height: 22px;">
            1. We're preparing ${props.is_multi_recipient ? 'your gifts' : 'your order'} for shipment<br>
            2. You'll receive ${props.is_multi_recipient ? 'tracking notifications' : 'a shipping confirmation'} once ${props.is_multi_recipient ? 'each gift ships' : 'it ships'}<br>
            3. ${props.is_multi_recipient ? 'Each recipient will be notified when their gift arrives' : `Estimated delivery in ${props.estimated_delivery || '5-7 business days'}`}
          </p>
        </td>
      </tr>
    </table>
  `;

  const subjectLine = props.is_multi_recipient 
    ? `Order Confirmed! 🎉 ${props.recipient_count} Gifts - Payment Received - Order #${props.order_number}`
    : `Order Confirmed! 🎉 Payment Received - Order #${props.order_number}`;

  return baseEmailTemplate({
    content,
    preheader: props.is_multi_recipient 
      ? `${props.recipient_count} gifts confirmed - Total: ${props.total_amount}` 
      : `Order ${props.order_number} confirmed - Total: ${props.total_amount}`
  });
};
