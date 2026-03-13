

## Problem Diagnosis

I investigated the database and code. Here's what's happening with Curt Davidson → Jacob Davidson:

**Database state**: Curt sent Jacob a connection on Dec 3, 2025. The record has:
- `status = 'pending_invitation'` (not `'pending'`)
- `connected_user_id` = Jacob's real user ID (he already has an account)
- Jacob's account exists at `jbdmonkey291@gmail.com`

### Root Cause 1: Jacob can't see the pending request
The incoming requests query (line 278 of `useConnectionsAdapter.ts`) only fetches connections with `status = 'pending'`:
```
.eq('status', 'pending')
```
But Curt's connection to Jacob has `status = 'pending_invitation'`. Since `pending_invitation` is excluded from the incoming query, **Jacob never sees it in his Pending tab**.

### Root Cause 2: No email notifications are sent for connection requests
The code comments say "database trigger will handle email automatically" but **there are zero triggers on the `user_connections` table**. No email is ever sent when a `pending` connection is created. The only email path that exists is `connection_invitation` (for non-users being invited to the platform), and even that is only triggered by the automated `send-invitation-reminders` function on a schedule.

### Root Cause 3: Nudge/reminder emails silently fail
The `sendConnectionNudge` function sends eventType `nudge_reminder` to the email orchestrator, but **there is no `nudge_reminder` case in the orchestrator's switch statement** (lines 1168-1270). It throws "Unknown email event type" and the reminder never sends.

### Root Cause 4: Status mismatch for existing users
When a connection is created to a user who already has an account, it should use `status = 'pending'`, not `'pending_invitation'`. The `pending_invitation` status is meant for inviting non-platform users. Since Jacob already exists, this record is in a limbo state.

---

## Plan

### 1. Fix the incoming requests query to include `pending_invitation`
**File**: `src/hooks/useConnectionsAdapter.ts` (line 278)

Change `.eq('status', 'pending')` to `.in('status', ['pending', 'pending_invitation'])` for the incoming requests query. This ensures recipients who already have accounts can see connection requests regardless of status variant.

### 2. Add `nudge_reminder` template to the email orchestrator
**File**: `supabase/functions/ecommerce-email-orchestrator/index.ts`

Add a `nudge_reminder` case to the template router switch statement. Create a simple reminder email template that tells the recipient they have a pending connection request with a link to `/connections`.

### 3. Add `connection_request` email event type for new requests
**File**: `supabase/functions/ecommerce-email-orchestrator/index.ts`

Map a new `connection_request` event type (for existing users receiving connection requests) to a notification email template. This is distinct from `connection_invitation` (for non-users).

### 4. Send email notification when connection request is created
**File**: `src/services/connections/connectionService.ts`

After successfully inserting a `pending` connection, invoke the email orchestrator with `connection_request` event type to notify the recipient. Fetch the recipient's email from their profile and the sender's name.

### 5. Fix the stale Curt → Jacob record
**File**: Data fix via query

Update the existing `pending_invitation` record to `pending` status since Jacob already has an account. This is a one-time data fix.

---

## Summary

| File | Change |
|------|--------|
| `src/hooks/useConnectionsAdapter.ts` | Include `pending_invitation` in incoming requests query |
| `supabase/functions/ecommerce-email-orchestrator/index.ts` | Add `nudge_reminder` + `connection_request` templates |
| `src/services/connections/connectionService.ts` | Send email on new connection request |
| Database | Fix Curt→Jacob record status from `pending_invitation` to `pending` |

