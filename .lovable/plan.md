

## Problem

The account deletion for `justincmeeks@hotmail.com` fails at the final `auth.admin.deleteUser()` step because there are still FK constraints without `ON DELETE` rules blocking the deletion. The edge function also has code bugs causing data cleanup failures before that step.

## Root Causes (from edge function logs)

1. **Wrong column names**: `pending_gift_invitations` uses `user_id`, not `inviter_id`/`invitee_id`; `auto_gift_fulfillment_queue` and `auto_gift_payment_audit` have no `user_id` column
2. **Non-existent tables**: `notifications` and `wishlist_purchase_tracking` don't exist
3. **Wrong deletion order**: `orders` is deleted before `automated_gift_executions` which references it via FK, causing a constraint violation
4. **Incomplete FK migration**: The pending migration covers 18 constraints, but there are ~35+ FK constraints on `auth.users`. Missing ones include: `orders.user_id`, `profiles.id`, `api_keys`, `privacy_settings`, `blocked_users`, `auto_gifting_settings`, `payment_methods`, `product_analytics`, `gift_templates`, and more

## Fix (2 changes)

### 1. New database migration -- add ON DELETE rules for ALL remaining FK constraints

Add CASCADE or SET NULL for every FK to `auth.users` not covered by the previous migration:

| Table | Column | Rule |
|-------|--------|------|
| profiles | id | CASCADE |
| orders | user_id | SET NULL |
| api_keys | user_id | CASCADE |
| privacy_settings | user_id | CASCADE |
| blocked_users | blocker_id | CASCADE |
| blocked_users | blocked_id | CASCADE |
| auto_gifting_settings | user_id | CASCADE |
| user_search_history | user_id | CASCADE |
| gift_templates | user_id | SET NULL |
| address_intelligence | user_id | CASCADE |
| user_presence | user_id | CASCADE |
| payment_methods | user_id | CASCADE |
| product_analytics | user_id | SET NULL |
| user_interaction_events | user_id | SET NULL |
| purchase_analytics | user_id | SET NULL |
| gift_invitation_analytics | user_id | SET NULL |
| gift_invitation_analytics | invited_user_id | SET NULL |
| invitation_rewards | user_id | CASCADE |
| business_admins | user_id | CASCADE |

Also add CASCADE rules for FK constraints on the `orders` table so order deletion doesn't block:
- `automated_gift_executions.order_id` -> CASCADE
- `order_notes.order_id`, `order_email_events.order_id`, `admin_alerts.order_id`, etc. -> CASCADE or SET NULL

### 2. Fix the edge function (`delete-user-account/index.ts`)

- Remove references to non-existent tables (`notifications`, `wishlist_purchase_tracking`)
- Fix `pending_gift_invitations` to use `user_id` column
- Remove `user_id` deletes for `auto_gift_fulfillment_queue` and `auto_gift_payment_audit` (delete via `execution_id` through `automated_gift_executions` instead)
- Fix deletion order: delete `automated_gift_executions` and other order-dependent tables BEFORE `orders`
- Add missing table deletions for any tables with user FK references
- Fix `wishlist_items` to delete via `wishlist_id` (through wishlists) rather than non-existent `user_id`

## Technical notes

- Both the previous migration and this new one must be published together
- The edge function fix deploys automatically
- After both changes, the user deletion flow and Supabase dashboard deletion will both work
- No frontend code changes needed

