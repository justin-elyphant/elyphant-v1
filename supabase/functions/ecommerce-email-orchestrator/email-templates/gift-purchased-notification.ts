/**
 * Gift Purchased Notification Email
 * Sent to recipient when someone purchases a gift for them
 */

import { baseEmailTemplate } from './base-template.ts';

export interface GiftPurchasedNotificationProps {
  recipient_first_name: string;
  giftor_name: string;
  occasion: string;
  expected_delivery_date?: string;
  gift_message?: string;
  order_number: string;
  preview_token?: string;
}

export const giftPurchasedNotificationTemplate = (props: GiftPurchasedNotificationProps): string => {
  const {
    recipient_first_name,
    giftor_name,
    occasion,
    expected_delivery_date,
    gift_message,
    order_number,
    preview_token
  } = props;

  // Format delivery date if provided
  const deliveryDateText = expected_delivery_date 
    ? `<p style="margin: 0 0 20px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 14px; color: #666666;">
         <strong>Expected Delivery:</strong> ${new Date(expected_delivery_date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
       </p>`
    : '';

  // Format personal message if provided
  const messageBox = gift_message
    ? `<div style="background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); border-left: 4px solid #0ea5e9; padding: 20px; margin: 30px 0; border-radius: 8px;">
         <p style="margin: 0 0 10px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 12px; color: #0369a1; text-transform: uppercase; font-weight: 600; letter-spacing: 0.5px;">
           Personal Message from ${giftor_name}
         </p>
         <p style="margin: 0; font-family: Georgia, 'Times New Roman', serif; font-size: 16px; color: #1e293b; line-height: 26px; font-style: italic;">
           "${gift_message}"
         </p>
       </div>`
    : '';

  const content = `
    <div style="text-align: center; margin-bottom: 30px;">
      <div style="display: inline-block; background: linear-gradient(135deg, #9333ea, #7c3aed); padding: 12px 24px; border-radius: 50px; margin-bottom: 20px;">
        <p style="margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 32px; line-height: 1;">
          🎁
        </p>
      </div>
      <h1 style="margin: 0 0 10px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 32px; font-weight: 700; color: #1a1a1a; line-height: 1.2;">
        A Gift Is On The Way!
      </h1>
      <p style="margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 18px; color: #666666; line-height: 1.4;">
        Someone special just sent you something
      </p>
    </div>

    <div style="background: linear-gradient(135deg, #faf5ff 0%, #f3e8ff 100%); border-radius: 12px; padding: 30px; margin-bottom: 30px; border: 1px solid #e9d5ff;">
      <p style="margin: 0 0 20px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 18px; color: #1a1a1a; line-height: 28px;">
        Hi <strong>${recipient_first_name}</strong>,
      </p>
      <p style="margin: 0 0 20px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 16px; color: #333333; line-height: 26px;">
        <strong style="background: linear-gradient(90deg, #9333ea, #7c3aed); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">${giftor_name}</strong> just purchased a thoughtful gift for your <strong>${occasion}</strong>! 🎉
      </p>
      ${deliveryDateText}
      <p style="margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 14px; color: #666666;">
        <strong>Order Number:</strong> ${order_number}
      </p>
    </div>

    ${messageBox}

    <div style="text-align: center; margin: 40px 0;">
      ${preview_token ? `
        <!-- Interactive Sneak Peek Section -->
        <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border-radius: 12px; padding: 30px; margin-bottom: 30px;">
          <p style="margin: 0 0 20px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 18px; color: #92400e; font-weight: 600;">
            🎁 Curious what's inside?
          </p>
          <p style="margin: 0 0 25px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 14px; color: #78350f; line-height: 22px;">
            Choose your adventure:
          </p>
          <div style="display: flex; gap: 15px; justify-content: center; flex-wrap: wrap;">
            <a href="https://elyphant.ai/gifts/preview/${preview_token}" 
               style="display: inline-block; background: linear-gradient(90deg, #9333ea 0%, #7c3aed 100%); color: #ffffff; text-decoration: none; padding: 16px 32px; border-radius: 8px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 15px; font-weight: 600; box-shadow: 0 4px 12px rgba(147, 51, 234, 0.4); min-width: 160px; text-align: center;">
              👀 Preview Gift
            </a>
            <a href="https://elyphant.ai/gifts/preview/${preview_token}?action=thankyou" 
               style="display: inline-block; background: #ffffff; color: #9333ea; text-decoration: none; padding: 16px 32px; border-radius: 8px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 15px; font-weight: 600; border: 2px solid #9333ea; box-shadow: 0 2px 8px rgba(147, 51, 234, 0.2); min-width: 160px; text-align: center;">
              🎉 Keep Surprise
            </a>
          </div>
          <p style="margin: 25px 0 0 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 12px; color: #92400e; line-height: 18px;">
            Either way, you can thank ${giftor_name} with a message! ✨
          </p>
        </div>
      ` : `
        <!-- Fallback: Traditional tracking link -->
        <a href="https://elyphant.ai/orders/${order_number}" 
           style="display: inline-block; background: linear-gradient(90deg, #9333ea 0%, #7c3aed 50%, #0ea5e9 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 16px; font-weight: 600; box-shadow: 0 4px 12px rgba(147, 51, 234, 0.3);">
          Track Your Gift
        </a>
      `}
    </div>

    <div style="background-color: #f8f9fa; border-radius: 8px; padding: 20px; margin-top: 30px;">
      <p style="margin: 0 0 10px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 14px; color: #666666; line-height: 22px;">
        <strong style="color: #1a1a1a;">What happens next?</strong>
      </p>
      <p style="margin: 0 0 8px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 14px; color: #666666; line-height: 22px;">
        • We'll process and ship your gift${expected_delivery_date ? ' to arrive by ' + new Date(expected_delivery_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric' }) : ''}
      </p>
      <p style="margin: 0 0 8px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 14px; color: #666666; line-height: 22px;">
        • You'll receive tracking updates via email
      </p>
      <p style="margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 14px; color: #666666; line-height: 22px;">
        • Questions? We're here to help at <a href="mailto:hello@elyphant.ai" style="color: #9333ea; text-decoration: none;">hello@elyphant.ai</a>
      </p>
    </div>

    <p style="margin: 30px 0 0 0; text-align: center; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 14px; color: #999999; line-height: 22px;">
      Made with ❤️ by the Elyphant team
    </p>
  `;

  return baseEmailTemplate({
    content,
    preheader: `${giftor_name} just sent you a gift for your ${occasion}! 🎁`
  });
};
