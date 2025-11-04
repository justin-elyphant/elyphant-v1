import { baseEmailTemplate } from './base-template.ts';
import type { BaseTemplateProps } from './base-template.ts';

export interface OrderCancelledProps {
  first_name: string;
  order_number: string;
  order_items: Array<{
    name: string;
    price: number;
    quantity: number;
  }>;
  refund_amount: number;
  refund_timeline: string;
  cancellation_reason?: string;
  support_url: string;
}

export function orderCancelledTemplate(props: OrderCancelledProps): string {
  const itemsHtml = props.order_items.map(item => `
    <tr>
      <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">
        ${item.name} × ${item.quantity}
      </td>
      <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; text-align: right;">
        $${(item.price * item.quantity).toFixed(2)}
      </td>
    </tr>
  `).join('');

  const content = `
    <p style="font-size: 16px; line-height: 1.6; color: #374151; margin-bottom: 20px;">
      Hi ${props.first_name},
    </p>

    <p style="font-size: 16px; line-height: 1.6; color: #374151; margin-bottom: 20px;">
      Your order <strong>#${props.order_number}</strong> has been cancelled.
    </p>

    ${props.cancellation_reason ? `
    <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; margin: 20px 0; border-radius: 4px;">
      <p style="margin: 0; color: #92400e;">
        <strong>Reason:</strong> ${props.cancellation_reason}
      </p>
    </div>
    ` : ''}

    <h2 style="color: #1f2937; font-size: 20px; margin: 30px 0 20px;">
      Order Details
    </h2>

    <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
      <thead>
        <tr style="background: #f9fafb;">
          <th style="padding: 10px; text-align: left; border-bottom: 2px solid #e5e7eb; color: #6b7280;">
            Item
          </th>
          <th style="padding: 10px; text-align: right; border-bottom: 2px solid #e5e7eb; color: #6b7280;">
            Amount
          </th>
        </tr>
      </thead>
      <tbody>
        ${itemsHtml}
        <tr style="font-weight: bold; background: #f9fafb;">
          <td style="padding: 15px; border-top: 2px solid #e5e7eb;">
            Refund Total
          </td>
          <td style="padding: 15px; text-align: right; border-top: 2px solid #e5e7eb; color: #059669;">
            $${props.refund_amount.toFixed(2)}
          </td>
        </tr>
      </tbody>
    </table>

    <div style="background: #ecfdf5; border: 1px solid #d1fae5; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
      <h3 style="margin: 0 0 10px 0; color: #065f46; font-size: 16px;">
        💰 Refund Information
      </h3>
      <p style="margin: 0; color: #047857; line-height: 1.6;">
        Your refund of <strong>$${props.refund_amount.toFixed(2)}</strong> will be processed within <strong>${props.refund_timeline}</strong> and will appear in your original payment method.
      </p>
    </div>

    <p style="font-size: 16px; line-height: 1.6; color: #374151; margin-bottom: 20px;">
      If you have any questions about this cancellation, our support team is here to help.
    </p>

    <div style="text-align: center; margin: 30px 0;">
      <a href="${props.support_url}" 
         style="background-color: #9333ea; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: 600;">
        Contact Support
      </a>
    </div>

    <p style="font-size: 14px; color: #6b7280; margin-top: 30px;">
      We're sorry to see this order cancelled. We hope to serve you again soon!
    </p>
  `;

  return baseEmailTemplate({
    content,
    preheader: `Order #${props.order_number} cancelled - Refund processing`
  });
}
