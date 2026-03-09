

# Vendor Approval & Rejection Notification Emails

## Overview
Add two new email templates to the orchestrator and trigger them from `approve-vendor` after status updates. Same Lululemon-inspired editorial style as the existing "Application Received" email.

## Changes

### 1. Email Orchestrator — Two New Templates
**File**: `supabase/functions/ecommerce-email-orchestrator/index.ts`

**`vendor_application_approved`** template:
- Heading: "Welcome to Elyphant, {companyName}."
- Body: Congratulations copy, explains they now have Vendor Portal access
- Summary card: Company name, Status (Approved in green), Approved date
- "What's Next" section: Connect Shopify, list products, manage orders
- CTA button: "Open Your Vendor Portal" → links to `https://elyphant.lovable.app/vendor-portal`
- Preheader: "You're approved — welcome to the Elyphant Vendor Program"

**`vendor_application_rejected`** template:
- Heading: "An update on your application, {companyName}."
- Body: Polite decline — "after careful review, we're unable to move forward at this time"
- Summary card: Company name, Status (Not Approved in muted red)
- Encouragement: "This doesn't have to be the end" — invite to reapply or reach out
- CTA button: "Visit Elyphant" → homepage
- Preheader: "Update on your Elyphant Vendor Program application"

Both use `baseEmailTemplate`, same font stack, spacing, and card pattern as `vendorApplicationReceivedTemplate`.

**Template router** — add two new cases to `getEmailTemplate()`:
- `vendor_application_approved` → subject: `You're Approved — Welcome to Elyphant, {company_name}!`
- `vendor_application_rejected` → subject: `Application Update — {company_name} | Elyphant Vendor Program`

### 2. Approve-Vendor Edge Function — Trigger Emails
**File**: `supabase/functions/approve-vendor/index.ts`

After the status update and role management (around line 132), add:

- Fetch the vendor's `contact_email` and `company_name` from `vendor_accounts` (expand the existing select on line 77 to include these fields)
- On `approved`: invoke `ecommerce-email-orchestrator` with `eventType: 'vendor_application_approved'`, passing `company_name` and `recipientEmail`
- On `rejected`: invoke `ecommerce-email-orchestrator` with `eventType: 'vendor_application_rejected'`, passing `company_name` and `recipientEmail`
- On `suspended`: no email for now (existing vendors, different context)
- Email sending is non-fatal — wrap in try/catch, log errors but don't fail the response

### Files Changed
- **Edit**: `supabase/functions/ecommerce-email-orchestrator/index.ts` — add 2 templates + 2 router cases
- **Edit**: `supabase/functions/approve-vendor/index.ts` — fetch contact info, trigger emails after status change

