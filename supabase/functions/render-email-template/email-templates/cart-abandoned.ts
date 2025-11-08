import { baseEmailTemplate } from './base-template.ts';

export interface CartAbandonedProps {
  first_name: string;
  cart_items: Array<{
    title: string;
    price: string;
    image_url: string;
  }>;
  cart_total: string;
  cart_url: string;
}

export const cartAbandonedTemplate = (props: CartAbandonedProps): string => {
  const itemsHtml = props.cart_items.map(item => `
    <tr>
      <td style="padding: 12px 0; border-bottom: 1px solid #f0f0f0;">
        <table border="0" cellpadding="0" cellspacing="0" width="100%">
          <tr>
            <td width="80">
              <img src="${item.image_url}" alt="${item.title}" style="width: 70px; height: 70px; object-fit: cover; border-radius: 8px;">
            </td>
            <td style="padding-left: 16px;">
              <p style="margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 14px; color: #1a1a1a; font-weight: 600;">
                ${item.title}
              </p>
              <p style="margin: 5px 0 0 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 16px; color: #9333ea; font-weight: 700;">
                ${item.price}
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  `).join('');

  const content = `
    <h2 style="margin: 0 0 10px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 28px; font-weight: 700; color: #1a1a1a; line-height: 1.2;">
      Your cart is waiting! 🛒
    </h2>
    
    <p style="margin: 0 0 30px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 16px; color: #666666; line-height: 24px;">
      Hi ${props.first_name}, you left some great items in your cart. Complete your purchase before they're gone!
    </p>
    
    <!-- Cart items -->
    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background: #fafafa; border-radius: 8px; padding: 20px; margin-bottom: 30px;">
      ${itemsHtml}
      <tr>
        <td style="padding: 20px 0 0 0; text-align: right;">
          <p style="margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 18px; color: #1a1a1a; font-weight: 700;">
            Total: ${props.cart_total}
          </p>
        </td>
      </tr>
    </table>
    
    <!-- CTA Button -->
    <table border="0" cellpadding="0" cellspacing="0" width="100%">
      <tr>
        <td align="center" style="padding: 20px 0;">
          <a href="${props.cart_url}" style="display: inline-block; padding: 16px 40px; background-color: #9333ea; background: linear-gradient(90deg, #9333ea 0%, #7c3aed 50%, #0ea5e9 100%); color: #ffffff; text-decoration: none; border-radius: 8px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 16px; font-weight: 600; box-shadow: 0 4px 12px rgba(147, 51, 234, 0.3);">
            Complete Your Purchase
          </a>
        </td>
      </tr>
    </table>
    
    <p style="margin: 30px 0 0 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 14px; color: #999999; text-align: center;">
      Need help? Our support team is here for you.
    </p>
  `;

  return baseEmailTemplate({
    content,
    preheader: `${props.first_name}, your cart is waiting with ${props.cart_items.length} items`
  });
};
