/**
 * Auto-Gift Rule Created Email Template
 */

import { baseEmailTemplate } from './base-template.ts';

export interface AutoGiftRuleCreatedProps {
  recipient_name: string;
  recipient_first_name: string;
  recipient_username?: string;
  rule_details: {
    occasion: string;
    budget_limit?: number;
    is_recurring: boolean;
    next_event_date?: string;
  };
  auto_approve_enabled: boolean;
}

export const autoGiftRuleCreatedTemplate = (props: AutoGiftRuleCreatedProps): string => {
  const {
    recipient_name,
    recipient_first_name,
    recipient_username,
    rule_details,
    auto_approve_enabled
  } = props;

  const budgetText = rule_details.budget_limit 
    ? `up to $${rule_details.budget_limit}` 
    : 'within your preferences';

  const approvalText = auto_approve_enabled
    ? 'Gifts will be automatically approved and sent.'
    : 'You will be asked to approve each gift before it is sent.';

  const recurringText = rule_details.is_recurring
    ? 'This is a recurring auto-gift that will trigger annually.'
    : 'This is a one-time auto-gift.';

  const nextEventText = rule_details.next_event_date
    ? `<p style="margin: 0 0 16px 0; color: #4B5563; font-size: 14px; line-height: 1.6;">
         <strong>Next Event:</strong> ${rule_details.next_event_date}
       </p>`
    : '';

  const content = `
    <div style="text-align: center; margin-bottom: 32px;">
      <div style="font-size: 48px; margin-bottom: 16px;">🎁</div>
      <h1 style="margin: 0 0 8px 0; color: #1F2937; font-size: 28px; font-weight: 700;">
        Auto-Gift Rule Created!
      </h1>
      <p style="margin: 0; color: #6B7280; font-size: 16px;">
        You've set up automated gifting for ${recipient_first_name}
      </p>
    </div>

    <div style="background-color: #F3F4F6; background: linear-gradient(135deg, #F3F4F6 0%, #E5E7EB 100%); border-radius: 12px; padding: 24px; margin-bottom: 24px;">
      <h2 style="margin: 0 0 16px 0; color: #1F2937; font-size: 18px; font-weight: 600;">
        Rule Details
      </h2>
      
      <p style="margin: 0 0 12px 0; color: #4B5563; font-size: 14px; line-height: 1.6;">
        <strong>Recipient:</strong> ${recipient_username ? `${recipient_name} (@${recipient_username})` : recipient_name}
      </p>
      
      <p style="margin: 0 0 12px 0; color: #4B5563; font-size: 14px; line-height: 1.6;">
        <strong>Occasion:</strong> ${rule_details.occasion}
      </p>
      
      <p style="margin: 0 0 12px 0; color: #4B5563; font-size: 14px; line-height: 1.6;">
        <strong>Budget:</strong> ${budgetText}
      </p>
      
      ${nextEventText}
      
      <p style="margin: 0 0 12px 0; color: #4B5563; font-size: 14px; line-height: 1.6;">
        ${recurringText}
      </p>
      
      <p style="margin: 0; color: #4B5563; font-size: 14px; line-height: 1.6;">
        ${approvalText}
      </p>
    </div>

    <div style="background: #FEF3C7; border-left: 4px solid #F59E0B; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
      <p style="margin: 0; color: #92400E; font-size: 14px; line-height: 1.6;">
        <strong>⏳ Waiting for Profile Completion</strong><br>
        ${recipient_first_name} needs to complete their profile (including shipping address) before the auto-gift rule becomes active. 
        We'll send you a confirmation email once they're all set up!
      </p>
    </div>

    <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #E5E7EB;">
      <p style="margin: 0 0 16px 0; color: #6B7280; font-size: 14px; line-height: 1.6;">
        What happens next?
      </p>
      <ul style="margin: 0; padding-left: 20px; color: #6B7280; font-size: 14px; line-height: 1.8;">
        <li>Your recipient will receive an invitation to complete their profile</li>
        <li>Once they add their shipping address, the auto-gift rule activates</li>
        <li>Our AI will select the perfect gift when the occasion arrives</li>
        <li>${auto_approve_enabled ? 'The gift will be automatically sent' : 'You\'ll receive an email to approve the gift'}</li>
      </ul>
    </div>
  `;

  return baseEmailTemplate({
    content,
    preheader: `Auto-gift rule created for ${recipient_first_name}`,
    footer: 'You can manage your auto-gift rules anytime in your Elyphant dashboard.'
  });
};
