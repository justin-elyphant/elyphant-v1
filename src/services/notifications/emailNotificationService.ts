import { supabase } from "@/integrations/supabase/client";

export interface EmailNotificationData {
  recipientEmail: string;
  subject: string;
  htmlContent: string;
  recipientName?: string;
  notificationType: 'auto_gift_approval' | 'auto_gift_confirmation' | 'gift_delivered' | 'general';
}

export interface AutoGiftApprovalData {
  recipientName: string;
  giftSuggestion: string;
  occasion: string;
  budget: string;
  deliveryDate: string;
  approvalUrl: string;
  userFirstName: string;
}

export const emailNotificationService = {
  async sendAutoGiftApproval(userEmail: string, data: AutoGiftApprovalData): Promise<{ success: boolean; error?: string }> {
    try {
      const emailData: EmailNotificationData = {
        recipientEmail: userEmail, // User's email address
        subject: `Nicole found the perfect gift for ${data.recipientName}! 🎁`,
        htmlContent: this.generateAutoGiftApprovalEmail(data),
        notificationType: 'auto_gift_approval'
      };

      const { data: result, error } = await supabase.functions.invoke('send-email-notification', {
        body: emailData
      });

      if (error) {
        console.error('Email notification error:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Email service error:', error);
      return { success: false, error: 'Failed to send email notification' };
    }
  },

  generateAutoGiftApprovalEmail(data: AutoGiftApprovalData): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Gift Approval Required</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #8B5CF6, #EC4899); color: white; padding: 30px; text-align: center; border-radius: 12px 12px 0 0; }
          .content { background: white; padding: 30px; border: 1px solid #e5e7eb; }
          .gift-details { background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .button { background: linear-gradient(135deg, #8B5CF6, #EC4899); color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 600; }
          .footer { background: #f9fafb; padding: 20px; text-align: center; color: #6b7280; font-size: 14px; border-radius: 0 0 12px 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎁 Nicole Found the Perfect Gift!</h1>
            <p>Hi ${data.userFirstName}, your auto-gift is ready for approval</p>
          </div>
          
          <div class="content">
            <p>Great news! I've found the perfect gift for <strong>${data.recipientName}</strong>'s ${data.occasion.toLowerCase()}.</p>
            
            <div class="gift-details">
              <h3>📦 Gift Details</h3>
              <p><strong>For:</strong> ${data.recipientName}</p>
              <p><strong>Occasion:</strong> ${data.occasion}</p>
              <p><strong>Gift:</strong> ${data.giftSuggestion}</p>
              <p><strong>Budget:</strong> ${data.budget}</p>
              <p><strong>Delivery Date:</strong> ${data.deliveryDate}</p>
            </div>
            
            <p>Ready to send this thoughtful gift? Just click the button below to approve and I'll handle everything else - from purchase to delivery! 🚀</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${data.approvalUrl}" class="button">Approve This Gift</a>
            </div>
            
            <p style="font-size: 14px; color: #6b7280;">
              You can also review and modify the gift details by visiting your dashboard. This auto-gift will expire if not approved within 48 hours.
            </p>
          </div>
          
          <div class="footer">
            <p>This email was sent by Nicole, your AI Gift Assistant</p>
            <p>© ${new Date().getFullYear()} Your Gift Platform. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  },

  async sendGiftConfirmation(data: any): Promise<{ success: boolean; error?: string }> {
    // Implementation for confirmation emails
    return { success: true };
  },

  async sendGiftDelivered(data: any): Promise<{ success: boolean; error?: string }> {
    // Implementation for delivery confirmations
    return { success: true };
  }
};