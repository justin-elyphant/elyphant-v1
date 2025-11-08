/**
 * Birthday Reminder Email Template (Consolidated)
 * Merges: birthday_reminder_curated + birthday_connection_no_autogift + birthday_connection_with_autogift
 * Smart template that adapts based on context and recipient type
 */

import { baseEmailTemplate } from './base-template.ts';

export interface BirthdayReminderProps {
  recipient_name: string;
  recipient_type: 'birthday_person' | 'connection';
  birthday_person_name?: string; // Only if recipient_type is 'connection'
  birthday_person_id?: string; // User ID for profile link
  days_until?: number;
  birthday_date?: string;
  has_autogift_enabled?: boolean;
  curated_products?: Array<{
    title: string;
    price: number;
    image: string;
    product_url: string;
  }>;
  wishlist_url?: string;
  autogift_settings_url?: string;
  recipient_profile_url?: string; // Direct link to birthday person's profile
}

export const birthdayReminderConsolidatedTemplate = (props: BirthdayReminderProps): string => {
  const isBirthdayPerson = props.recipient_type === 'birthday_person';
  const daysText = props.days_until === 1 ? 'tomorrow' : `in ${props.days_until} days`;
  
  let headline: string;
  let intro: string;
  let ctaText: string;
  let ctaUrl: string;
  
  if (isBirthdayPerson) {
    // Email to the person whose birthday is coming
    headline = `Your Birthday is Coming Up! 🎂`;
    intro = `Hi ${props.recipient_name}, your special day is ${daysText}! We've curated some gift suggestions you might love to add to your wishlist.`;
    ctaText = "View My Wishlist";
    ctaUrl = props.wishlist_url || "https://elyphant.ai/wishlist";
  } else if (props.has_autogift_enabled) {
    // Email to connection who has auto-gifting set up
    headline = `${props.birthday_person_name}'s Birthday is ${daysText === 'tomorrow' ? 'Tomorrow' : 'Coming Up'} 🎁`;
    intro = `Good news! You have auto-gifting enabled for ${props.birthday_person_name}. We'll handle the gift automatically, but you can review or modify your selection anytime.`;
    ctaText = "Review Auto-Gift";
    ctaUrl = props.autogift_settings_url || "https://elyphant.ai/auto-gifting";
  } else {
    // Email to connection without auto-gifting
    headline = `${props.birthday_person_name}'s Birthday is ${daysText === 'tomorrow' ? 'Tomorrow' : 'Coming Up'} 🎉`;
    intro = `Don't forget! ${props.birthday_person_name}'s birthday is ${daysText}. Browse their wishlist and interests to find the perfect gift, or set up auto-gifting for next time.`;
    ctaText = `Shop for ${props.birthday_person_name}`;
    // Link to birthday person's profile to show wishlists and interests
    ctaUrl = props.recipient_profile_url || `https://elyphant.ai/profile/${props.birthday_person_id}` || "https://elyphant.ai/connections";
  }
  
  // Build product cards if we have curated products (for birthday person)
  const productCardsHtml = isBirthdayPerson && props.curated_products && props.curated_products.length > 0 ? `
    <div style="margin: 30px 0;">
      <h3 style="margin: 0 0 20px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 22px; font-weight: 600; color: #1a1a1a; text-align: center;">
        ✨ Birthday Gift Ideas Just for You
      </h3>
      <p style="margin: 0 0 25px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 14px; color: #666666; line-height: 22px; text-align: center;">
        Add these to your wishlist and share with friends!
      </p>
      
      <table border="0" cellpadding="0" cellspacing="0" width="100%">
        ${props.curated_products.slice(0, 4).map((product, index) => {
          const isFirstInRow = index % 2 === 0;
          const isLastInSet = index === props.curated_products!.slice(0, 4).length - 1;
          
          let html = '';
          if (isFirstInRow) html += '<tr>';
          
          html += `
            <td style="padding: 10px; width: 50%; vertical-align: top;">
              <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #fff7ed; border-radius: 8px; overflow: hidden; border: 2px solid #fed7aa;">
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
                    <p style="margin: 0 0 12px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 18px; color: #ea580c; font-weight: 700; text-align: center;">
                      $${product.price.toFixed(2)}
                    </p>
                    <div style="text-align: center;">
                      <a href="${product.product_url}" style="display: inline-block; padding: 10px 20px; background-color: #ea580c; color: #ffffff; text-decoration: none; border-radius: 6px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 13px; font-weight: 600;">
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
  
  // Auto-gift status box (for connections with auto-gifting)
  const autoGiftStatusHtml = !isBirthdayPerson && props.has_autogift_enabled ? `
    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%); border-radius: 8px; padding: 20px; margin-bottom: 30px; border-left: 4px solid #10b981;">
      <tr>
        <td>
          <p style="margin: 0 0 8px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 16px; color: #065f46; font-weight: 600;">
            ✅ Auto-Gifting is Active
          </p>
          <p style="margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 14px; color: #047857; line-height: 20px;">
            We'll automatically select and send a gift on ${props.birthday_person_name}'s birthday based on your settings.
          </p>
        </td>
      </tr>
    </table>
  ` : '';
  
  const content = `
    <h2 style="margin: 0 0 10px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 28px; font-weight: 700; color: #1a1a1a; line-height: 1.2;">
      ${headline}
    </h2>
    
    <p style="margin: 0 0 30px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 16px; color: #666666; line-height: 24px;">
      ${intro}
    </p>
    
    ${autoGiftStatusHtml}
    ${productCardsHtml}
    
    <!-- CTA Button -->
    <table border="0" cellpadding="0" cellspacing="0" width="100%">
      <tr>
        <td align="center" style="padding: 20px 0;">
          <a href="${ctaUrl}" style="display: inline-block; padding: 16px 40px; background: linear-gradient(90deg, #ea580c 0%, #f97316 50%, #fb923c 100%); color: #ffffff; text-decoration: none; border-radius: 8px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 16px; font-weight: 600; box-shadow: 0 4px 12px rgba(234, 88, 12, 0.3);">
            ${ctaText}
          </a>
        </td>
      </tr>
    </table>
    
    ${!isBirthdayPerson && !props.has_autogift_enabled ? `
      <p style="margin: 30px 0 0 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 14px; color: #999999; line-height: 20px; text-align: center;">
        Want to never miss a birthday? <a href="${props.autogift_settings_url || 'https://elyphant.ai/auto-gifting'}" style="color: #9333ea; text-decoration: underline;">Set up auto-gifting</a>
      </p>
    ` : ''}
  `;

  let preheader: string;
  if (isBirthdayPerson) {
    preheader = `Your birthday is ${daysText}! Check out these curated gift ideas 🎂`;
  } else if (props.has_autogift_enabled) {
    preheader = `${props.birthday_person_name}'s birthday is ${daysText} - Auto-gift is ready`;
  } else {
    preheader = `Reminder: ${props.birthday_person_name}'s birthday is ${daysText}`;
  }

  return baseEmailTemplate({
    content,
    preheader
  });
};
