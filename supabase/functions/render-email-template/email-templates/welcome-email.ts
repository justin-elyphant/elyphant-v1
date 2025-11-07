import { baseEmailTemplate } from './base-template.ts';

export interface WelcomeEmailProps {
  first_name: string;
  gifting_url: string;
  wishlists_url: string;
}

export const welcomeEmailTemplate = (props: WelcomeEmailProps): string => {
  const content = `
    <h2 style="margin: 0 0 10px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 28px; font-weight: 700; color: #1a1a1a; line-height: 1.2;">
      Welcome to Elyphant! 🎁
    </h2>
    
    <p style="margin: 0 0 30px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 16px; color: #666666; line-height: 24px;">
      Hi ${props.first_name}, we're thrilled to have you here! Get ready to make gift-giving easier and more thoughtful than ever.
    </p>
    
    <!-- Feature highlights -->
    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 30px;">
      <tr>
        <td style="padding: 20px; background: linear-gradient(135deg, #faf5ff 0%, #f3e8ff 100%); border-radius: 8px; margin-bottom: 15px;">
          <p style="margin: 0 0 8px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 18px; color: #7c3aed; font-weight: 600;">
            📝 Create Your Wishlist
          </p>
          <p style="margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 14px; color: #6b21a8; line-height: 22px;">
            Add items you love and share them with friends and family
          </p>
        </td>
      </tr>
      <tr><td style="height: 15px;"></td></tr>
      <tr>
        <td style="padding: 20px; background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); border-radius: 8px; margin-bottom: 15px;">
          <p style="margin: 0 0 8px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 18px; color: #0ea5e9; font-weight: 600;">
            🤝 Connect with Friends
          </p>
          <p style="margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 14px; color: #0369a1; line-height: 22px;">
            Build your gift-giving network and never miss an occasion
          </p>
        </td>
      </tr>
      <tr><td style="height: 15px;"></td></tr>
      <tr>
        <td style="padding: 20px; background: linear-gradient(135deg, #fdf4ff 0%, #fae8ff 100%); border-radius: 8px;">
          <p style="margin: 0 0 8px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 18px; color: #c026d3; font-weight: 600;">
            🎯 Smart Gift Suggestions
          </p>
          <p style="margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 14px; color: #86198f; line-height: 22px;">
            Get AI-powered gift recommendations based on interests and occasions
          </p>
        </td>
      </tr>
    </table>
    
    <!-- CTA buttons -->
    <table border="0" cellpadding="0" cellspacing="0" width="100%">
      <tr>
        <td align="center" style="padding: 20px 0;">
          <a href="${props.gifting_url}" style="display: inline-block; padding: 16px 32px; background: linear-gradient(90deg, #9333ea 0%, #7c3aed 50%, #0ea5e9 100%); color: #ffffff; text-decoration: none; border-radius: 8px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 16px; font-weight: 600; margin: 0 5px 10px 5px;">
            🎁 Start Gifting Now
          </a>
          <a href="${props.wishlists_url}" style="display: inline-block; padding: 16px 32px; background-color: #ffffff; color: #9333ea; text-decoration: none; border-radius: 8px; border: 2px solid #9333ea; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 16px; font-weight: 600; margin: 0 5px 10px 5px;">
            📝 Build My Wishlist
          </a>
        </td>
      </tr>
    </table>
    
    <p style="margin: 30px 0 0 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 14px; color: #999999; line-height: 22px; text-align: center;">
      Need help getting started? Check out our <a href="https://elyphant.ai/help" style="color: #9333ea; text-decoration: underline;">help center</a>
    </p>
  `;

  return baseEmailTemplate({
    content,
    preheader: 'Welcome to Elyphant - Start your gift-giving journey today!'
  });
};
