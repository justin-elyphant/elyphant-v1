
# Auto-Gifting Systems Documentation

This application has two distinct gifting automation systems that serve different purposes:

## 1. Automated Event Gifting System
**Purpose**: Prevents forgotten gifts by automatically purchasing gifts based on pre-configured rules when special events occur.

**Key Features**:
- Rule-based automation triggered by calendar events
- Budget limits and notification preferences
- AI or wishlist-based gift selection
- Requires user setup and approval settings

**Database Tables**:
- `auto_gifting_rules` - Individual automation rules
- `auto_gifting_settings` - User preferences and defaults
- `user_special_dates` - Events that trigger automation

**User Journey**:
1. User sets up events (birthdays, anniversaries, etc.)
2. User configures auto-gifting rules for specific events
3. System monitors upcoming events
4. System automatically purchases gifts based on rules
5. User receives notifications (optional)

**Files**:
- `/src/components/gifting/events/automated-tab/`
- `/src/hooks/useAutoGifting.ts`
- `/src/services/autoGiftingService.ts`

## 2. Manual Gift Scheduling System  
**Purpose**: Allows users to schedule gift delivery timing during the checkout process.

**Key Features**:
- User-initiated during checkout
- Flexible delivery date selection
- Gift message customization
- Surprise gift options
- **Recipient-owned address data** - New users provide their own shipping address during signup

**Database Tables**:
- `orders` - Contains `scheduled_delivery_date` and `gift_options`
- `order_items` - Individual item scheduling data
- `user_connections` - Contains `pending_shipping_address` (nullable), `invitation_reminder_count`, `last_reminder_sent_at`

**User Journey**:
1. User adds items to cart
2. User proceeds to checkout
3. User selects "Schedule for Later" option
4. User chooses delivery date and gift options
5. **NEW**: For new recipients, only name + email are collected (address provided during signup)
6. Order is placed with scheduling information

**Files**:
- `/src/components/marketplace/checkout/GiftScheduleForm.tsx`
- `/src/components/cart/RecipientAssignmentSection.tsx`
- `/src/components/cart/UnifiedRecipientSelection.tsx`
- `/src/types/gift-scheduling.ts`

## Integration Opportunities

### Shared Components
- Notification systems could be unified
- Budget tracking could span both systems
- Gift selection logic could be shared

### Terminology Standardization
- "Auto-Gifting" = Event-based automation system
- "Gift Scheduling" = Checkout-time delivery scheduling
- "Delivery Scheduling" = Alternative term for checkout scheduling
- "Recipient-Owned Addresses" = New users provide their own shipping data during signup

### Address Data Ownership Strategy
**New Approach (Implemented 2025-01-24)**:
- Shoppers provide only name + email for new recipients
- Recipients provide their own shipping address during signup
- `user_connections.pending_shipping_address` is now NULLABLE
- Invitation reminder system sends follow-ups at 3, 7, 14 days
- Gifts are held until recipient completes signup and provides address

**Benefits**:
- Simplified UX for shoppers (no address entry)
- More accurate addresses (self-reported)
- Reduces data entry errors
- Recipient maintains control of their shipping data

### Email Reminder System
**Edge Function**: `send-invitation-reminders`
- Runs daily via cron job
- Sends reminders to pending invitations at 3, 7, 14 days
- Notifies shoppers after 7 days if recipient hasn't responded
- Tracks reminder count in `user_connections.invitation_reminder_count`

### Future Consolidation
Consider creating a unified `GiftTimingService` that handles:
- Event-based automation triggers
- Manual scheduling requests
- Shared notification preferences
- Cross-system budget tracking
- Invitation follow-up coordination
