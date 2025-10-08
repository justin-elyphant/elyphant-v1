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
  }>;
  shipping_address: string;
  tracking_url?: string;
}

export const orderConfirmationTemplate = (props: OrderConfirmationProps): string => {
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

  const content = `
    <h2 style="margin: 0 0 10px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 28px; font-weight: 700; color: #1a1a1a; line-height: 1.2;">
      Order Confirmed! 🎉
    </h2>
    
    <p style="margin: 0 0 30px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 16px; color: #666666; line-height: 24px;">
      Hi ${props.first_name}, thanks for your order! We're getting it ready and will notify you when it ships.
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
    
    <!-- Order items -->
    <h3 style="margin: 0 0 20px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 18px; font-weight: 600; color: #1a1a1a;">
      Order Items
    </h3>
    
    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 30px;">
      ${itemsHtml}
      <tr>
        <td align="right" style="padding: 20px 0 0 0;">
          <p style="margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 12px; color: #999999; text-transform: uppercase; letter-spacing: 0.5px;">
            Total
          </p>
          <p style="margin: 5px 0 0 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 24px; color: #1a1a1a; font-weight: 700;">
            ${props.total_amount}
          </p>
        </td>
      </tr>
    </table>
    
    <!-- Shipping address -->
    <h3 style="margin: 0 0 15px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 18px; font-weight: 600; color: #1a1a1a;">
      Shipping Address
    </h3>
    
    <p style="margin: 0 0 30px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 14px; color: #666666; line-height: 22px;">
      ${props.shipping_address.replace(/\n/g, '<br>')}
    </p>
    
    ${props.tracking_url ? `
    <!-- Track order button -->
    <table border="0" cellpadding="0" cellspacing="0" width="100%">
      <tr>
        <td align="center" style="padding: 20px 0;">
          <a href="${props.tracking_url}" style="display: inline-block; padding: 16px 32px; background: linear-gradient(90deg, #9333ea 0%, #7c3aed 50%, #0ea5e9 100%); color: #ffffff; text-decoration: none; border-radius: 8px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 16px; font-weight: 600;">
            Track Your Order
          </a>
        </td>
      </tr>
    </table>
    ` : ''}
  `;

  return baseEmailTemplate({
    content,
    preheader: `Order ${props.order_number} confirmed - Total: ${props.total_amount}`
  });
};
