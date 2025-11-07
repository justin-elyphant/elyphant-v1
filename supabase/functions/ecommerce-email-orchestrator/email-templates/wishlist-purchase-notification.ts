/**
 * Wishlist Purchase Notification (Consolidated)
 * Merges: wishlist_item_purchased + wishlist_purchase_confirmation
 * Sent to wishlist owner when someone buys from their wishlist
 */

import { baseEmailTemplate } from './base-template.ts';

export interface WishlistPurchaseNotificationProps {
  owner_name: string;
  purchaser_name?: string;
  purchaser_user_id?: string;
  has_connection?: boolean;
  item_name: string;
  item_price?: number;
  item_image?: string;
  wishlist_title?: string;
  wishlist_url: string;
  order_number?: string;
  expected_delivery?: string;
}

export const wishlistPurchaseNotificationTemplate = (props: WishlistPurchaseNotificationProps): string => {
  const purchaserText = props.purchaser_name || 'Someone';
  const wishlistText = props.wishlist_title ? ` from your wishlist "${props.wishlist_title}"` : ' from your wishlist';
  
  const content = `
    <div style="text-align: center; margin-bottom: 30px;">
      <div style="display: inline-block; background: linear-gradient(135deg, #9333ea, #7c3aed); padding: 12px 24px; border-radius: 50px; margin-bottom: 20px;">
        <p style="margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 32px; line-height: 1;">
          🎁
        </p>
      </div>
      <h1 style="margin: 0 0 10px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 32px; font-weight: 700; color: #1a1a1a; line-height: 1.2;">
        Great News!
      </h1>
      <p style="margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 18px; color: #666666; line-height: 1.4;">
        Someone just purchased a gift for you
      </p>
    </div>

    <div style="background: linear-gradient(135deg, #faf5ff 0%, #f3e8ff 100%); border-radius: 12px; padding: 30px; margin-bottom: 30px; border: 1px solid #e9d5ff;">
      <p style="margin: 0 0 20px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 18px; color: #1a1a1a; line-height: 28px;">
        Hi <strong>${props.owner_name}</strong>,
      </p>
      <p style="margin: 0 0 20px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 16px; color: #333333; line-height: 26px;">
        <strong style="background: linear-gradient(90deg, #9333ea, #7c3aed); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">${purchaserText}</strong> just purchased an item${wishlistText}! 🎉
      </p>
    </div>

    ${props.item_image ? `
    <div style="text-align: center; margin: 32px 0;">
      <img 
        src="${props.item_image}" 
        alt="${props.item_name}" 
        style="max-width: 200px; height: auto; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);" 
      />
    </div>
    ` : ''}
    
    <div style="background-color: #f9fafb; border-radius: 8px; padding: 24px; margin: 24px 0;">
      <h3 style="margin: 0 0 12px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 18px; color: #111827;">
        Item Purchased:
      </h3>
      <p style="margin: 0 0 8px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 16px; color: #374151;">
        <strong>${props.item_name}</strong>
      </p>
      ${props.item_price ? `
        <p style="margin: 0 0 8px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 16px; color: #6B7280;">
          Price: $${Number(props.item_price).toFixed(2)}
        </p>
      ` : ''}
      ${props.expected_delivery ? `
        <p style="margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 14px; color: #6B7280;">
          Expected Delivery: ${props.expected_delivery}
        </p>
      ` : ''}
      ${props.order_number ? `
        <p style="margin: 8px 0 0 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 14px; color: #9CA3AF;">
          Order: ${props.order_number}
        </p>
      ` : ''}
    </div>
    
    <p style="margin: 24px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 16px; line-height: 1.6; color: #374151; text-align: center;">
      Your gift is on its way! You'll receive tracking details soon.
    </p>
    
    ${props.purchaser_user_id && props.has_connection ? `
      <!-- Connected User: Send Thank You Message -->
      <table border="0" cellpadding="0" cellspacing="0" width="100%">
        <tr>
          <td align="center" style="padding: 20px 0;">
            <a href="https://app.elyphant.ai/messages/${props.purchaser_user_id}" style="display: inline-block; padding: 16px 40px; background: linear-gradient(90deg, #9333ea 0%, #7c3aed 50%, #0ea5e9 100%); color: #ffffff; text-decoration: none; border-radius: 8px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 16px; font-weight: 600; box-shadow: 0 4px 12px rgba(147, 51, 234, 0.3);">
              💬 Send Thank You Message
            </a>
          </td>
        </tr>
        <tr>
          <td align="center" style="padding: 10px 0;">
            <a href="${props.wishlist_url}" style="color: #7c3aed; text-decoration: none; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 14px;">
              View Your Wishlist →
            </a>
          </td>
        </tr>
      </table>
    ` : props.purchaser_user_id && !props.has_connection ? `
      <!-- Non-Connected User: View Profile & Say Thanks -->
      <table border="0" cellpadding="0" cellspacing="0" width="100%">
        <tr>
          <td align="center" style="padding: 20px 0;">
            <a href="https://app.elyphant.ai/profile/${props.purchaser_user_id}?action=thankyou" style="display: inline-block; padding: 16px 40px; background: linear-gradient(90deg, #9333ea 0%, #7c3aed 50%, #0ea5e9 100%); color: #ffffff; text-decoration: none; border-radius: 8px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 16px; font-weight: 600; box-shadow: 0 4px 12px rgba(147, 51, 234, 0.3);">
              👋 View Their Profile & Say Thanks
            </a>
          </td>
        </tr>
        <tr>
          <td align="center" style="padding: 10px 0;">
            <a href="${props.wishlist_url}" style="color: #7c3aed; text-decoration: none; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 14px;">
              View Your Wishlist →
            </a>
          </td>
        </tr>
      </table>
    ` : `
      <!-- Anonymous Purchase: View Wishlist -->
      <table border="0" cellpadding="0" cellspacing="0" width="100%">
        <tr>
          <td align="center" style="padding: 20px 0;">
            <a href="${props.wishlist_url}" style="display: inline-block; padding: 16px 40px; background: linear-gradient(90deg, #9333ea 0%, #7c3aed 50%, #0ea5e9 100%); color: #ffffff; text-decoration: none; border-radius: 8px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 16px; font-weight: 600; box-shadow: 0 4px 12px rgba(147, 51, 234, 0.3);">
              View Your Wishlist
            </a>
          </td>
        </tr>
      </table>
    `}
    
    <p style="margin: 30px 0 0 0; text-align: center; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 14px; color: #999999; line-height: 22px;">
      Happy gifting! 🎉
    </p>
  `;

  return baseEmailTemplate({
    content,
    preheader: `${purchaserText} bought "${props.item_name}" from your wishlist! 🎁`
  });
};
