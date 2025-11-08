/**
 * Auto-Gift Rule Activated Email Template
 */

import { baseEmailTemplate } from './base-template.ts';

export interface AutoGiftRuleActivatedProps {
  recipient_name: string;
  recipient_email: string;
  rule_details: {
    occasion: string;
    budget_limit?: number;
    is_recurring: boolean;
    next_event_date?: string;
  };
  auto_approve_enabled: boolean;
}

export const autoGiftRuleActivatedTemplate = (props: AutoGiftRuleActivatedProps): string => {
  const {
    recipient_name,
    recipient_email,
    rule_details,
    auto_approve_enabled
  } = props;

  const budgetText = rule_details.budget_limit 
    ? `up to $${rule_details.budget_limit}` 
    : 'within your preferences';

  const approvalText = auto_approve_enabled
    ? 'automatically approved and sent'
    : 'sent to you for approval';

  const recurringText = rule_details.is_recurring
    ? 'annually'
    : 'for this occasion';

  const nextEventText = rule_details.next_event_date
    ? `<p style="margin: 0 0 16px 0; color: #4B5563; font-size: 14px; line-height: 1.6;">
         <strong>Next Event:</strong> ${rule_details.next_event_date}
       </p>`
    : '';

  const content = `
    <div style="text-align: center; margin-bottom: 32px;">
      <div style="font-size: 48px; margin-bottom: 16px;">✅</div>
      <h1 style="margin: 0 0 8px 0; color: #1F2937; font-size: 28px; font-weight: 700;">
        Auto-Gift Rule is Now Active!
      </h1>
      <p style="margin: 0; color: #6B7280; font-size: 16px;">
        ${recipient_name} completed their profile
      </p>
    </div>

    <div style="background: linear-gradient(135deg, #D1FAE5 0%, #A7F3D0 100%); border-radius: 12px; padding: 24px; margin-bottom: 24px;">
      <h2 style="margin: 0 0 16px 0; color: #065F46; font-size: 18px; font-weight: 600;">
        🎉 Great News!
      </h2>
      
      <p style="margin: 0; color: #047857; font-size: 14px; line-height: 1.6;">
        ${recipient_name} has completed their profile and added their shipping address. 
        Your auto-gift rule is now active and ready to go!
      </p>
    </div>

    <div style="background: #F3F4F6; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
      <h2 style="margin: 0 0 16px 0; color: #1F2937; font-size: 18px; font-weight: 600;">
        Active Rule Details
      </h2>
      
      <p style="margin: 0 0 12px 0; color: #4B5563; font-size: 14px; line-height: 1.6;">
        <strong>Recipient:</strong> ${recipient_name} (${recipient_email})
      </p>
      
      <p style="margin: 0 0 12px 0; color: #4B5563; font-size: 14px; line-height: 1.6;">
        <strong>Occasion:</strong> ${rule_details.occasion}
      </p>
      
      <p style="margin: 0 0 12px 0; color: #4B5563; font-size: 14px; line-height: 1.6;">
        <strong>Budget:</strong> ${budgetText}
      </p>
      
      ${nextEventText}
      
      <p style="margin: 0; color: #4B5563; font-size: 14px; line-height: 1.6;">
        <strong>Frequency:</strong> This gift will be sent ${recurringText}
      </p>
    </div>

    <div style="background: #EFF6FF; border-left: 4px solid #3B82F6; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
      <p style="margin: 0; color: #1E40AF; font-size: 14px; line-height: 1.6;">
        <strong>📅 What Happens Next?</strong><br>
        When the occasion arrives, our AI will select the perfect gift based on ${recipient_name}'s preferences 
        and wishlist. The gift will be ${approvalText}.
      </p>
    </div>

    <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #E5E7EB; text-align: center;">
      <p style="margin: 0; color: #6B7280; font-size: 14px; line-height: 1.6;">
        You can manage or modify this rule anytime in your Elyphant dashboard.
      </p>
    </div>
  `;

  return baseEmailTemplate({
    content,
    preheader: `Auto-gift rule for ${recipient_name} is now active!`,
    footer: 'Automated gifting made easy with Elyphant.'
  });
};
