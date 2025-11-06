import { baseEmailTemplate } from './base-template.ts';

export interface NudgeReminderProps {
  shopper_name: string;
  recipient_name: string;
  recipient_email: string;
  days_since_invitation: number;
  connections_url: string;
}

export const nudgeReminderTemplate = (props: NudgeReminderProps): string => {
  const content = `
    <h2 style="margin: 0 0 10px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 28px; font-weight: 700; color: #1a1a1a; line-height: 1.2;">
      Pending Connection Update 📬
    </h2>
    
    <p style="margin: 0 0 20px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 16px; color: #666666; line-height: 24px;">
      Hi ${props.shopper_name},
    </p>
    
    <p style="margin: 0 0 30px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 16px; color: #666666; line-height: 24px;">
      Just a heads up - ${props.recipient_name} (${props.recipient_email}) hasn't accepted your connection invitation yet. It's been ${props.days_since_invitation} days since you sent it.
    </p>
    
    <!-- Info Box -->
    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); border-radius: 8px; padding: 24px; margin-bottom: 30px; border-left: 4px solid #f59e0b;">
      <tr>
        <td>
          <p style="margin: 0 0 12px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 14px; color: #92400e; font-weight: 600;">
            💡 What you can do:
          </p>
          <ul style="margin: 0; padding-left: 20px;">
            <li style="margin: 6px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 14px; color: #92400e; line-height: 20px;">
              Reach out directly to remind them
            </li>
            <li style="margin: 6px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 14px; color: #92400e; line-height: 20px;">
              Check if they received the email (it might be in spam)
            </li>
            <li style="margin: 6px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 14px; color: #92400e; line-height: 20px;">
              We'll send them automatic reminders at key intervals
            </li>
          </ul>
        </td>
      </tr>
    </table>
    
    <p style="margin: 0 0 30px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 14px; color: #999999; line-height: 22px;">
      Don't worry - we've sent them a reminder email on your behalf. They'll receive a couple more gentle nudges if they still haven't responded.
    </p>
    
    <!-- CTA Button -->
    <table border="0" cellpadding="0" cellspacing="0" width="100%">
      <tr>
        <td align="center" style="padding: 20px 0;">
          <a href="${props.connections_url}" style="display: inline-block; padding: 16px 40px; background: linear-gradient(90deg, #9333ea 0%, #7c3aed 50%, #0ea5e9 100%); color: #ffffff; text-decoration: none; border-radius: 8px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 16px; font-weight: 600; box-shadow: 0 4px 12px rgba(147, 51, 234, 0.3);">
            View Pending Connections
          </a>
        </td>
      </tr>
    </table>
  `;

  return baseEmailTemplate({
    content,
    preheader: `${props.recipient_name} hasn't accepted your connection invitation yet`
  });
};