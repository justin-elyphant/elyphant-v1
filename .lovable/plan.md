

# Enhance Auto-Gift Approval Email Template

## Problem Summary
The current auto-gift approval email has several UX issues:
1. **Subject line is generic** - "Auto-Gift Approval Needed - birthday" doesn't include the recipient's name
2. **No scheduled date shown** - Charles doesn't know when Justin's birthday is
3. **No context or next steps** - Just a product list and buttons
4. **Missing urgency indicator** - No mention of when they need to respond

## Proposed Improvements

### 1. Subject Line Enhancement
**Current:** `Auto-Gift Approval Needed - birthday`
**Proposed:** `Auto-Gift Approval Needed - Justin Meeks's Birthday 🎁`

This includes the recipient's name and capitalizes the occasion for better readability.

### 2. Enhanced Email Body Structure

**Add a "Scheduled Delivery" info card** (similar to order confirmation style):
- Event date (e.g., "February 19, 2026")
- Recipient name
- Budget limit

**Add a "Next Steps" section:**
- Explain what happens when they approve
- Explain the timeline (payment processed closer to date)
- Provide deadline context (approve by X date)

**Add a "Budget Summary" line:**
- Show the total cost of suggested gifts vs. budget

### Visual Mockup (Text Representation)
```
┌────────────────────────────────────────────┐
│ 🎁 Auto-Gift Approval Needed               │
├────────────────────────────────────────────┤
│ Hi Charles, it's time to approve your      │
│ upcoming auto-gift for Justin Meeks!       │
│                                            │
│ ┌──────────────────────────────────────┐  │
│ │ 📅 UPCOMING EVENT                     │  │
│ │ Justin Meeks's Birthday              │  │
│ │ February 19, 2026                     │  │
│ │ Budget: Up to $75.00                  │  │
│ └──────────────────────────────────────┘  │
│                                            │
│ Suggested Gifts from Wishlist:             │
│ [Product Image] TORRAS iPhone Case $42.74  │
│                                            │
│ ┌──────────────────────────────────────┐  │
│ │ 🔔 WHAT HAPPENS NEXT                  │  │
│ │ • Approve by Feb 12 to ensure delivery│  │
│ │ • We'll order the gift for you        │  │
│ │ • Payment charged 7 days before       │  │
│ │ • Gift arrives on their special day!  │  │
│ └──────────────────────────────────────┘  │
│                                            │
│ [✅ Approve Gift]  [❌ Reject]             │
│                                            │
│ Questions? Reply to this email or visit    │
│ your Recurring Gifts dashboard.            │
└────────────────────────────────────────────┘
```

---

## Implementation Details

### Files to Modify

| File | Changes |
|------|---------|
| `supabase/functions/ecommerce-email-orchestrator/index.ts` | Update subject line (line 752) + rewrite template (lines 424-456) |
| `supabase/functions/auto-gift-orchestrator/index.ts` | Add `deadline_date` field to email data (line ~207) |

### Change 1: Update Subject Line (Line 752)

```typescript
// Current
subject: `Auto-Gift Approval Needed - ${data.occasion || 'Special Occasion'}`

// Updated
subject: `Auto-Gift Approval Needed - ${data.recipient_name}'s ${formatOccasion(data.occasion)} 🎁`
```

Add a helper function to capitalize the occasion:
```typescript
const formatOccasion = (occasion: string): string => {
  if (!occasion) return 'Special Occasion';
  return occasion.replace(/_/g, ' ')
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};
```

### Change 2: Add Deadline Date to Orchestrator Payload

Calculate the approval deadline (e.g., 2 days before the scheduled checkout at T-4):
```typescript
// In auto-gift-orchestrator, add to email data:
const deadlineDate = new Date(eventDate);
deadlineDate.setDate(deadlineDate.getDate() - 5); // Approve by T-5 to process at T-4

data: {
  // ...existing fields
  deadline_date: deadlineDate.toLocaleDateString('en-US', { 
    month: 'long', 
    day: 'numeric', 
    year: 'numeric' 
  }),
}
```

### Change 3: Rewrite Email Template

The new template will include:
1. **Event Info Card** - Purple gradient card with occasion, date, and budget
2. **Suggested Gifts Section** - Existing product display (already working)
3. **What Happens Next Card** - Light blue card explaining the flow
4. **Action Buttons** - Existing approve/reject buttons
5. **Footer Help Text** - Link to dashboard

## Expected Result

**Subject:** `Auto-Gift Approval Needed - Justin Meeks's Birthday 🎁`

**Body:**
- Clear event context (who, when, budget)
- Deadline urgency (approve by Feb 12)
- Next steps explanation
- Same product display and action buttons

