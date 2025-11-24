import { supabase } from "@/integrations/supabase/client";

export interface EmailNotificationData {
  recipientEmail: string;
  subject: string;
  htmlContent: string;
  recipientName?: string;
  notificationType: 'auto_gift_approval' | 'auto_gift_confirmation' | 'gift_delivered' | 'welcome_wishlist' | 'general';
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

export interface WelcomeWishlistData {
  userFirstName: string;
  userEmail: string;
  inviterName?: string;
  recommendations: Array<{
    id: string;
    title: string;
    description: string;
    price: number;
    imageUrl?: string;
    category: string;
    matchReason: string;
    addToWishlistUrl: string;
  }>;
  marketplaceUrl: string;
  profileUrl: string;
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

      const { data: result, error } = await supabase.functions.invoke('ecommerce-email-orchestrator', {
        body: {
          eventType: 'auto_gift_approval',
          customData: emailData
        }
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
          .header { background: linear-gradient(90deg, #9333ea 0%, #7c3aed 50%, #0ea5e9 100%); color: white; padding: 30px; text-align: center; border-radius: 12px 12px 0 0; }
          .content { background: white; padding: 30px; border: 1px solid #e5e7eb; }
          .gift-details { background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .button { background: linear-gradient(90deg, #9333ea 0%, #7c3aed 50%, #0ea5e9 100%); color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 600; }
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

  async sendWelcomeWishlist(data: WelcomeWishlistData): Promise<{ success: boolean; error?: string }> {
    try {
      const emailData: EmailNotificationData = {
        recipientEmail: data.userEmail,
        subject: `${data.inviterName ? `${data.inviterName} invited you - ` : ''}Nicole picked these just for you! 🎁`,
        htmlContent: this.generateWelcomeWishlistEmail(data),
        recipientName: data.userFirstName,
        notificationType: 'welcome_wishlist'
      };

      const { data: result, error } = await supabase.functions.invoke('ecommerce-email-orchestrator', {
        body: {
          eventType: 'wishlist_welcome',
          customData: emailData
        }
      });

      if (error) {
        console.error('Welcome wishlist email error:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Welcome wishlist email service error:', error);
      return { success: false, error: 'Failed to send welcome wishlist email' };
    }
  },

  generateWelcomeWishlistEmail(data: WelcomeWishlistData): string {
    const inviterMessage = data.inviterName 
      ? `<p style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;"><strong>💫 Welcome from ${data.inviterName}!</strong><br>Since ${data.inviterName} invited you to Elyphant, I thought you'd love to see some gift ideas they might enjoy too!</p>`
      : '';

    const productCards = data.recommendations.map(product => `
      <div style="border: 1px solid #e5e7eb; border-radius: 12px; padding: 20px; margin: 15px 0; background: white;">
        <div style="display: flex; align-items: start; gap: 15px;">
          ${product.imageUrl ? `<img src="${product.imageUrl}" alt="${product.title}" style="width: 80px; height: 80px; object-fit: cover; border-radius: 8px; flex-shrink: 0;">` : ''}
          <div style="flex: 1;">
            <h3 style="margin: 0 0 8px 0; color: #374151; font-size: 16px; font-weight: 600;">${product.title}</h3>
            <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 14px;">${product.description}</p>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 12px;">
              <div>
                <span style="color: #8B5CF6; font-weight: 600; font-size: 18px;">$${product.price}</span>
                <span style="color: #6b7280; font-size: 12px; margin-left: 8px;">${product.category}</span>
              </div>
              <a href="${product.addToWishlistUrl}" style="background: linear-gradient(135deg, #8B5CF6, #EC4899); color: white; padding: 8px 16px; text-decoration: none; border-radius: 6px; font-size: 14px; font-weight: 500;">Add to Wishlist</a>
            </div>
            <p style="margin: 8px 0 0 0; color: #059669; font-size: 12px; font-style: italic;">💡 ${product.matchReason}</p>
          </div>
        </div>
      </div>
    `).join('');

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Your Starter Wishlist is Ready!</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(90deg, #9333ea 0%, #7c3aed 50%, #0ea5e9 100%); color: white; padding: 30px; text-align: center; border-radius: 12px 12px 0 0; }
          .content { background: white; padding: 30px; border: 1px solid #e5e7eb; }
          .button { background: linear-gradient(90deg, #9333ea 0%, #7c3aed 50%, #0ea5e9 100%); color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 600; margin: 10px 5px; }
          .secondary-button { background: white; color: #8B5CF6; border: 2px solid #8B5CF6; padding: 10px 22px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: 600; margin: 10px 5px; }
          .footer { background: #f9fafb; padding: 20px; text-align: center; color: #6b7280; font-size: 14px; border-radius: 0 0 12px 12px; }
          .stats-box { background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center; }
          @media (max-width: 600px) {
            .container { padding: 10px; }
            .content { padding: 20px; }
            .button, .secondary-button { display: block; margin: 10px 0; text-align: center; }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✨ Welcome to Elyphant, ${data.userFirstName}!</h1>
            <p>Nicole here! I've curated a special starter wishlist just for you 🎁</p>
          </div>
          
          <div class="content">
            ${inviterMessage}
            
            <p>Welcome to the future of gift-giving! I'm Nicole, your AI gift assistant, and I'm thrilled you've joined our community. To get you started, I've hand-picked some amazing items that I think you'll love.</p>
            
            <div class="stats-box">
              <h3 style="margin: 0 0 10px 0; color: #374151;">🎯 Your Starter Collection</h3>
              <p style="margin: 0; color: #6b7280;">Curated based on popular trends and diverse interests</p>
            </div>

            <h2 style="color: #374151; margin: 30px 0 20px 0;">Nicole's Welcome Picks for You</h2>
            
            ${productCards}
            
            <div style="text-align: center; margin: 40px 0;">
              <a href="${data.marketplaceUrl}" class="button">Explore Full Marketplace</a>
              <a href="${data.profileUrl}" class="secondary-button">Complete Your Profile</a>
            </div>
            
            <div style="background: #fef3cd; border: 1px solid #f59e0b; border-radius: 8px; padding: 20px; margin: 30px 0;">
              <h3 style="margin: 0 0 10px 0; color: #92400e;">💡 Pro Tips for New Users:</h3>
              <ul style="margin: 0; padding-left: 20px; color: #92400e;">
                <li>Add items to your wishlist so friends and family know what you'd love</li>
                <li>Connect with friends to see their wishlists and get gift inspiration</li>
                <li>Use Nicole (that's me!) anytime you need gift recommendations</li>
                <li>Set up auto-gifting for important dates so you never miss an occasion</li>
              </ul>
            </div>
            
            <p style="color: #6b7280; font-size: 14px;">
              This is just the beginning! As you use Elyphant more, I'll learn your preferences and provide even better recommendations. Questions? Just reply to this email - I'm always here to help! 💜
            </p>
          </div>
          
          <div class="footer">
            <p>This email was sent by Nicole, your AI Gift Assistant</p>
            <p>© ${new Date().getFullYear()} Elyphant. Making gift-giving effortless.</p>
            <p style="font-size: 12px; margin-top: 15px;">
              <a href="#" style="color: #6b7280; text-decoration: none;">Unsubscribe</a> | 
              <a href="#" style="color: #6b7280; text-decoration: none;">Update Preferences</a>
            </p>
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