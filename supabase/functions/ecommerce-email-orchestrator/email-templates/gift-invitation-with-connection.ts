/**
 * Gift Invitation + Connection Request Email Template
 * For when someone sends a gift to a non-connected person
 */

import { baseEmailTemplate } from './base-template.ts';

export interface GiftInvitationWithConnectionProps {
  senderName: string;
  recipientName: string;
  recipientEmail: string;
  giftOccasion?: string;
  giftMessage?: string;
  signupUrl: string;
}

export const giftInvitationWithConnectionTemplate = (props: GiftInvitationWithConnectionProps): string => {
  const occasion = props.giftOccasion ? ` for ${props.giftOccasion}` : '';
  
  return baseEmailTemplate({
    preheader: `${props.senderName} sent you a gift through Elyphant!`,
    content: `
      <h1 style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 28px; font-weight: bold; color: #1a1a1a; margin: 0 0 24px 0; line-height: 1.3;">
        🎁 ${props.senderName} sent you a gift!
      </h1>
      
      <p style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 16px; color: #4a4a4a; line-height: 1.6; margin: 0 0 20px 0;">
        Hi ${props.recipientName},
      </p>
      
      <p style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 16px; color: #4a4a4a; line-height: 1.6; margin: 0 0 20px 0;">
        <strong>Great news!</strong> ${props.senderName} just sent you a gift through Elyphant${occasion}!
      </p>
      
      ${props.giftMessage ? `
        <div style="background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%); padding: 24px; border-radius: 12px; margin: 24px 0; border-left: 4px solid #9333ea;">
          <p style="margin: 0 0 12px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 15px; color: #6b7280; font-style: italic; line-height: 1.6;">
            "${props.giftMessage}"
          </p>
          <p style="margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 14px; color: #9ca3af; font-weight: 500;">
            — ${props.senderName}
          </p>
        </div>
      ` : ''}
      
      <div style="background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); padding: 24px; border-radius: 12px; margin: 32px 0; border: 2px solid #0ea5e9;">
        <h3 style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 18px; font-weight: 600; color: #0c4a6e; margin: 0 0 16px 0;">
          📦 Your Gift is Being Prepared
        </h3>
        <p style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 15px; color: #0c4a6e; line-height: 1.6; margin: 0;">
          We're processing your gift and will send you tracking details soon!
        </p>
      </div>
      
      <h3 style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 20px; font-weight: 600; color: #1a1a1a; margin: 32px 0 16px 0;">
        💜 Want to Say Thank You?
      </h3>
      
      <p style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 16px; color: #4a4a4a; line-height: 1.6; margin: 0 0 20px 0;">
        ${props.senderName} would love to connect with you on Elyphant! By accepting their connection request, you can:
      </p>
      
      <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin: 20px 0;">
        <tr>
          <td style="padding: 12px 0;">
            <table border="0" cellpadding="0" cellspacing="0">
              <tr>
                <td style="padding-right: 12px; vertical-align: top;">
                  <span style="font-size: 20px;">✨</span>
                </td>
                <td>
                  <p style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 15px; color: #4a4a4a; line-height: 1.6; margin: 0;">
                    Thank ${props.senderName} personally
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding: 12px 0;">
            <table border="0" cellpadding="0" cellspacing="0">
              <tr>
                <td style="padding-right: 12px; vertical-align: top;">
                  <span style="font-size: 20px;">📝</span>
                </td>
                <td>
                  <p style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 15px; color: #4a4a4a; line-height: 1.6; margin: 0;">
                    Share your wishlist so they always know what you'd love
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding: 12px 0;">
            <table border="0" cellpadding="0" cellspacing="0">
              <tr>
                <td style="padding-right: 12px; vertical-align: top;">
                  <span style="font-size: 20px;">🎂</span>
                </td>
                <td>
                  <p style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 15px; color: #4a4a4a; line-height: 1.6; margin: 0;">
                    Keep track of each other's special occasions
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding: 12px 0;">
            <table border="0" cellpadding="0" cellspacing="0">
              <tr>
                <td style="padding-right: 12px; vertical-align: top;">
                  <span style="font-size: 20px;">🎯</span>
                </td>
                <td>
                  <p style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 15px; color: #4a4a4a; line-height: 1.6; margin: 0;">
                    Get smart gift suggestions for future events
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
      
      <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin: 32px 0;">
        <tr>
          <td align="center">
            <a href="${props.signupUrl}" 
               style="display: inline-block; background: linear-gradient(135deg, #9333ea 0%, #7c3aed 50%, #0ea5e9 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 16px; font-weight: 600; box-shadow: 0 4px 12px rgba(147, 51, 234, 0.3);">
              Accept Connection & Say Thanks
            </a>
          </td>
        </tr>
      </table>
      
      <p style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 14px; color: #9ca3af; text-align: center; line-height: 1.6; margin: 24px 0 0 0; font-style: italic;">
        Not interested in connecting? No worries — your gift is still on the way! 💝
      </p>
    `
  });
};
