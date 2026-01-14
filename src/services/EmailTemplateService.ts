import { UnifiedGiftExecution } from '@/services/UnifiedGiftManagementService';

export interface EmailTemplateData {
  recipientEmail: string;
  recipientName: string;
  giftDetails: {
    occasion: string;
    budget: number;
    selectedProducts: Array<{
      id: string;
      title: string;
      price: number;
      image: string;
      marketplace: string;
    }>;
  };
  deliveryDate?: string;
  approveUrl: string;
  rejectUrl: string;
  reviewUrl: string;
  totalAmount: number;
}

export interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

export class EmailTemplateService {
  /**
   * Generate approval email template with product images and one-click approval
   */
  static generateApprovalEmail(data: EmailTemplateData): EmailTemplate {
    const { recipientName, giftDetails, totalAmount, approveUrl, rejectUrl, reviewUrl, deliveryDate } = data;

    const subject = `🎁 Auto-Gift Approval: ${giftDetails.occasion} gift for ${recipientName}`;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Auto-Gift Approval Needed</title>
        <style>
          ${this.getEmailStyles()}
        </style>
      </head>
      <body>
        <div class="container">
          ${this.generateHeader(recipientName, giftDetails.occasion)}
          ${this.generateContent(data)}
          ${this.generateProductGrid(giftDetails.selectedProducts)}
          ${this.generateActionButtons(approveUrl, reviewUrl, rejectUrl)}
          ${this.generateInfoSection()}
          ${this.generateFooter()}
        </div>
      </body>
      </html>
    `;

    const text = this.generateTextVersion(data);

    return { subject, html, text };
  }

  /**
   * Generate reminder email template for pending approvals
   */
  static generateReminderEmail(data: EmailTemplateData & { hoursRemaining: number }): EmailTemplate {
    const { recipientName, giftDetails, hoursRemaining, approveUrl, reviewUrl, rejectUrl } = data;

    const subject = `⏰ Reminder: Auto-Gift approval expires in ${hoursRemaining} hours`;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Auto-Gift Approval Reminder</title>
        <style>
          ${this.getEmailStyles()}
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header urgent">
            <h1>⏰ Auto-Gift Approval Expiring Soon</h1>
            <p>Your gift for ${recipientName} needs approval - only ${hoursRemaining} hours remaining!</p>
          </div>
          
          <div class="content">
            <div class="urgency-alert">
              <strong>Action Required:</strong> This auto-gift approval expires in ${hoursRemaining} hours
            </div>
            
            ${this.generateContent(data)}
            ${this.generateProductGrid(giftDetails.selectedProducts)}
            ${this.generateActionButtons(approveUrl, reviewUrl, rejectUrl)}
            ${this.generateFooter()}
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `REMINDER: Auto-Gift Approval Needed\n\nYour gift for ${recipientName} expires in ${hoursRemaining} hours.\n\nApprove: ${approveUrl}\nReview: ${reviewUrl}\nReject: ${rejectUrl}`;

    return { subject, html, text };
  }

  /**
   * Generate confirmation email template for approved gifts
   */
  static generateConfirmationEmail(data: EmailTemplateData & { orderNumber?: string }): EmailTemplate {
    const { recipientName, giftDetails, totalAmount, orderNumber } = data;

    const subject = `✅ Auto-Gift Approved: ${giftDetails.occasion} gift for ${recipientName}`;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Auto-Gift Confirmation</title>
        <style>
          ${this.getEmailStyles()}
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header success">
            <h1>🎉 Auto-Gift Approved & Sent!</h1>
            <p>Your ${giftDetails.occasion} gift for ${recipientName} is being processed</p>
          </div>
          
          <div class="content">
            <div class="success-message">
              <h3>✅ What happens next?</h3>
              <ul>
                <li>Your gift is being processed and will ship soon</li>
                <li>You'll receive tracking information once shipped</li>
                <li>The recipient will receive their surprise gift on time</li>
              </ul>
            </div>
            
            <div class="order-summary">
              <h3>Order Summary</h3>
              <p><strong>Total Amount:</strong> $${totalAmount.toFixed(2)}</p>
              ${orderNumber ? `<p><strong>Order Number:</strong> ${orderNumber}</p>` : ''}
              <p><strong>Recipient:</strong> ${recipientName}</p>
              <p><strong>Occasion:</strong> ${giftDetails.occasion}</p>
            </div>
            
            ${this.generateProductGrid(giftDetails.selectedProducts)}
            ${this.generateFooter()}
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `Auto-Gift Approved!\n\nYour ${giftDetails.occasion} gift for ${recipientName} has been approved and is being processed.\n\nTotal: $${totalAmount.toFixed(2)}\n${orderNumber ? `Order: ${orderNumber}\n` : ''}`;

    return { subject, html, text };
  }

  private static getEmailStyles(): string {
    return `
      body { 
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
        margin: 0; padding: 0; background-color: #f8fafc; 
      }
      .container { 
        max-width: 600px; margin: 0 auto; background-color: white; 
      }
      .header { 
        background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); 
        color: white; padding: 24px; text-align: center; 
      }
      .header.urgent {
        background: linear-gradient(135deg, #f59e0b 0%, #ef4444 100%);
      }
      .header.success {
        background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      }
      .content { 
        padding: 24px; 
      }
      .gift-card { 
        border: 1px solid #e2e8f0; border-radius: 12px; 
        padding: 16px; margin: 16px 0; 
      }
      .product-grid { 
        display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); 
        gap: 12px; margin: 16px 0; 
      }
      .product-item { 
        text-align: center; padding: 12px; 
        border: 1px solid #e2e8f0; border-radius: 8px; 
      }
      .product-image { 
        width: 80px; height: 80px; object-fit: cover; 
        border-radius: 6px; margin: 0 auto 8px; 
      }
      .button { 
        display: inline-block; padding: 12px 24px; border-radius: 8px; 
        text-decoration: none; font-weight: 600; margin: 8px; text-align: center; 
      }
      .btn-approve { background-color: #10b981; color: white; }
      .btn-reject { background-color: #ef4444; color: white; }
      .btn-review { background-color: #6366f1; color: white; }
      .footer { 
        background-color: #f1f5f9; padding: 16px; text-align: center; 
        font-size: 14px; color: #64748b; 
      }
      .urgency, .urgency-alert { 
        background-color: #fef3c7; border: 1px solid #f59e0b; 
        border-radius: 8px; padding: 12px; margin: 16px 0; 
      }
      .success-message {
        background-color: #ecfdf5; border: 1px solid #10b981;
        border-radius: 8px; padding: 16px; margin: 16px 0;
      }
      .order-summary {
        background-color: #f8fafc; border-radius: 8px; 
        padding: 16px; margin: 16px 0;
      }
      @media (max-width: 600px) {
        .container { margin: 0; }
        .content { padding: 16px; }
        .product-grid { grid-template-columns: 1fr; }
        .button { display: block; margin: 8px 0; }
      }
    `;
  }

  private static generateHeader(recipientName: string, occasion: string): string {
    return `
      <div class="header">
        <h1>🎁 Auto-Gift Ready for Approval</h1>
        <p>Your smart gift for ${recipientName} is ready to send!</p>
      </div>
    `;
  }

  private static generateContent(data: EmailTemplateData): string {
    const { recipientName, giftDetails, totalAmount, deliveryDate } = data;
    
    return `
      <div class="content">
        <div class="urgency">
          <strong>⏰ Action Required:</strong> This auto-gift approval expires in 48 hours
        </div>
        
        <div class="gift-card">
          <h2>Gift Details</h2>
          <p><strong>Recipient:</strong> ${recipientName}</p>
          <p><strong>Occasion:</strong> ${giftDetails.occasion}</p>
          <p><strong>Budget:</strong> $${giftDetails.budget}</p>
          <p><strong>Total Amount:</strong> $${totalAmount.toFixed(2)}</p>
          ${deliveryDate ? `<p><strong>Delivery Date:</strong> ${deliveryDate}</p>` : ''}
        </div>
    `;
  }

  private static generateProductGrid(products: Array<any>): string {
    if (!products || products.length === 0) return '';

    return `
      <div class="gift-card">
        <h3>Selected Gifts</h3>
        <div class="product-grid">
          ${products.map(product => `
            <div class="product-item">
              <img src="${product.image}" alt="${product.title}" class="product-image">
              <div style="font-size: 12px; font-weight: 600; margin-bottom: 4px;">${product.title}</div>
              <div style="color: #10b981; font-weight: 600;">$${product.price.toFixed(2)}</div>
              <div style="font-size: 10px; color: #64748b;">${product.marketplace}</div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  private static generateActionButtons(approveUrl: string, reviewUrl: string, rejectUrl: string): string {
    return `
      <div style="text-align: center; margin: 24px 0;">
        <a href="${approveUrl}" class="button btn-approve">✅ APPROVE & SEND</a>
        <a href="${reviewUrl}" class="button btn-review">👀 REVIEW FIRST</a>
        <a href="${rejectUrl}" class="button btn-reject">❌ REJECT</a>
      </div>
    `;
  }

  private static generateInfoSection(): string {
    return `
      <div style="background-color: #f8fafc; padding: 16px; border-radius: 8px; margin: 16px 0;">
        <h4>What happens next?</h4>
        <ul style="margin: 0; padding-left: 20px;">
          <li><strong>Approve:</strong> Gift will be purchased and shipped immediately</li>
          <li><strong>Review:</strong> See detailed options and customize before sending</li>
          <li><strong>Reject:</strong> Cancel this auto-gift (no charges will be made)</li>
        </ul>
      </div>
    `;
  }

  private static generateFooter(): string {
    return `
      <div class="footer">
        <p>This auto-gift was created by your intelligent gift assistant.</p>
        <p>Questions? Reply to this email or check your dashboard.</p>
      </div>
    `;
  }

  private static generateTextVersion(data: EmailTemplateData): string {
    const { recipientName, giftDetails, totalAmount, approveUrl, reviewUrl, rejectUrl } = data;
    
    return `
AUTO-GIFT APPROVAL NEEDED

Your smart gift for ${recipientName} is ready to send!

GIFT DETAILS:
- Recipient: ${recipientName}
- Occasion: ${giftDetails.occasion}
- Budget: $${giftDetails.budget}
- Total Amount: $${totalAmount.toFixed(2)}

SELECTED GIFTS:
${giftDetails.selectedProducts.map(p => `- ${p.title} - $${p.price.toFixed(2)} (${p.marketplace})`).join('\n')}

ACTIONS:
Approve & Send: ${approveUrl}
Review First: ${reviewUrl}
Reject: ${rejectUrl}

This approval expires in 48 hours.

Questions? Reply to this email or check your dashboard.
    `.trim();
  }

  /**
   * Generate wishlist item purchased email (to wishlist owner)
   */
  static generateWishlistItemPurchasedEmail(data: {
    ownerName: string;
    ownerEmail: string;
    itemName: string;
    itemImage: string;
    itemPrice: number;
    purchaserName?: string;
    isAnonymous: boolean;
    wishlistUrl: string;
  }): EmailTemplate {
    const { ownerName, itemName, itemImage, itemPrice, purchaserName, isAnonymous, wishlistUrl } = data;

    const subject = `🎁 Someone purchased "${itemName}" from your wishlist!`;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Wishlist Item Purchased</title>
        <style>${this.getEmailStyles()}</style>
      </head>
      <body>
        <div class="container">
          <div class="header success">
            <h1>🎉 Great News!</h1>
            <p>Someone purchased an item from your wishlist</p>
          </div>
          
          <div class="content">
            <div class="success-message">
              <p>Hi ${ownerName},</p>
              <p>${isAnonymous ? 'Someone' : purchaserName} just purchased this item from your wishlist!</p>
            </div>
            
            <div class="product-grid">
              <div class="product-item">
                <img src="${itemImage}" alt="${itemName}" class="product-image">
                <div style="font-size: 14px; font-weight: 600; margin-top: 8px;">${itemName}</div>
                <div style="color: #10b981; font-weight: 600; margin-top: 4px;">$${itemPrice.toFixed(2)}</div>
              </div>
            </div>
            
            <div style="text-align: center; margin: 24px 0;">
              <a href="${wishlistUrl}" class="button btn-review">View Your Wishlist</a>
            </div>
          </div>
          
          ${this.generateFooter()}
        </div>
      </body>
      </html>
    `;

    const text = `Someone purchased "${itemName}" from your wishlist!\n\nPrice: $${itemPrice.toFixed(2)}\n${isAnonymous ? '' : `Purchased by: ${purchaserName}\n`}\n\nView your wishlist: ${wishlistUrl}`;

    return { subject, html, text };
  }

  /**
   * Generate purchase confirmation email (to gifter)
   */
  static generateWishlistPurchaseConfirmationEmail(data: {
    purchaserName: string;
    purchaserEmail: string;
    recipientName: string;
    itemName: string;
    itemImage: string;
    itemPrice: number;
    orderNumber?: string;
    trackingUrl?: string;
  }): EmailTemplate {
    const { purchaserName, recipientName, itemName, itemImage, itemPrice, orderNumber, trackingUrl } = data;

    const subject = `✅ Gift Purchase Confirmed: ${itemName} for ${recipientName}`;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Gift Purchase Confirmed</title>
        <style>${this.getEmailStyles()}</style>
      </head>
      <body>
        <div class="container">
          <div class="header success">
            <h1>🎁 Gift Purchase Confirmed!</h1>
            <p>Your gift for ${recipientName} is on its way</p>
          </div>
          
          <div class="content">
            <div class="success-message">
              <p>Hi ${purchaserName},</p>
              <p>Thank you for purchasing a gift from ${recipientName}'s wishlist!</p>
            </div>
            
            <div class="order-summary">
              <h3>Order Summary</h3>
              ${orderNumber ? `<p><strong>Order Number:</strong> ${orderNumber}</p>` : ''}
              <p><strong>Recipient:</strong> ${recipientName}</p>
              <p><strong>Total Amount:</strong> $${itemPrice.toFixed(2)}</p>
            </div>
            
            <div class="product-grid">
              <div class="product-item">
                <img src="${itemImage}" alt="${itemName}" class="product-image">
                <div style="font-size: 14px; font-weight: 600; margin-top: 8px;">${itemName}</div>
                <div style="color: #10b981; font-weight: 600; margin-top: 4px;">$${itemPrice.toFixed(2)}</div>
              </div>
            </div>
            
            <div style="text-align: center; margin: 24px 0;">
              ${trackingUrl ? `<a href="${trackingUrl}" class="button btn-review">Track Your Order</a>` : ''}
            </div>
          </div>
          
          ${this.generateFooter()}
        </div>
      </body>
      </html>
    `;

    const text = `Gift Purchase Confirmed!\n\nItem: ${itemName}\nRecipient: ${recipientName}\nPrice: $${itemPrice.toFixed(2)}\n${orderNumber ? `Order: ${orderNumber}\n` : ''}${trackingUrl ? `Track: ${trackingUrl}` : ''}`;

    return { subject, html, text };
  }

  /**
   * Generate weekly wishlist summary email
   */
  static generateWishlistWeeklySummaryEmail(data: {
    ownerName: string;
    ownerEmail: string;
    totalItems: number;
    purchasedCount: number;
    percentPurchased: number;
    recentPurchases: Array<{ itemName: string; purchaserName?: string; isAnonymous: boolean }>;
    wishlistUrl: string;
  }): EmailTemplate {
    const { ownerName, totalItems, purchasedCount, percentPurchased, recentPurchases, wishlistUrl } = data;

    const subject = `📊 Your Weekly Wishlist Summary - ${purchasedCount} items purchased`;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Weekly Wishlist Summary</title>
        <style>${this.getEmailStyles()}</style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📊 Your Weekly Wishlist Summary</h1>
            <p>Here's what happened this week</p>
          </div>
          
          <div class="content">
            <div class="order-summary">
              <h3>Gift Tracker Stats</h3>
              <p><strong>Total Items:</strong> ${totalItems}</p>
              <p><strong>Purchased:</strong> ${purchasedCount} (${Math.round(percentPurchased)}%)</p>
              <p><strong>Remaining:</strong> ${totalItems - purchasedCount}</p>
            </div>
            
            ${recentPurchases.length > 0 ? `
              <div class="gift-card">
                <h3>Recent Purchases</h3>
                <ul>
                  ${recentPurchases.map(p => `
                    <li>${p.itemName} ${p.isAnonymous ? '' : `- purchased by ${p.purchaserName}`}</li>
                  `).join('')}
                </ul>
              </div>
            ` : ''}
            
            <div style="text-align: center; margin: 24px 0;">
              <a href="${wishlistUrl}" class="button btn-review">Update Your Wishlist</a>
            </div>
          </div>
          
          ${this.generateFooter()}
        </div>
      </body>
      </html>
    `;

    const text = `Weekly Wishlist Summary\n\nTotal Items: ${totalItems}\nPurchased: ${purchasedCount}\n\nView wishlist: ${wishlistUrl}`;

    return { subject, html, text };
  }

  /**
   * Preview an email template (for testing and dashboard preview)
   */
  static previewTemplate(templateType: 'approval' | 'reminder' | 'confirmation' | 'wishlist_purchase' | 'wishlist_summary', data: any): EmailTemplate {
    const mockData: EmailTemplateData = {
      recipientEmail: "sarah@example.com",
      recipientName: "Sarah Johnson",
      giftDetails: {
        occasion: "Birthday",
        budget: 100,
        selectedProducts: [
          {
            id: "1",
            title: "Wireless Bluetooth Headphones",
            price: 79.99,
            image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=300&h=300&fit=crop",
            marketplace: "Amazon"
          },
          {
            id: "2", 
            title: "Coffee Table Book",
            price: 19.99,
            image: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=300&h=300&fit=crop",
            marketplace: "Barnes & Noble"
          }
        ]
      },
      deliveryDate: "2024-02-15",
      approveUrl: "#approve",
      rejectUrl: "#reject", 
      reviewUrl: "#review",
      totalAmount: 99.98,
      ...data
    };

    switch (templateType) {
      case 'approval':
        return this.generateApprovalEmail(mockData);
      case 'reminder':
        return this.generateReminderEmail({ ...mockData, hoursRemaining: 12 });
      case 'confirmation':
        return this.generateConfirmationEmail({ ...mockData, orderNumber: "ORD-20240215-1234" });
      case 'wishlist_purchase':
        return this.generateWishlistItemPurchasedEmail({
          ownerName: "Sarah",
          ownerEmail: "sarah@example.com",
          itemName: "Wireless Headphones",
          itemImage: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=300",
          itemPrice: 79.99,
          purchaserName: "John",
          isAnonymous: false,
          wishlistUrl: "#wishlist"
        });
      case 'wishlist_summary':
        return this.generateWishlistWeeklySummaryEmail({
          ownerName: "Sarah",
          ownerEmail: "sarah@example.com",
          totalItems: 12,
          purchasedCount: 3,
          percentPurchased: 25,
          recentPurchases: [
            { itemName: "Wireless Headphones", purchaserName: "John", isAnonymous: false },
            { itemName: "Coffee Table Book", isAnonymous: true }
          ],
          wishlistUrl: "#wishlist"
        });
      default:
        return this.generateApprovalEmail(mockData);
    }
  }
}