/**
 * Connection Established Email Template
 * Merges: connection_accepted + connection_welcome
 * Sent to both parties when connection is established
 */

import { baseEmailTemplate } from './base-template.ts';

export interface ConnectionEstablishedProps {
  recipient_name: string;
  connection_name: string;
  connection_profile_url?: string;
  is_initiator?: boolean; // true if this person initiated the connection
}

export const connectionEstablishedTemplate = (props: ConnectionEstablishedProps): string => {
  const profileUrl = props.connection_profile_url || 'https://elyphant.ai/connections';
  
  // Different messaging based on who initiated
  const headline = props.is_initiator 
    ? `🎉 ${props.connection_name} accepted your connection!`
    : `Welcome to your connection with ${props.connection_name}! 🎊`;
  
  const intro = props.is_initiator
    ? "Great news! You're now connected on Elyphant."
    : "You're now connected on Elyphant. Here's how to make the most of it:";
  
  const content = `
    <h2 style="margin: 0 0 10px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 28px; font-weight: 700; color: #1a1a1a; line-height: 1.2;">
      ${headline}
    </h2>
    
    <p style="margin: 0 0 30px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 16px; color: #666666; line-height: 24px;">
      ${intro}
    </p>
    
    <!-- What's Next Section -->
    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background: linear-gradient(135deg, #faf5ff 0%, #f3e8ff 100%); border-radius: 8px; padding: 24px; margin-bottom: 30px; border-left: 4px solid #9333ea;">
      <tr>
        <td>
          <h3 style="margin: 0 0 16px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 18px; font-weight: 600; color: #6b21a8;">
            What You Can Do Now
          </h3>
          <ul style="margin: 0; padding-left: 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 14px; color: #6b21a8; line-height: 22px;">
            <li style="margin-bottom: 8px;">Browse ${props.connection_name}'s wishlist</li>
            <li style="margin-bottom: 8px;">Set up auto-gifting for special occasions</li>
            <li style="margin-bottom: 8px;">Share your own wishlist so they know what you'd love</li>
            <li style="margin-bottom: 8px;">Never miss a birthday or anniversary again!</li>
          </ul>
        </td>
      </tr>
    </table>
    
    <!-- Feature Highlights -->
    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 30px;">
      <tr>
        <td style="padding: 16px 0;">
          <table border="0" cellpadding="0" cellspacing="0" width="100%">
            <tr>
              <td width="48" valign="top">
                <div style="width: 40px; height: 40px; background: linear-gradient(135deg, #9333ea 0%, #7c3aed 100%); border-radius: 8px; text-align: center; line-height: 40px; font-size: 20px;">
                  🎁
                </div>
              </td>
              <td style="padding-left: 16px;">
                <h3 style="margin: 0 0 4px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 16px; font-weight: 600; color: #1a1a1a;">
                  Share Your Wishlist
                </h3>
                <p style="margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 14px; color: #666666; line-height: 20px;">
                  Add items you love so ${props.connection_name} knows exactly what to get you
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
      
      <tr>
        <td style="padding: 16px 0;">
          <table border="0" cellpadding="0" cellspacing="0" width="100%">
            <tr>
              <td width="48" valign="top">
                <div style="width: 40px; height: 40px; background: linear-gradient(135deg, #7c3aed 0%, #0ea5e9 100%); border-radius: 8px; text-align: center; line-height: 40px; font-size: 20px;">
                  🤖
                </div>
              </td>
              <td style="padding-left: 16px;">
                <h3 style="margin: 0 0 4px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 16px; font-weight: 600; color: #1a1a1a;">
                  Enable Auto-Gifting
                </h3>
                <p style="margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 14px; color: #666666; line-height: 20px;">
                  Never forget a special occasion - set it and we'll handle the rest
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
      
      <tr>
        <td style="padding: 16px 0;">
          <table border="0" cellpadding="0" cellspacing="0" width="100%">
            <tr>
              <td width="48" valign="top">
                <div style="width: 40px; height: 40px; background: linear-gradient(135deg, #0ea5e9 0%, #06b6d4 100%); border-radius: 8px; text-align: center; line-height: 40px; font-size: 20px;">
                  📍
                </div>
              </td>
              <td style="padding-left: 16px;">
                <h3 style="margin: 0 0 4px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 16px; font-weight: 600; color: #1a1a1a;">
                  Update Your Shipping Address
                </h3>
                <p style="margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 14px; color: #666666; line-height: 20px;">
                  Make sure gifts arrive at the right place
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
    
    <!-- CTA Button -->
    <table border="0" cellpadding="0" cellspacing="0" width="100%">
      <tr>
        <td align="center" style="padding: 20px 0;">
          <a href="${profileUrl}" style="display: inline-block; padding: 16px 40px; background: linear-gradient(90deg, #9333ea 0%, #7c3aed 50%, #0ea5e9 100%); color: #ffffff; text-decoration: none; border-radius: 8px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 16px; font-weight: 600; box-shadow: 0 4px 12px rgba(147, 51, 234, 0.3);">
            View ${props.connection_name}'s Profile
          </a>
        </td>
      </tr>
    </table>
    
    <p style="margin: 30px 0 0 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 14px; color: #999999; line-height: 20px; text-align: center;">
      Start browsing their wishlist to find the perfect gift!
    </p>
  `;

  const preheader = props.is_initiator
    ? `${props.connection_name} accepted your connection on Elyphant`
    : `You're now connected with ${props.connection_name} on Elyphant`;

  return baseEmailTemplate({
    content,
    preheader
  });
};
