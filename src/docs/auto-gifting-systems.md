
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

**Database Tables**:
- `orders` - Contains `scheduled_delivery_date` and `gift_options`
- `order_items` - Individual item scheduling data

**User Journey**:
1. User adds items to cart
2. User proceeds to checkout
3. User selects "Schedule for Later" option
4. User chooses delivery date and gift options
5. Order is placed with scheduling information

**Files**:
- `/src/components/marketplace/checkout/GiftScheduleForm.tsx`
- `/src/components/cart/RecipientAssignmentSection.tsx`
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

### Future Consolidation
Consider creating a unified `GiftTimingService` that handles:
- Event-based automation triggers
- Manual scheduling requests
- Shared notification preferences
- Cross-system budget tracking
