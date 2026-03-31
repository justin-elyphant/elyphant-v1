

## Add Beta Email Templates to Trunkline Previewer

### Problem
The `EmailTemplatesManager.tsx` has a hardcoded `EVENT_TYPES` array that lists every email template available for preview and test sending. The three beta email types — `beta_approved`, `beta_approval_needed`, and `beta_invite_welcome` — were never added to this list, so they don't appear in the Trunkline email templates page.

### Fix
Add three new entries to the `EVENT_TYPES` array in `EmailTemplatesManager.tsx`, under a new **"Beta Program"** category:

| Event Type | Label | Sample Data |
|---|---|---|
| `beta_approved` | Beta Approved (Welcome) | `customer_name`, `credit_amount: 100`, `first_name` |
| `beta_approval_needed` | Beta Approval Needed (Internal) | `applicant_name`, `applicant_email`, `referrer_name` |
| `beta_invite_welcome` | Beta Invite Welcome | `sender_name`, `recipient_name`, `credit_amount: 100`, `invitation_url` |

Also update `TestEmailModal.tsx`'s `getSampleDataForEvent` if it maintains its own sample data map (to keep them in sync).

### Files affected
- **Edit**: `src/components/trunkline/communications/EmailTemplatesManager.tsx` — add 3 entries to `EVENT_TYPES` array
- **Possible edit**: `src/components/trunkline/communications/TestEmailModal.tsx` — add matching sample data entries

