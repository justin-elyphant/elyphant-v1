
# Fix: Duplicate Birthday in Holiday Dropdown

## Problem Identified

Charles Meeks's birthday appears twice in the "Popular Holidays/Events" dropdown because:

1. **Profile DOB field** (`dob: "11-26"`) - Stored in `profile_dob` and passed via `recipientDob` prop
2. **Important Dates array** - Contains `{ title: "Birthday", date: "2025-11-26", type: "custom" }` also passed via `recipientImportantDates`

Both sources generate a "Charles Meeks's Birthday (Nov 26)" entry in the dropdown.

### Database Evidence
```text
profiles (Charles Meeks):
- dob: "11-26"
- important_dates: [{ title: "Birthday", date: "2025-11-26", type: "custom" }]
```

---

## Solution

Filter out birthday-type entries from `recipientImportantDates` in `PresetHolidaySelector.tsx` before adding them to the options list. Since we already handle birthdays explicitly via the `recipientDob` prop, any important date with a birthday-like type or title should be skipped.

---

## Technical Changes

### File: `src/components/gifting/unified/PresetHolidaySelector.tsx`

**Current Code (line ~122):**
```typescript
// Add recipient's important dates (anniversaries, etc.)
recipientImportantDates.forEach((importantDate, index) => {
  const nextDate = calculateNextOccurrence(importantDate.date);
  // ... adds to options
});
```

**Updated Code:**
```typescript
// Add recipient's important dates (anniversaries, etc.)
// SKIP birthday entries - we handle those via recipientDob prop
recipientImportantDates
  .filter(importantDate => {
    const lowerTitle = (importantDate.title || '').toLowerCase();
    const lowerType = (importantDate.type || '').toLowerCase();
    // Skip if it's a birthday (already handled above)
    return !lowerTitle.includes('birthday') && lowerType !== 'birthday';
  })
  .forEach((importantDate, index) => {
    const nextDate = calculateNextOccurrence(importantDate.date);
    if (nextDate) {
      const title = importantDate.title || importantDate.description || 'Special Date';
      const icon = getEventIcon(importantDate.type, title);
      options.push({
        key: `custom_${importantDate.id || index}`,
        label: recipientName ? `${recipientName}'s ${title}` : title,
        icon,
        date: nextDate,
        dateLabel: nextDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      });
    }
  });
```

---

## Why Not Deduplicate by Date?

Deduplication by date matching could cause issues if:
- User has two different events on the same date (e.g., anniversary AND a friend's birthday)
- Time zone differences cause date drift

Filtering by title/type is safer since "Birthday" in important_dates is redundant with the `dob` field.

---

## Summary

| Change | Location |
|--------|----------|
| Filter birthday entries from `recipientImportantDates` | `PresetHolidaySelector.tsx` lines 122-135 |

This ensures the birthday only appears once (from the dedicated `dob` field), while anniversaries, graduations, and other custom events continue to display correctly.
