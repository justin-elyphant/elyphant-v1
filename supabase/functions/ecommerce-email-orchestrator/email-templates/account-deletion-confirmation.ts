import { baseEmailTemplate } from './base-template.ts';

export interface AccountDeletionConfirmationProps {
  first_name: string;
  email: string;
  deletion_timestamp: string;
}

export const accountDeletionConfirmationTemplate = (props: AccountDeletionConfirmationProps): string => {
  // Format the deletion timestamp
  const deletionDate = new Date(props.deletion_timestamp);
  const formattedDate = deletionDate.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZoneName: 'short'
  });

  const content = `
    <h2 style="margin: 0 0 10px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 28px; font-weight: 700; color: #1a1a1a; line-height: 1.2;">
      Account Successfully Deleted
    </h2>
    
    <p style="margin: 0 0 30px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 16px; color: #666666; line-height: 24px;">
      Hi ${props.first_name}, we're confirming that your Elyphant account has been permanently deleted as of ${formattedDate}.
    </p>
    
    <!-- Deletion Summary -->
    <h3 style="margin: 0 0 16px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 20px; font-weight: 600; color: #1a1a1a;">
      What Was Deleted
    </h3>
    
    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 30px; background-color: #f9fafb; border-radius: 8px; padding: 20px;">
      <tr>
        <td>
          <ul style="margin: 0; padding: 0 0 0 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 14px; color: #1a1a1a; line-height: 24px;">
            <li>Your profile and personal information</li>
            <li>All connections and relationships</li>
            <li>Wishlists and saved items</li>
            <li>Auto-gift rules and preferences</li>
            <li>Shopping cart and order history</li>
            <li>Saved payment methods</li>
            <li>Email preferences and notifications</li>
            <li>All associated account data</li>
          </ul>
        </td>
      </tr>
    </table>
    
    <!-- Legal Compliance Disclosure -->
    <h3 style="margin: 0 0 16px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 20px; font-weight: 600; color: #1a1a1a;">
      Data Retention for Legal Compliance
    </h3>
    
    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 30px; background-color: #fffbeb; border-radius: 8px; padding: 20px; border-left: 4px solid #f59e0b;">
      <tr>
        <td>
          <p style="margin: 0 0 12px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 14px; color: #92400e; line-height: 22px;">
            While your personal identifiable information has been deleted immediately, we may retain certain records as required by law:
          </p>
          <ul style="margin: 0; padding: 0 0 0 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 13px; color: #92400e; line-height: 22px;">
            <li><strong>Transaction records:</strong> Retained for 7 years (tax compliance)</li>
            <li><strong>Security logs:</strong> Retained for 2 years (fraud prevention)</li>
            <li><strong>Legal documentation:</strong> As required by applicable laws</li>
          </ul>
          <p style="margin: 12px 0 0 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 13px; color: #92400e; line-height: 22px;">
            These retained records are anonymized and cannot be linked back to you personally. This retention is required under GDPR Article 17(3)(b), CCPA Section 1798.105(d), and various financial regulations.
          </p>
        </td>
      </tr>
    </table>
    
    <!-- Accidental Deletion Warning -->
    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 30px; background-color: #fef2f2; border-radius: 8px; padding: 20px; border-left: 4px solid #ef4444;">
      <tr>
        <td>
          <p style="margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 14px; color: #991b1b; line-height: 22px;">
            <strong>⚠️ Accidental Deletion?</strong><br/>
            If you did not request this deletion or this was a mistake, please contact our support team immediately at <a href="mailto:support@elyphant.ai" style="color: #dc2626; text-decoration: underline;">support@elyphant.ai</a>. We may be able to help within 24 hours.
          </p>
        </td>
      </tr>
    </table>
    
    <!-- Future Access -->
    <h3 style="margin: 0 0 16px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 20px; font-weight: 600; color: #1a1a1a;">
      Come Back Anytime
    </h3>
    
    <p style="margin: 0 0 20px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 14px; color: #666666; line-height: 22px;">
      We're sorry to see you go, but we understand. If you ever change your mind, you're always welcome to create a new account at <a href="https://elyphant.ai" style="color: #9333ea; text-decoration: underline;">elyphant.ai</a>. Your fresh start will be waiting for you.
    </p>
    
    <!-- Thank You Message -->
    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-top: 30px; padding-top: 30px; border-top: 1px solid #e5e7eb;">
      <tr>
        <td>
          <p style="margin: 0 0 12px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 14px; color: #666666; line-height: 22px;">
            Thank you for being part of the Elyphant community. We hope we made gifting a little easier and more meaningful during your time with us.
          </p>
          <p style="margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 14px; color: #666666; line-height: 22px;">
            Take care,<br/>
            <strong style="color: #1a1a1a;">The Elyphant Team</strong>
          </p>
        </td>
      </tr>
    </table>
    
    <!-- Legal Footer -->
    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
      <tr>
        <td>
          <p style="margin: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 11px; color: #9ca3af; line-height: 18px; text-align: center;">
            This deletion was performed in compliance with GDPR, CCPA, and applicable data protection regulations.<br/>
            Your data subject rights have been honored in accordance with Article 17 (Right to Erasure) of GDPR<br/>
            and Section 1798.105 (Right to Delete) of CCPA.
          </p>
        </td>
      </tr>
    </table>
  `;

  return baseEmailTemplate({
    content,
    preheader: `Your Elyphant account has been permanently deleted as of ${formattedDate}`
  });
};
