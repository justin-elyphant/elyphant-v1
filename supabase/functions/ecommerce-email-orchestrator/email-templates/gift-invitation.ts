import { baseEmailTemplate } from './base-template.ts';

export interface GiftInvitationProps {
  sender_first_name: string;
  recipient_name: string;
  invitation_url: string;
  occasion?: string;
  custom_message?: string;
  relationship_type?: string;
  // Optional: For gift + connection request combo
  is_gift_with_connection?: boolean;
  gift_message?: string;
}

// Helper function to get personalized greeting
function getPersonalizedGreeting(senderName: string, recipientName: string, relationship?: string): string {
  const name = recipientName ? ` ${recipientName}` : '';
  
  if (!relationship) {
    return `Hi${name}, ${senderName} wants to make gift-giving easier by connecting with you on Elyphant!`;
  }
  
  // Family relationships - warm and personal
  if (['father', 'dad'].includes(relationship.toLowerCase())) {
    return `Hi Dad${name ? ` (${recipientName})` : ''}, your child ${senderName} wants to make celebrating you easier!`;
  }
  if (['mother', 'mom'].includes(relationship.toLowerCase())) {
    return `Hi Mom${name ? ` (${recipientName})` : ''}, your child ${senderName} wants to make celebrating you easier!`;
  }
  if (['son', 'daughter', 'child'].includes(relationship.toLowerCase())) {
    return `Hi${name}, your parent ${senderName} is inviting you to Elyphant to make gift-giving more meaningful!`;
  }
  if (['brother', 'sister', 'sibling'].includes(relationship.toLowerCase())) {
    return `Hi${name}, your sibling ${senderName} wants to coordinate gifts and never miss special occasions!`;
  }
  if (['uncle', 'aunt'].includes(relationship.toLowerCase())) {
    return `Hi${name}, your niece/nephew ${senderName} invited you to Elyphant!`;
  }
  if (['grandfather', 'grandmother', 'grandparent'].includes(relationship.toLowerCase())) {
    return `Hi${name}, your grandchild ${senderName} wants to stay connected and make gifting easy!`;
  }
  if (['grandson', 'granddaughter', 'grandchild'].includes(relationship.toLowerCase())) {
    return `Hi${name}, ${senderName} is inviting you to share wishlists and celebrate together!`;
  }
  if (['cousin', 'nephew', 'niece'].includes(relationship.toLowerCase())) {
    return `Hi${name}, your family member ${senderName} wants to connect on Elyphant!`;
  }
  
  // Romantic relationships - affectionate
  if (['spouse', 'partner', 'fiancé', 'fiancée'].includes(relationship.toLowerCase())) {
    return `Hi${name}, ${senderName} wants to share wishlists and make every celebration special! 💕`;
  }
  if (['boyfriend', 'girlfriend'].includes(relationship.toLowerCase())) {
    return `Hi${name}, ${senderName} invited you to Elyphant so gift-giving can be easier and more fun!`;
  }
  
  // Friends - casual and friendly
  if (['friend', 'best_friend', 'close_friend'].includes(relationship.toLowerCase())) {
    return `Hi${name}, your friend ${senderName} wants to connect on Elyphant and never miss a special occasion!`;
  }
  
  // Professional - respectful
  if (['colleague', 'coworker', 'boss', 'mentor'].includes(relationship.toLowerCase())) {
    return `Hi${name}, ${senderName} invited you to join Elyphant to coordinate gifts and celebrations!`;
  }
  
  // Default
  return `Hi${name}, ${senderName} wants to make gift-giving easier by connecting with you on Elyphant!`;
}

// Helper to get relationship-specific benefits
function getBenefitsList(relationship?: string): string[] {
  const category = getRelationshipCategory(relationship);
  
  if (category === 'family') {
    return [
      '<strong style="color: #1a1a1a;">Share wishlists</strong> across the family so everyone knows what you want',
      '<strong style="color: #1a1a1a;">Never forget</strong> birthdays, anniversaries, or special family occasions',
      '<strong style="color: #1a1a1a;">Keep addresses updated</strong> - no more asking for shipping info',
      '<strong style="color: #1a1a1a;">Coordinate gifts</strong> with other family members to avoid duplicates'
    ];
  }
  
  if (category === 'romantic') {
    return [
      '<strong style="color: #1a1a1a;">Share wishlists</strong> so you always know what makes them happy',
      '<strong style="color: #1a1a1a;">Remember anniversaries</strong> and special dates automatically',
      '<strong style="color: #1a1a1a;">Get AI suggestions</strong> for the perfect romantic gift',
      '<strong style="color: #1a1a1a;">Make every occasion</strong> memorable with thoughtful, personalized gifts'
    ];
  }
  
  if (category === 'professional') {
    return [
      '<strong style="color: #1a1a1a;">Coordinate group gifts</strong> with colleagues easily',
      '<strong style="color: #1a1a1a;">Track work celebrations</strong> like birthdays and milestones',
      '<strong style="color: #1a1a1a;">Professional gift suggestions</strong> powered by AI',
      '<strong style="color: #1a1a1a;">Easy contributions</strong> to team gifts and events'
    ];
  }
  
  // Default (friends & social)
  return [
    '<strong style="color: #1a1a1a;">Create wishlists</strong> so friends know exactly what you want',
    '<strong style="color: #1a1a1a;">Never forget</strong> birthdays, anniversaries, or special occasions',
    '<strong style="color: #1a1a1a;">Get smart suggestions</strong> powered by AI for the perfect gift',
    '<strong style="color: #1a1a1a;">Connect with loved ones</strong> and make every gift meaningful'
  ];
}

// Helper to determine relationship category
function getRelationshipCategory(relationship?: string): string {
  if (!relationship) return 'default';
  
  const rel = relationship.toLowerCase();
  
  if (['father', 'mother', 'parent', 'son', 'daughter', 'child', 'brother', 'sister', 'sibling',
       'uncle', 'aunt', 'cousin', 'nephew', 'niece', 'grandfather', 'grandmother', 'grandparent',
       'grandson', 'granddaughter', 'grandchild'].includes(rel)) {
    return 'family';
  }
  
  if (['spouse', 'partner', 'fiancé', 'fiancée', 'boyfriend', 'girlfriend'].includes(rel)) {
    return 'romantic';
  }
  
  if (['colleague', 'coworker', 'boss', 'mentor'].includes(rel)) {
    return 'professional';
  }
  
  return 'default';
}

// Helper to get subject line emoji
function getSubjectEmoji(relationship?: string): string {
  const category = getRelationshipCategory(relationship);
  
  switch (category) {
    case 'family': return '👨‍👩‍👧‍👦';
    case 'romantic': return '💕';
    case 'professional': return '🎁';
    default: return '💝';
  }
}

export const giftInvitationTemplate = (props: GiftInvitationProps): string => {
  const emoji = getSubjectEmoji(props.relationship_type);
  const greeting = props.is_gift_with_connection 
    ? `${props.sender_first_name} just sent you a gift and wants to connect with you on Elyphant!`
    : getPersonalizedGreeting(props.sender_first_name, props.recipient_name, props.relationship_type);
  const benefits = getBenefitsList(props.relationship_type);
  
  // Gift notification box (if this is a gift + connection combo)
  const giftNotificationHtml = props.is_gift_with_connection ? `
    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); padding: 24px; border-radius: 12px; margin: 24px 0; border: 2px solid #0ea5e9;">
      <tr>
        <td>
          <h3 style="margin: 0 0 16px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 18px; font-weight: 600; color: #0c4a6e;">
            📦 Your Gift is Being Prepared
          </h3>
          <p style="margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 15px; color: #0c4a6e; line-height: 1.6;">
            We're processing your gift${props.occasion ? ` for ${props.occasion}` : ''} and will send you tracking details soon!
          </p>
          ${props.gift_message ? `
            <div style="background: white; padding: 16px; border-radius: 8px; margin-top: 16px;">
              <p style="margin: 0 0 8px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 13px; color: #0369a1; text-transform: uppercase; letter-spacing: 0.5px;">
                Personal Message
              </p>
              <p style="margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 15px; color: #1e293b; font-style: italic;">
                "${props.gift_message}"
              </p>
            </div>
          ` : ''}
        </td>
      </tr>
    </table>
  ` : '';
  
  const content = `
    <h2 style="margin: 0 0 10px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 28px; font-weight: 700; color: #1a1a1a; line-height: 1.2;">
      ${props.is_gift_with_connection ? `🎁 ${props.sender_first_name} sent you a gift!` : `${props.sender_first_name} invited you to Elyphant! ${emoji}`}
    </h2>
    
    <p style="margin: 0 0 30px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 16px; color: #666666; line-height: 24px;">
      ${greeting}
    </p>
    
    ${giftNotificationHtml}
    
    ${props.occasion ? `
    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background: linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%); border-radius: 8px; padding: 20px; margin-bottom: 30px;">
      <tr>
        <td>
          <p style="margin: 0 0 5px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 12px; color: #c2410c; text-transform: uppercase; letter-spacing: 0.5px;">
            Occasion
          </p>
          <p style="margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 18px; color: #9a3412; font-weight: 600;">
            ${props.occasion}
          </p>
        </td>
      </tr>
    </table>
    ` : ''}
    
    ${props.custom_message ? `
    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f8f9fa; border-left: 4px solid #9333ea; padding: 20px; margin-bottom: 30px; border-radius: 4px;">
      <tr>
        <td>
          <p style="margin: 0 0 8px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 12px; color: #9333ea; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600;">
            Personal Message
          </p>
          <p style="margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 14px; color: #1a1a1a; line-height: 22px; font-style: italic;">
            "${props.custom_message}"
          </p>
        </td>
      </tr>
    </table>
    ` : ''}
    
    <h3 style="margin: 0 0 20px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 20px; font-weight: 600; color: #1a1a1a;">
      Why join Elyphant?
    </h3>
    
    <ul style="margin: 0 0 30px 0; padding-left: 20px;">
      ${benefits.map(benefit => `
        <li style="margin-bottom: 12px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 14px; color: #666666; line-height: 22px;">
          ${benefit}
        </li>
      `).join('')}
    </ul>
    
    <!-- CTA button -->
    <table border="0" cellpadding="0" cellspacing="0" width="100%">
      <tr>
        <td align="center" style="padding: 20px 0;">
          <a href="${props.invitation_url}" style="display: inline-block; padding: 18px 40px; background-color: #9333ea; background: linear-gradient(90deg, #9333ea 0%, #7c3aed 50%, #0ea5e9 100%); color: #ffffff; text-decoration: none; border-radius: 8px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 18px; font-weight: 600;">
            ${props.is_gift_with_connection ? 'Accept Connection & Say Thanks' : 'Accept Invitation'}
          </a>
        </td>
      </tr>
    </table>
    
    <p style="margin: 30px 0 0 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 12px; color: #999999; line-height: 20px; text-align: center;">
      Not interested? You can safely ignore this email. We won't send you anything else unless you create an account.
    </p>
  `;

  return baseEmailTemplate({
    content,
    preheader: `${props.sender_first_name} invited you to join Elyphant ${emoji}`
  });
};
