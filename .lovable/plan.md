

## Problem

You can't delete test users from the Supabase dashboard because **18 tables** have foreign keys to `auth.users` without `ON DELETE CASCADE`. The `security_logs` table is the one currently blocking, but the others will cause identical failures.

## Fix

A single database migration that alters all 18 foreign key constraints to add proper delete behavior:

- **SET NULL** for audit/log tables where we want to preserve records but remove the user reference (security_logs, zma_balance_audit_log, zma_funding_alerts, zinc_sync_logs, email_templates, user_roles granted_by, business_admins created_by)
- **CASCADE** for user-owned data that should be deleted with the user (messages, contributions, typing_indicators, user_presence, message_rate_limits, offline_message_queue, pending_recipient_addresses, funding_campaigns)

For each constraint, the migration will:
1. Drop the existing foreign key
2. Re-create it with the appropriate ON DELETE rule

## Tables and proposed delete behavior

| Table | Column | Proposed Rule |
|-------|--------|--------------|
| security_logs | user_id | SET NULL |
| messages | sender_id | SET NULL |
| messages | recipient_id | SET NULL |
| contributions | contributor_id | SET NULL |
| business_admins | created_by | SET NULL |
| email_templates | created_by | SET NULL |
| user_roles | granted_by | SET NULL |
| zma_balance_audit_log | admin_user_id | SET NULL |
| zma_funding_alerts | resolved_by | SET NULL |
| zma_funding_schedule | admin_confirmed_by | SET NULL |
| zinc_sync_logs | triggered_by | SET NULL |
| funding_campaigns | creator_id | CASCADE |
| message_rate_limits | user_id | CASCADE |
| offline_message_queue | user_id | CASCADE |
| pending_recipient_addresses | requested_by | CASCADE |
| typing_indicators | user_id | CASCADE |
| typing_indicators | chat_with_user_id | CASCADE |
| user_presence | typing_in_chat_with | SET NULL |

## Technical notes

- The `security_logs.user_id` column must be made nullable first (if not already) before SET NULL can work
- Same for any other columns getting SET NULL -- they must allow NULL values
- This is a schema-only change; no application code changes needed
- After this migration, you'll be able to delete any user from the Supabase dashboard without errors

