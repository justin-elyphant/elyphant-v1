import { baseEmailTemplate } from './base-template.ts';

export interface ConnectionInvitationProps {
  sender_name: string;
  recipient_name: string;
  invitation_url: string;
  custom_message?: string;
}

export const connectionInvitationTemplate = (props: ConnectionInvitationProps): string => {
  const content = `
    <h2 style="margin: 0 0 10px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 28px; font-weight: 700; color: #1a1a1a; line-height: 1.2;">
      You've been invited! 🎉
    </h2>
    
    <p style="margin: 0 0 30px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 16px; color: #666666; line-height: 24px;">
      ${props.sender_name} wants to connect with you on Elyphant!
    </p>
    
    ${props.custom_message ? `
    <!-- Custom Message -->
    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #faf5ff; background: linear-gradient(135deg, #faf5ff 0%, #f3e8ff 100%); border-radius: 8px; padding: 24px; margin-bottom: 30px; border-left: 4px solid #9333ea;">
      <tr>
        <td>
          <p style="margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 14px; color: #6b21a8; font-style: italic; line-height: 22px;">
            "${props.custom_message}"
          </p>
        </td>
      </tr>
    </table>
    ` : ''}
    
    <!-- Benefits Section -->
    <h3 style="margin: 0 0 16px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 20px; font-weight: 600; color: #1a1a1a;">
      Why connect on Elyphant?
    </h3>
    
    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 30px;">
      <tr>
        <td style="padding: 12px 0;">
          <table border="0" cellpadding="0" cellspacing="0" width="100%">
            <tr>
              <td width="40" valign="top">
                <div style="width: 32px; height: 32px; background-color: #9333ea; background: linear-gradient(135deg, #9333ea 0%, #7c3aed 100%); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #ffffff; font-size: 18px;">
                  🎁
                </div>
              </td>
              <td style="padding-left: 12px;">
                <p style="margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 14px; color: #1a1a1a; font-weight: 600;">
                  Share wishlists
                </p>
                <p style="margin: 4px 0 0 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 13px; color: #666666;">
                  Never guess what to give again
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
      <tr>
        <td style="padding: 12px 0;">
          <table border="0" cellpadding="0" cellspacing="0" width="100%">
            <tr>
              <td width="40" valign="top">
                <div style="width: 32px; height: 32px; background-color: #7c3aed; background: linear-gradient(135deg, #7c3aed 0%, #0ea5e9 100%); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #ffffff; font-size: 18px;">
                  🤖
                </div>
              </td>
              <td style="padding-left: 12px;">
                <p style="margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 14px; color: #1a1a1a; font-weight: 600;">
                  Auto-gift special occasions
                </p>
                <p style="margin: 4px 0 0 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 13px; color: #666666;">
                  Set it and forget it - we'll handle the rest
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
      <tr>
        <td style="padding: 12px 0;">
          <table border="0" cellpadding="0" cellspacing="0" width="100%">
            <tr>
              <td width="40" valign="top">
                <div style="width: 32px; height: 32px; background-color: #0ea5e9; background: linear-gradient(135deg, #0ea5e9 0%, #06b6d4 100%); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #ffffff; font-size: 18px;">
                  🔔
                </div>
              </td>
              <td style="padding-left: 12px;">
                <p style="margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 14px; color: #1a1a1a; font-weight: 600;">
                  Get reminded of important dates
                </p>
                <p style="margin: 4px 0 0 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 13px; color: #666666;">
                  Never miss a birthday or anniversary
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
          <a href="${props.invitation_url}" style="display: inline-block; padding: 16px 40px; background-color: #9333ea; background: linear-gradient(90deg, #9333ea 0%, #7c3aed 50%, #0ea5e9 100%); color: #ffffff; text-decoration: none; border-radius: 8px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 16px; font-weight: 600; box-shadow: 0 4px 12px rgba(147, 51, 234, 0.3);">
            Accept Invitation
          </a>
        </td>
      </tr>
    </table>
  `;

  return baseEmailTemplate({
    content,
    preheader: `${props.sender_name} invited you to connect on Elyphant`
  });
};
