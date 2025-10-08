import { baseEmailTemplate } from './base-template.ts';

export interface AutoGiftApprovalProps {
  first_name: string;
  recipient_name: string;
  occasion: string;
  suggested_gifts: Array<{
    name: string;
    price: string;
    image_url?: string;
  }>;
  approve_url: string;
  reject_url: string;
  execution_date: string;
}

export const autoGiftApprovalTemplate = (props: AutoGiftApprovalProps): string => {
  const giftsHtml = props.suggested_gifts.slice(0, 3).map(gift => `
    <tr>
      <td style="padding: 15px; background-color: #f8f9fa; border-radius: 8px; margin-bottom: 10px;">
        <table border="0" cellpadding="0" cellspacing="0" width="100%">
          <tr>
            ${gift.image_url ? `
            <td width="80" style="padding-right: 15px;">
              <img src="${gift.image_url}" alt="${gift.name}" style="width: 80px; height: 80px; object-fit: cover; border-radius: 6px;" />
            </td>
            ` : ''}
            <td>
              <p style="margin: 0 0 5px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 16px; color: #1a1a1a; font-weight: 600;">
                ${gift.name}
              </p>
              <p style="margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 18px; color: #9333ea; font-weight: 700;">
                ${gift.price}
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
    <tr><td style="height: 10px;"></td></tr>
  `).join('');

  const content = `
    <h2 style="margin: 0 0 10px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 28px; font-weight: 700; color: #1a1a1a; line-height: 1.2;">
      Gift Approval Needed 🎁
    </h2>
    
    <p style="margin: 0 0 30px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 16px; color: #666666; line-height: 24px;">
      Hi ${props.first_name}, we've found the perfect gift for ${props.recipient_name}'s ${props.occasion}! Please review and approve before ${props.execution_date}.
    </p>
    
    <!-- Occasion info -->
    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background: linear-gradient(135deg, #fdf4ff 0%, #fae8ff 100%); border-radius: 8px; padding: 20px; margin-bottom: 30px;">
      <tr>
        <td>
          <p style="margin: 0 0 5px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 12px; color: #a855f7; text-transform: uppercase; letter-spacing: 0.5px;">
            Upcoming Occasion
          </p>
          <p style="margin: 0 0 15px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 20px; color: #7c3aed; font-weight: 700;">
            ${props.recipient_name}'s ${props.occasion}
          </p>
          
          <p style="margin: 0 0 5px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 12px; color: #a855f7; text-transform: uppercase; letter-spacing: 0.5px;">
            Scheduled Delivery
          </p>
          <p style="margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 16px; color: #6b21a8; font-weight: 600;">
            ${props.execution_date}
          </p>
        </td>
      </tr>
    </table>
    
    <!-- Gift suggestions -->
    <h3 style="margin: 0 0 20px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 20px; font-weight: 600; color: #1a1a1a;">
      Suggested Gifts
    </h3>
    
    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 30px;">
      ${giftsHtml}
    </table>
    
    <!-- Action buttons -->
    <table border="0" cellpadding="0" cellspacing="0" width="100%">
      <tr>
        <td align="center" style="padding: 20px 0;">
          <a href="${props.approve_url}" style="display: inline-block; padding: 16px 40px; background: linear-gradient(90deg, #9333ea 0%, #7c3aed 50%, #0ea5e9 100%); color: #ffffff; text-decoration: none; border-radius: 8px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 16px; font-weight: 600; margin: 0 10px 10px 0;">
            ✓ Approve & Send Gift
          </a>
          <a href="${props.reject_url}" style="display: inline-block; padding: 16px 40px; background-color: #ffffff; color: #dc2626; text-decoration: none; border-radius: 8px; border: 2px solid #dc2626; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 16px; font-weight: 600; margin: 0 0 10px 10px;">
            ✕ Reject
          </a>
        </td>
      </tr>
    </table>
    
    <p style="margin: 30px 0 0 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 13px; color: #999999; line-height: 20px; text-align: center;">
      ⏰ This approval request expires in 48 hours. If we don't hear from you, we'll send a reminder.
    </p>
  `;

  return baseEmailTemplate({
    content,
    preheader: `Approve gift for ${props.recipient_name}'s ${props.occasion}`
  });
};
