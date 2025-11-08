/**
 * Consolidated Welcome Email Template
 * Merges: welcome_email + welcome_with_suggestions + wishlist_welcome
 * Smart template that adapts based on available data
 */

import { baseEmailTemplate } from './base-template.ts';

export interface WelcomeEmailConsolidatedProps {
  first_name: string;
  gifting_url?: string;
  wishlists_url?: string;
  suggested_products?: Array<{
    title: string;
    price: number;
    image: string;
    product_url: string;
  }>;
  signup_context?: 'wishlist' | 'gift' | 'invitation' | 'direct';
}

export const welcomeEmailConsolidatedTemplate = (props: WelcomeEmailConsolidatedProps): string => {
  const hasProducts = props.suggested_products && props.suggested_products.length > 0;
  
  // Context-specific greeting
  let contextMessage = "we're thrilled to have you here! Get ready to make gift-giving easier and more thoughtful than ever.";
  if (props.signup_context === 'wishlist') {
    contextMessage = "let's get your wishlist set up so friends and family always know what you'd love!";
  } else if (props.signup_context === 'gift') {
    contextMessage = "welcome! Someone special wants to send you gifts you'll actually love.";
  } else if (props.signup_context === 'invitation') {
    contextMessage = "welcome to your new gifting network! Let's make every occasion special.";
  }
  
  // Build product cards HTML if we have suggestions
  const productCardsHtml = hasProducts ? `
    <div style="margin: 30px 0;">
      <h3 style="margin: 0 0 20px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 22px; font-weight: 600; color: #1a1a1a; text-align: center;">
        ✨ Get Started with These Popular Picks
      </h3>
      <p style="margin: 0 0 25px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 14px; color: #666666; line-height: 22px; text-align: center;">
        Add these trending gifts to your wishlist
      </p>
      
      <table border="0" cellpadding="0" cellspacing="0" width="100%">
        ${props.suggested_products!.slice(0, 4).map((product, index) => {
          const isFirstInRow = index % 2 === 0;
          const isLastInSet = index === props.suggested_products!.slice(0, 4).length - 1;
          
          let html = '';
          if (isFirstInRow) html += '<tr>';
          
          html += `
            <td style="padding: 10px; width: 50%; vertical-align: top;">
              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #fafafa; border-radius: 8px; overflow: hidden; border: 1px solid #e5e5e5;">
                <tr>
                  <td style="padding: 15px;">
                    <div style="text-align: center; margin-bottom: 12px;">
                      <img 
                        src="${product.image}" 
                        alt="${product.title.substring(0, 50)}"
                        style="width: 140px; height: 140px; object-fit: cover; border-radius: 6px; display: block; margin: 0 auto;"
                      />
                    </div>
                    <p style="margin: 0 0 8px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 14px; color: #1a1a1a; font-weight: 500; line-height: 18px; height: 36px; overflow: hidden; text-align: center;">
                      ${product.title.substring(0, 50)}${product.title.length > 50 ? '...' : ''}
                    </p>
                    <p style="margin: 0 0 12px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 18px; color: #9333ea; font-weight: 700; text-align: center;">
                      $${product.price.toFixed(2)}
                    </p>
                    <div style="text-align: center;">
                      <a href="${product.product_url}" style="display: inline-block; padding: 10px 20px; background-color: #9333ea; color: #ffffff; text-decoration: none; border-radius: 6px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 13px; font-weight: 600;">
                        Add to Wishlist
                      </a>
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          `;
          
          if (!isFirstInRow || isLastInSet) html += '</tr>';
          if (!isFirstInRow && !isLastInSet) html += '<tr><td colspan="2" style="height: 10px;"></td></tr>';
          
          return html;
        }).join('')}
      </table>
    </div>
  ` : '';

  const content = `
    <h2 style="margin: 0 0 10px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 28px; font-weight: 700; color: #1a1a1a; line-height: 1.2;">
      Welcome to Elyphant! 🎁
    </h2>
    
    <p style="margin: 0 0 30px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 16px; color: #666666; line-height: 24px;">
      Hi ${props.first_name}, ${contextMessage}
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
    
    ${productCardsHtml}
    
    <!-- CTA buttons -->
    <table border="0" cellpadding="0" cellspacing="0" width="100%">
      <tr>
        <td align="center" style="padding: 20px 0;">
          <a href="${props.gifting_url || 'https://elyphant.ai/gifting'}" style="display: inline-block; padding: 16px 32px; background: linear-gradient(90deg, #9333ea 0%, #7c3aed 50%, #0ea5e9 100%); color: #ffffff; text-decoration: none; border-radius: 8px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 16px; font-weight: 600; margin: 0 5px 10px 5px;">
            Start Gifting
          </a>
          <a href="${props.wishlists_url || 'https://elyphant.ai/wishlists'}" style="display: inline-block; padding: 16px 32px; background-color: #ffffff; color: #9333ea; text-decoration: none; border-radius: 8px; border: 2px solid #9333ea; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 16px; font-weight: 600; margin: 0 5px 10px 5px;">
            📝 Build My Wishlist
          </a>
        </td>
      </tr>
    </table>
    
    <p style="margin: 30px 0 0 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 14px; color: #999999; line-height: 22px; text-align: center;">
      Need help getting started? Check out our <a href="https://elyphant.ai/help" style="color: #9333ea; text-decoration: underline;">help center</a>
    </p>
  `;

  const preheaderText = hasProducts 
    ? 'Welcome to Elyphant - Check out these curated gift suggestions!'
    : 'Welcome to Elyphant - Start your gift-giving journey today!';

  return baseEmailTemplate({
    content,
    preheader: preheaderText
  });
};
