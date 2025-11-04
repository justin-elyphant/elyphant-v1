/**
 * Email Templates Export - CONSOLIDATED (13 Essential Emails)
 */

export { baseEmailTemplate } from './base-template.ts';
export type { BaseTemplateProps } from './base-template.ts';

// Core E-Commerce (5)
export { orderConfirmationTemplate } from './order-confirmation.ts';
export type { OrderConfirmationProps } from './order-confirmation.ts';

export { orderStatusUpdateTemplate } from './order-status-update.ts';
export type { OrderStatusUpdateProps } from './order-status-update.ts';

export { cartAbandonedTemplate } from './cart-abandoned.ts';
export type { CartAbandonedProps } from './cart-abandoned.ts';

export { postPurchaseFollowupTemplate } from './post-purchase-followup.ts';
export type { PostPurchaseFollowupProps } from './post-purchase-followup.ts';

// Gifting Core (3)
export { giftInvitationTemplate } from './gift-invitation.ts';
export type { GiftInvitationProps } from './gift-invitation.ts';

export { autoGiftApprovalTemplate } from './auto-gift-approval.ts';
export type { AutoGiftApprovalProps } from './auto-gift-approval.ts';

export { giftPurchasedNotificationTemplate } from './gift-purchased-notification.ts';
export type { GiftPurchasedNotificationProps } from './gift-purchased-notification.ts';

// Social/Connections (2)
export { connectionInvitationTemplate } from './connection-invitation.ts';
export type { ConnectionInvitationProps } from './connection-invitation.ts';

export { connectionEstablishedTemplate } from './connection-established.ts';
export type { ConnectionEstablishedProps } from './connection-established.ts';

// Onboarding & Engagement (2)
export { welcomeEmailConsolidatedTemplate } from './welcome-email-consolidated.ts';
export type { WelcomeEmailConsolidatedProps } from './welcome-email-consolidated.ts';

export { birthdayReminderConsolidatedTemplate } from './birthday-reminder-consolidated.ts';
export type { BirthdayReminderProps } from './birthday-reminder-consolidated.ts';

// Wishlist (1)
export { wishlistPurchaseNotificationTemplate } from './wishlist-purchase-notification.ts';
export type { WishlistPurchaseNotificationProps } from './wishlist-purchase-notification.ts';
