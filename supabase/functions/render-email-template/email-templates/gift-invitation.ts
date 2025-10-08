import { baseEmailTemplate } from './base-template.ts';

export interface GiftInvitationProps {
  sender_first_name: string;
  recipient_name: string;
  invitation_url: string;
  occasion?: string;
  custom_message?: string;
}

export const giftInvitationTemplate = (props: GiftInvitationProps): string => {
  const content = `
    <h2 style="margin: 0 0 10px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 28px; font-weight: 700; color: #1a1a1a; line-height: 1.2;">
      ${props.sender_first_name} invited you to Elyphant! 💝
    </h2>
    
    <p style="margin: 0 0 30px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 16px; color: #666666; line-height: 24px;">
      Hi${props.recipient_name ? ` ${props.recipient_name}` : ''}, ${props.sender_first_name} wants to make gift-giving easier by connecting with you on Elyphant!
    </p>
    
    ${props.occasion ? `
    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background: linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%); border-radius: 8px; padding: 20px; margin-bottom: 30px;">
      <tr>
        <td>
          <p style="margin: 0 0 5px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 12px; color: #c2410c; text-transform: uppercase; letter-spacing: 0.5px;">
            Occasion
          </p>
          <p style="margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 18px; color: #9a3412; font-weight: 600;">
            ${props.occasion}
          </p>
        </td>
      </tr>
    </table>
    ` : ''}
    
    ${props.custom_message ? `
    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f8f9fa; border-left: 4px solid #9333ea; padding: 20px; margin-bottom: 30px; border-radius: 4px;">
      <tr>
        <td>
          <p style="margin: 0 0 8px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 12px; color: #9333ea; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600;">
            Personal Message
          </p>
          <p style="margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 14px; color: #1a1a1a; line-height: 22px; font-style: italic;">
            "${props.custom_message}"
          </p>
        </td>
      </tr>
    </table>
    ` : ''}
    
    <h3 style="margin: 0 0 20px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 20px; font-weight: 600; color: #1a1a1a;">
      Why join Elyphant?
    </h3>
    
    <ul style="margin: 0 0 30px 0; padding-left: 20px;">
      <li style="margin-bottom: 12px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 14px; color: #666666; line-height: 22px;">
        <strong style="color: #1a1a1a;">Create wishlists</strong> so friends know exactly what you want
      </li>
      <li style="margin-bottom: 12px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 14px; color: #666666; line-height: 22px;">
        <strong style="color: #1a1a1a;">Never forget</strong> birthdays, anniversaries, or special occasions
      </li>
      <li style="margin-bottom: 12px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 14px; color: #666666; line-height: 22px;">
        <strong style="color: #1a1a1a;">Get smart suggestions</strong> powered by AI for the perfect gift
      </li>
      <li style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 14px; color: #666666; line-height: 22px;">
        <strong style="color: #1a1a1a;">Connect with loved ones</strong> and make every gift meaningful
      </li>
    </ul>
    
    <!-- CTA button -->
    <table border="0" cellpadding="0" cellspacing="0" width="100%">
      <tr>
        <td align="center" style="padding: 20px 0;">
          <a href="${props.invitation_url}" style="display: inline-block; padding: 18px 40px; background: linear-gradient(90deg, #9333ea 0%, #7c3aed 50%, #0ea5e9 100%); color: #ffffff; text-decoration: none; border-radius: 8px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 18px; font-weight: 600;">
            Accept Invitation
          </a>
        </td>
      </tr>
    </table>
    
    <p style="margin: 30px 0 0 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 12px; color: #999999; line-height: 20px; text-align: center;">
      Not interested? You can safely ignore this email. We won't send you anything else unless you create an account.
    </p>
  `;

  return baseEmailTemplate({
    content,
    preheader: `${props.sender_first_name} invited you to join Elyphant`
  });
};
