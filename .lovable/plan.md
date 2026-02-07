

# Plan: Close Recurring Gift Production Gaps

Three targeted additions to the existing auto-gift pipeline, reusing existing tables, services, and patterns wherever possible. No new edge functions, no new database tables.

---

## Gap 1: Duplicate Rule Prevention

**Problem:** Creating a new rule for the same user + recipient + occasion leaves the old rule active, causing duplicate executions.

**Solution:** Add deactivation logic to the existing `UnifiedGiftManagementService.createRule()` method (the single entry point for all rule creation).

**Where:** `src/services/UnifiedGiftManagementService.ts` -- inside `createRule()`, before the INSERT.

**What changes:**
- After the existing validation phases (1-4), add a query: find any active rules where `user_id`, `recipient_id` (or `pending_recipient_email`), and `date_type` all match.
- If found, set `is_active = false` on the old rule(s) and log the deactivation to `auto_gift_event_logs` (already used throughout the codebase).
- This is ~15 lines of code in one file, using the same Supabase client and logging pattern already in place.

**No backend changes needed** -- this runs client-side in the service layer before the insert.

---

## Gap 2: Year Rollover After Successful Execution

**Problem:** After a recurring gift order is placed, `scheduled_date` stays on the current year's date. The orchestrator won't pick it up again next year.

**Solution:** Add a post-success hook in `approve-auto-gift/index.ts` that advances `scheduled_date` to the next year using the existing shared holiday utilities.

**Where:** `supabase/functions/approve-auto-gift/index.ts` -- after a successful order is created (both off-session and checkout flows), before the final return.

**What changes:**
- After order creation succeeds, import and call `calculateHolidayDate()` or `calculateNextBirthday()` from `../shared/holidayDates.ts` (already imported by the orchestrator -- same shared module).
- Update the rule's `scheduled_date` to the next year's occurrence.
- This reuses the exact same date resolution logic the orchestrator already uses for unscheduled rules, just applied proactively.
- ~20 lines added to the existing approval handler, no new functions.

**Why here instead of the orchestrator?** The orchestrator already resolves NULL `scheduled_date` values, but that only works if we clear the date. Advancing it here is cleaner -- the rule always has a valid next date, and the orchestrator's existing `>=now AND <=lookAhead` window query works without modification.

---

## Gap 3: Payment Failure Notifications

**Problem:** If the saved card fails during T-4 off-session payment, the system silently falls through to a Checkout Session (which the user may never see since it's automated).

**Solution:** Add failure notification logic to the existing catch block in `approve-auto-gift/index.ts`, using the existing `ecommerce-email-orchestrator` and `auto_gift_notifications` table.

**Where:** `supabase/functions/approve-auto-gift/index.ts` -- in the `catch (stripeError)` block around line 545.

**What changes:**
- When off-session payment fails, update the execution record with `payment_error_message` and `payment_retry_count` (columns already exist on `automated_gift_executions`).
- Insert a row into `auto_gift_notifications` (same pattern used for approvals/rejections already in this file).
- Call `ecommerce-email-orchestrator` with a new event type `auto_gift_payment_failed` containing: recipient name, occasion, error summary, and a link to update payment method.
- The email orchestrator already handles unknown event types gracefully, and the template can be added as a simple conditional in the existing orchestrator.
- ~25 lines in the catch block, plus ~15 lines in the email orchestrator template.

**Reused infrastructure:**
- `automated_gift_executions.payment_error_message` column (already exists)
- `automated_gift_executions.payment_retry_count` column (already exists)
- `auto_gift_notifications` table (same INSERT pattern used 3x in this file already)
- `ecommerce-email-orchestrator` invocation (same pattern used 2x in this file already)

---

## Technical Summary

| Gap | File(s) Modified | Lines Added | New Tables/Functions | Reused Components |
|-----|------------------|-------------|---------------------|-------------------|
| Duplicate Prevention | `UnifiedGiftManagementService.ts` | ~15 | None | `auto_gift_event_logs`, existing Supabase client |
| Year Rollover | `approve-auto-gift/index.ts` | ~20 | None | `shared/holidayDates.ts` (calculateHolidayDate, calculateNextBirthday) |
| Payment Failure Notifications | `approve-auto-gift/index.ts`, `ecommerce-email-orchestrator/index.ts` | ~40 | None | `auto_gift_notifications`, `automated_gift_executions` payment columns, email orchestrator |

**Total: ~75 lines across 3 files, zero new tables, zero new edge functions.**

---

## Implementation Order

1. **Duplicate Prevention** (standalone, no dependencies)
2. **Year Rollover** (standalone, uses shared holiday utils)
3. **Payment Failure Notifications** (standalone, uses existing notification infra)

All three can be deployed independently and tested via the Trunkline auto-gift testing tool with simulated dates.

