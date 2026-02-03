
# Fix: Email Wrong Recipient + Holiday Date Off-by-One Bug

## Summary of Issues

### Issue 1: Approval Email Sent to Wrong Person
The approval email went to **Justin** (asking him to approve a gift for Charles) instead of **Charles** (asking him to approve a gift for Justin).

**Root Cause**: The orchestrator processed an **old rule** (Justin → Charles created Jan 13) instead of the **new rule** (Charles → Justin created just now). This happened because:
- Old rule: `scheduled_date: 2026-12-25` → T-7 = `2026-12-18` ✅ (triggered)
- New rule: `scheduled_date: 2026-12-26` → T-7 = `2026-12-19` ❌ (not triggered)

The email logic itself is correct - it emails `rule.user_id` (the gift-giver) about `rule.recipient_id` (the gift receiver).

### Issue 2: Holiday Date Calculation Off-by-One
Charles's new Christmas rule saved `2026-12-26` instead of `2026-12-25`. This is a **timezone bug** in the frontend date calculation.

**Root Cause**: In `src/constants/holidayDates.ts`, the `calculateHolidayDate()` function:
1. Creates a `Date` object at **23:59:59.999 local time**
2. Calls `toISOString()` which converts to **UTC**
3. For US Pacific users (UTC-8), `Dec 25, 2026 23:59:59 PST` → `Dec 26, 2026 07:59:59 UTC`
4. The `.split('T')[0]` then extracts `2026-12-26` (wrong!)

---

## Technical Solution

### Fix: Use UTC-safe Date String Formatting

**File: `src/constants/holidayDates.ts`**

Instead of using `toISOString()` (which converts to UTC), manually format the date components to preserve the local date:

**Before (lines 87-97):**
```typescript
if (holiday.type === 'fixed') {
  const holidayDate = new Date(targetYear, holiday.month - 1, holiday.day!, 23, 59, 59, 999);
  
  if (holidayDate < currentDate && !year) {
    const nextYearDate = new Date(targetYear + 1, holiday.month - 1, holiday.day!, 23, 59, 59, 999);
    return nextYearDate.toISOString().split('T')[0];
  }
  
  return holidayDate.toISOString().split('T')[0];
}
```

**After:**
```typescript
if (holiday.type === 'fixed') {
  // Use noon to avoid any timezone edge cases for comparison
  const holidayDate = new Date(targetYear, holiday.month - 1, holiday.day!, 12, 0, 0);
  
  if (holidayDate < currentDate && !year) {
    // Return next year's date using local date components (not UTC)
    const nextYear = targetYear + 1;
    return `${nextYear}-${String(holiday.month).padStart(2, '0')}-${String(holiday.day!).padStart(2, '0')}`;
  }
  
  // Return date string using local date components (not UTC conversion)
  return `${targetYear}-${String(holiday.month).padStart(2, '0')}-${String(holiday.day!).padStart(2, '0')}`;
}
```

**Same fix for floating holidays (lines 100-117):**
```typescript
if (holiday.type === 'floating' && holiday.week && holiday.weekday !== undefined) {
  const firstOfMonth = new Date(targetYear, holiday.month - 1, 1);
  const firstWeekday = firstOfMonth.getDay();
  const firstTarget = 1 + (holiday.weekday - firstWeekday + 7) % 7;
  const targetDate = firstTarget + (holiday.week - 1) * 7;
  
  // Use noon for comparison
  const holidayDate = new Date(targetYear, holiday.month - 1, targetDate, 12, 0, 0);
  
  if (holidayDate < currentDate && !year) {
    return calculateHolidayDate(holidayKey, targetYear + 1);
  }
  
  // Return using local date components
  return `${targetYear}-${String(holiday.month).padStart(2, '0')}-${String(targetDate).padStart(2, '0')}`;
}
```

---

## Helper Function (Optional but Cleaner)

Add a helper at the top of the file:

```typescript
// Format date as YYYY-MM-DD without timezone conversion
const formatLocalDate = (year: number, month: number, day: number): string => {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
};
```

Then use `formatLocalDate(targetYear, holiday.month, holiday.day!)` throughout.

---

## Files Modified

| File | Change |
|------|--------|
| `src/constants/holidayDates.ts` | Fix `calculateHolidayDate()` to use local date formatting instead of `toISOString()` |

---

## Cleanup Required After Fix

Once the fix is deployed, Charles's existing Christmas rule needs to be updated:

```sql
-- Fix the incorrect scheduled_date for Charles's Christmas rule
UPDATE auto_gifting_rules 
SET scheduled_date = '2026-12-25' 
WHERE id = '983de552-45b9-4f1d-a7e8-e9394852f629';
```

Or Charles can delete and recreate the rule through the UI.

---

## Test Plan

1. **Deploy the fix** to `src/constants/holidayDates.ts`
2. **Fix Charles's existing rule** (SQL update or recreate)
3. **Optional: Deactivate old Justin→Charles rule** to avoid confusion:
   ```sql
   UPDATE auto_gifting_rules SET is_active = false WHERE id = '4e7973f4-ab40-48e4-8068-5337161f5606';
   ```
4. **Re-run orchestrator** with simulated date `2026-12-18`
5. **Verify**:
   - Email goes to **Charles** (justincmeeks@hotmail.com)
   - Subject mentions "Justin Meeks's Christmas"
   - Body says "Hi Charles, approve your gift for Justin Meeks"
