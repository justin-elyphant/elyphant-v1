import { baseEmailTemplate } from './base-template.ts';

export interface ConnectionWelcomeProps {
  recipient_name: string;
  new_connection_name: string;
  connections_url?: string;
}

export const connectionWelcomeTemplate = (props: ConnectionWelcomeProps): string => {
  const connectionsUrl = props.connections_url || 'https://elyphant.ai/connections';
  
  const content = `
    <h2 style="margin: 0 0 10px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 28px; font-weight: 700; color: #1a1a1a; line-height: 1.2;">
      Welcome to your connection with ${props.new_connection_name}! 🎊
    </h2>
    
    <p style="margin: 0 0 30px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 16px; color: #666666; line-height: 24px;">
      You're now connected on Elyphant. Here's how to make the most of it:
    </p>
    
    <!-- Feature Highlights -->
    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 30px;">
      <tr>
        <td style="padding: 16px 0;">
          <table border="0" cellpadding="0" cellspacing="0" width="100%">
            <tr>
              <td width="48" valign="top">
                <div style="width: 40px; height: 40px; background: linear-gradient(135deg, #9333ea 0%, #7c3aed 100%); border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 20px;">
                  🎁
                </div>
              </td>
              <td style="padding-left: 16px;">
                <h3 style="margin: 0 0 4px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 16px; font-weight: 600; color: #1a1a1a;">
                  Share Your Wishlist
                </h3>
                <p style="margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 14px; color: #666666; line-height: 20px;">
                  Add items you love so ${props.new_connection_name} knows exactly what to get you
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
                <div style="width: 40px; height: 40px; background: linear-gradient(135deg, #7c3aed 0%, #0ea5e9 100%); border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 20px;">
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
                <div style="width: 40px; height: 40px; background: linear-gradient(135deg, #0ea5e9 0%, #06b6d4 100%); border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 20px;">
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
          <a href="${connectionsUrl}" style="display: inline-block; padding: 16px 40px; background: linear-gradient(90deg, #9333ea 0%, #7c3aed 50%, #0ea5e9 100%); color: #ffffff; text-decoration: none; border-radius: 8px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 16px; font-weight: 600; box-shadow: 0 4px 12px rgba(147, 51, 234, 0.3);">
            Complete Your Profile
          </a>
        </td>
      </tr>
    </table>
  `;

  return baseEmailTemplate({
    content,
    preheader: `You're now connected with ${props.new_connection_name} on Elyphant`
  });
};
