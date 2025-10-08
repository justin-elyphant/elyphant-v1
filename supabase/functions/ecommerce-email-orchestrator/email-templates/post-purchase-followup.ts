import { baseEmailTemplate } from './base-template.ts';

export interface PostPurchaseFollowupProps {
  first_name: string;
  order_number: string;
  product_names: string[];
  feedback_url: string;
  support_url: string;
}

export const postPurchaseFollowupTemplate = (props: PostPurchaseFollowupProps): string => {
  const content = `
    <h2 style="margin: 0 0 10px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 28px; font-weight: 700; color: #1a1a1a; line-height: 1.2;">
      How's everything going? 💝
    </h2>
    
    <p style="margin: 0 0 30px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 16px; color: #666666; line-height: 24px;">
      Hi ${props.first_name}, we hope you're enjoying your recent purchase! We'd love to hear your thoughts.
    </p>
    
    <!-- Order Reference -->
    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); border-radius: 8px; padding: 24px; margin-bottom: 30px; border: 1px solid #bae6fd;">
      <tr>
        <td>
          <p style="margin: 0 0 8px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 12px; color: #0369a1; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600;">
            Order #{props.order_number}
          </p>
          <p style="margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 14px; color: #0c4a6e; line-height: 22px;">
            ${props.product_names.join(', ')}
          </p>
        </td>
      </tr>
    </table>
    
    <h3 style="margin: 0 0 16px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 20px; font-weight: 600; color: #1a1a1a;">
      Share Your Experience
    </h3>
    
    <p style="margin: 0 0 24px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 14px; color: #666666; line-height: 22px;">
      Your feedback helps us improve and helps others make great gift choices. It only takes a minute!
    </p>
    
    <!-- CTA Buttons -->
    <table border="0" cellpadding="0" cellspacing="0" width="100%">
      <tr>
        <td align="center" style="padding: 10px 0;">
          <a href="${props.feedback_url}" style="display: inline-block; padding: 14px 32px; background: linear-gradient(90deg, #9333ea 0%, #7c3aed 50%, #0ea5e9 100%); color: #ffffff; text-decoration: none; border-radius: 8px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 15px; font-weight: 600;">
            Leave a Review
          </a>
        </td>
      </tr>
      <tr>
        <td align="center" style="padding: 10px 0;">
          <a href="${props.support_url}" style="display: inline-block; padding: 14px 32px; background: #ffffff; color: #9333ea; text-decoration: none; border-radius: 8px; border: 2px solid #9333ea; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 15px; font-weight: 600;">
            Contact Support
          </a>
        </td>
      </tr>
    </table>
    
    <p style="margin: 30px 0 0 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 14px; color: #666666; line-height: 22px; text-align: center;">
      Thank you for choosing Elyphant for your gifting needs! 🎁
    </p>
  `;

  return baseEmailTemplate({
    content,
    preheader: `How's your recent order? We'd love your feedback!`
  });
};
