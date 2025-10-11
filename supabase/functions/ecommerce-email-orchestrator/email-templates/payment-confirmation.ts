import { baseEmailTemplate } from './base-template.ts';

export interface PaymentConfirmationProps {
  first_name: string;
  order_number: string;
  amount: string;
  payment_method: string;
  transaction_date: string;
}

export const paymentConfirmationTemplate = (props: PaymentConfirmationProps): string => {
  const content = `
    <h2 style="margin: 0 0 10px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 28px; font-weight: 700; color: #1a1a1a; line-height: 1.2;">
      Payment Received ✅
    </h2>
    
    <p style="margin: 0 0 30px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 16px; color: #666666; line-height: 24px;">
      Hi ${props.first_name}, your payment has been successfully processed.
    </p>
    
    <!-- Payment details box -->
    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); border-radius: 8px; padding: 24px; margin-bottom: 30px; border: 1px solid #86efac;">
      <tr>
        <td align="center">
          <div style="width: 48px; height: 48px; background-color: #22c55e; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 16px;">
            <span style="font-size: 24px;">✓</span>
          </div>
          
          <p style="margin: 0 0 20px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 18px; color: #166534; font-weight: 600;">
            Payment Successful
          </p>
          
          <table border="0" cellpadding="0" cellspacing="0" width="100%">
            <tr>
              <td style="padding: 8px 0;">
                <p style="margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 12px; color: #16a34a; text-transform: uppercase; letter-spacing: 0.5px;">
                  Amount Paid
                </p>
                <p style="margin: 5px 0 0 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 24px; color: #166534; font-weight: 700;">
                  $${typeof props.amount === 'number' ? props.amount.toFixed(2) : props.amount}
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding: 8px 0;">
                <p style="margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 12px; color: #16a34a; text-transform: uppercase; letter-spacing: 0.5px;">
                  Order Number
                </p>
                <p style="margin: 5px 0 0 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 16px; color: #166534; font-weight: 600;">
                  ${props.order_number}
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding: 8px 0;">
                <p style="margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 12px; color: #16a34a; text-transform: uppercase; letter-spacing: 0.5px;">
                  Payment Method
                </p>
                <p style="margin: 5px 0 0 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 14px; color: #166534;">
                  ${props.payment_method}
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding: 8px 0;">
                <p style="margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 12px; color: #16a34a; text-transform: uppercase; letter-spacing: 0.5px;">
                  Transaction Date
                </p>
                <p style="margin: 5px 0 0 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 14px; color: #166534;">
                  ${props.transaction_date}
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
    
    <p style="margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 14px; color: #666666; line-height: 22px;">
      A receipt has been sent to your email. If you have any questions about this transaction, please don't hesitate to contact our support team.
    </p>
  `;

  return baseEmailTemplate({
    content,
    preheader: `Payment of ${props.amount} received for order ${props.order_number}`
  });
};
