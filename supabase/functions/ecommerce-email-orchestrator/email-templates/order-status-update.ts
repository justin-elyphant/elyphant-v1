import { baseEmailTemplate } from './base-template.ts';

export interface OrderStatusUpdateProps {
  first_name: string;
  order_number: string;
  status: 'shipped' | 'delivered' | 'delayed' | 'cancelled';
  tracking_number?: string;
  tracking_url?: string;
  expected_delivery?: string;
  delay_reason?: string;
  cancellation_reason?: string;
}

export const orderStatusUpdateTemplate = (props: OrderStatusUpdateProps): string => {
  const statusConfig = {
    shipped: {
      emoji: '📦',
      title: 'Your Order Has Shipped!',
      color: '#0ea5e9',
      bgGradient: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
    },
    delivered: {
      emoji: '✅',
      title: 'Your Order Has Been Delivered!',
      color: '#22c55e',
      bgGradient: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
    },
    delayed: {
      emoji: '⏱️',
      title: 'Order Delayed',
      color: '#f59e0b',
      bgGradient: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)',
    },
    cancelled: {
      emoji: '❌',
      title: 'Order Cancelled',
      color: '#ef4444',
      bgGradient: 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)',
    },
  };

  const config = statusConfig[props.status];

  const content = `
    <h2 style="margin: 0 0 10px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 28px; font-weight: 700; color: #1a1a1a; line-height: 1.2;">
      ${config.title} ${config.emoji}
    </h2>
    
    <p style="margin: 0 0 30px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 16px; color: #666666; line-height: 24px;">
      Hi ${props.first_name}, here's an update on your order.
    </p>
    
    <!-- Status box -->
    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background: ${config.bgGradient}; border-radius: 8px; padding: 24px; margin-bottom: 30px;">
      <tr>
        <td>
          <p style="margin: 0 0 5px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 12px; color: ${config.color}; text-transform: uppercase; letter-spacing: 0.5px;">
            Order Number
          </p>
          <p style="margin: 0 0 20px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 18px; color: #1a1a1a; font-weight: 600;">
            ${props.order_number}
          </p>
          
          ${props.tracking_number ? `
          <p style="margin: 0 0 5px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 12px; color: ${config.color}; text-transform: uppercase; letter-spacing: 0.5px;">
            Tracking Number
          </p>
          <p style="margin: 0 0 20px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 16px; color: #1a1a1a; font-weight: 600; font-family: monospace;">
            ${props.tracking_number}
          </p>
          ` : ''}
          
          ${props.expected_delivery ? `
          <p style="margin: 0 0 5px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 12px; color: ${config.color}; text-transform: uppercase; letter-spacing: 0.5px;">
            Expected Delivery
          </p>
          <p style="margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 16px; color: #1a1a1a; font-weight: 600;">
            ${props.expected_delivery}
          </p>
          ` : ''}
          
          ${props.delay_reason ? `
          <p style="margin: 20px 0 5px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 12px; color: ${config.color}; text-transform: uppercase; letter-spacing: 0.5px;">
            Reason for Delay
          </p>
          <p style="margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 14px; color: #666666; line-height: 22px;">
            ${props.delay_reason}
          </p>
          ` : ''}
          
          ${props.cancellation_reason ? `
          <p style="margin: 20px 0 5px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 12px; color: ${config.color}; text-transform: uppercase; letter-spacing: 0.5px;">
            Cancellation Reason
          </p>
          <p style="margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 14px; color: #666666; line-height: 22px;">
            ${props.cancellation_reason}
          </p>
          ` : ''}
        </td>
      </tr>
    </table>
    
    ${props.tracking_url && props.status === 'shipped' ? `
    <!-- Track order button -->
    <table border="0" cellpadding="0" cellspacing="0" width="100%">
      <tr>
        <td align="center" style="padding: 20px 0;">
          <a href="${props.tracking_url}" style="display: inline-block; padding: 16px 32px; background: linear-gradient(90deg, #9333ea 0%, #7c3aed 50%, #0ea5e9 100%); color: #ffffff; text-decoration: none; border-radius: 8px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 16px; font-weight: 600;">
            Track Your Package
          </a>
        </td>
      </tr>
    </table>
    ` : ''}
    
    ${props.status === 'delivered' ? `
    <p style="margin: 20px 0 0 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 14px; color: #666666; line-height: 22px; text-align: center;">
      We hope you love your order! If you have any issues, please contact our support team.
    </p>
    ` : ''}
  `;

  return baseEmailTemplate({
    content,
    preheader: `Order ${props.order_number} ${props.status}`
  });
};
