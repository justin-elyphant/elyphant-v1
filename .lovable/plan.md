

# Fix: Welcome Email Not Firing After Onboarding

## Root Cause

The welcome email IS being queued correctly by the `complete_onboarding` RPC. However, the `process-email-queue` cron job only runs **every 10 minutes**. When test accounts are created and then deleted shortly after, the `delete-user-account` function wipes all `email_queue` entries for that email (line 176) before the cron has a chance to process the welcome email.

So the sequence is:
1. User completes onboarding → welcome_email inserted into `email_queue` with `status=pending`
2. User deletes account (within minutes) → `safeDelete('email_queue', ...)` removes the pending welcome email
3. Account deletion email is inserted AFTER the wipe
4. Cron runs → finds no welcome_email, only the account_deleted email

For real production users who won't delete their account 2 minutes after creating it, the email would eventually send. But there's still a 0-10 minute delay that could be improved.

## Proposed Fix

**Trigger the email queue processor immediately after onboarding**, so the welcome email is sent within seconds rather than waiting for the next cron cycle. This also makes the welcome email more impactful (arriving while the user is still engaged).

### Changes

**File: `src/components/auth/stepped/SteppedAuthFlow.tsx`**
- After the `complete_onboarding` RPC succeeds and verification passes, invoke `process-email-queue` with `force=true` to immediately process the just-queued welcome email
- This is a fire-and-forget call — don't block navigation on it

```
// After verification, before navigation:
supabase.functions.invoke("process-email-queue?force=true").catch(console.error);
```

This ensures the welcome email is sent within seconds of account creation, eliminating the race condition with account deletion during testing and providing a better UX for production users.

