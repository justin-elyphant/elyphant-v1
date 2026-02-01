
# Fix Gift Occasion Selector to Show Recipient's Important Dates

## Problem Identified
The "Select Gift Occasions" screen in the recurring gift wizard shows generic event types (Birthday, Anniversary, etc.) but does NOT reference the selected recipient's actual "My Events" data (Justin's February 19 birthday, anniversaries, promotions, etc.).

**Current behavior:** Charles sees generic checkboxes for "Birthday", "Anniversary", etc.
**Expected behavior:** Charles should see Justin's actual events with dates:
- ✅ "Birthday - February 19"
- ✅ "Promotion - [if Justin has one]"
- ✅ "Anniversary - [if Justin has one]"

## Root Cause
- The `MultiEventSelector` component receives no recipient context
- It doesn't fetch or display the recipient's `important_dates` or `dob` from their profile
- The `AutoGiftSetupFlow` already has `formData.recipientDob` after selection, but doesn't pass it to `MultiEventSelector`

## Solution: Enhance MultiEventSelector with Recipient Context

### Phase 1: Pass Recipient Data to MultiEventSelector

**File: `src/components/gifting/auto-gift/AutoGiftSetupFlow.tsx`**
- Find the selected connection after recipient selection
- Extract `profile_dob` and `profile_important_dates`
- Pass them as new props to `MultiEventSelector`

### Phase 2: Update MultiEventSelector to Accept and Display Recipient Events

**File: `src/components/gifting/events/add-dialog/MultiEventSelector.tsx`**

1. Add new props interface:
```typescript
interface MultiEventSelectorProps {
  value: SelectedEvent[];
  onChange: (events: SelectedEvent[]) => void;
  recipientDob?: string | null;          // MM-DD format
  recipientImportantDates?: any[];       // Array of {title, date, type}
  recipientName?: string;
}
```

2. Calculate and display recipient's birthday:
   - If `recipientDob` exists, show "Birthday - [calculated date]" instead of generic "Birthday"
   - Auto-calculate the next occurrence of the birthday

3. Map recipient's important_dates to occasion options:
   - Filter Justin's `important_dates` for relevant event types (Anniversary, Graduation, Promotion)
   - Display them with their actual dates
   - Allow selection to create rules tied to those specific dates

4. Update the SelectedEvent type to include the calculated date:
```typescript
export interface SelectedEvent {
  eventType: string;
  specificHoliday?: string;
  customDate?: Date;
  calculatedDate?: string;  // ISO date string from recipient's profile
}
```

### Phase 3: Update Rule Creation to Use Recipient Dates

**File: `src/components/gifting/auto-gift/AutoGiftSetupFlow.tsx`**

In the `handleSubmit` function, enhance the `rulesToCreate` logic:
- For "birthday" events: Already uses `calculateNextBirthday(formData.recipientDob)` ✅
- For "anniversary"/"promotion": Use the date from recipient's `important_dates`
- Store the specific date in the rule's `scheduled_date` field

### Visual Changes

| Before | After |
|--------|-------|
| ☐ Birthday | ☐ Birthday - Feb 19 🎂 |
| ☐ Anniversary | ☐ Anniversary - [if exists] |
| ☐ Promotion | ☐ Promotion - [if exists] |
| ☐ Graduation | ☐ Graduation - [if exists] |

Events that the recipient hasn't set up will show as "Not set" or be hidden/greyed out.

---

## Technical Details

### Data Flow
```
RecipientSearchCombobox → selects recipient
       ↓
AutoGiftSetupFlow → finds connection, extracts profile_dob + profile_important_dates
       ↓
MultiEventSelector → receives recipient context as props
       ↓
Display: Shows actual dates instead of generic labels
       ↓
handleSubmit → uses dates to set scheduled_date on auto_gifting_rules
```

### Files to Modify
1. `src/components/gifting/events/add-dialog/MultiEventSelector.tsx`
2. `src/components/gifting/auto-gift/AutoGiftSetupFlow.tsx`

### Edge Cases
- Recipient has no birthday set → Show generic "Birthday" with helper text "(date not set)"
- Recipient has no important_dates → Hide Anniversary/Promotion or show as unavailable
- Multiple anniversaries → List each separately with description

### Consistency with Scheduling Modal
This change aligns the recurring gift wizard with the existing `PresetHolidaySelector` behavior in the scheduling modal (per memory: `features/gift-scheduling-important-dates-integration`), ensuring a unified experience across both flows.
