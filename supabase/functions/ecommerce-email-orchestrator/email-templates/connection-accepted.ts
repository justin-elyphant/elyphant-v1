import { baseEmailTemplate } from './base-template.ts';

export interface ConnectionAcceptedProps {
  sender_name: string;
  acceptor_name: string;
  profile_url?: string;
}

export const connectionAcceptedTemplate = (props: ConnectionAcceptedProps): string => {
  const profileUrl = props.profile_url || 'https://elyphant.ai/connections';
  
  const content = `
    <h2 style="margin: 0 0 10px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 28px; font-weight: 700; color: #1a1a1a; line-height: 1.2;">
      🎉 ${props.acceptor_name} accepted your connection!
    </h2>
    
    <p style="margin: 0 0 30px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 16px; color: #666666; line-height: 24px;">
      Great news! You're now connected on Elyphant.
    </p>
    
    <!-- What's Next Section -->
    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background: linear-gradient(135deg, #faf5ff 0%, #f3e8ff 100%); border-radius: 8px; padding: 24px; margin-bottom: 30px; border-left: 4px solid #9333ea;">
      <tr>
        <td>
          <h3 style="margin: 0 0 16px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 18px; font-weight: 600; color: #6b21a8;">
            What's Next?
          </h3>
          <ul style="margin: 0; padding-left: 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 14px; color: #6b21a8; line-height: 22px;">
            <li style="margin-bottom: 8px;">Browse ${props.acceptor_name}'s wishlist</li>
            <li style="margin-bottom: 8px;">Set up auto-gifting for special occasions</li>
            <li style="margin-bottom: 8px;">Never miss a birthday or anniversary again!</li>
          </ul>
        </td>
      </tr>
    </table>
    
    <!-- CTA Button -->
    <table border="0" cellpadding="0" cellspacing="0" width="100%">
      <tr>
        <td align="center" style="padding: 20px 0;">
          <a href="${profileUrl}" style="display: inline-block; padding: 16px 40px; background: linear-gradient(90deg, #9333ea 0%, #7c3aed 50%, #0ea5e9 100%); color: #ffffff; text-decoration: none; border-radius: 8px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 16px; font-weight: 600; box-shadow: 0 4px 12px rgba(147, 51, 234, 0.3);">
            View ${props.acceptor_name}'s Profile
          </a>
        </td>
      </tr>
    </table>
    
    <p style="margin: 30px 0 0 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 14px; color: #999999; line-height: 20px; text-align: center;">
      Start browsing their wishlist to find the perfect gift!
    </p>
  `;

  return baseEmailTemplate({
    content,
    preheader: `${props.acceptor_name} accepted your connection on Elyphant`
  });
};
