

# Enrich Vendor Application Form

## Problem
The Apply tab at `/vendor-portal` only collects Company Name, Email, and Password. This gives the admin team almost nothing to evaluate during review. The `vendor_accounts` table already supports `phone`, `website`, and `description` columns that go unused at signup.

## What to collect

Add these fields to the Apply tab (all optional except where noted):

| Field | Required | Why | Stored in |
|-------|----------|-----|-----------|
| Company Name | Yes | Already exists | `vendor_accounts.company_name` |
| Email | Yes | Already exists | auth + `vendor_accounts.contact_email` |
| Password | Yes | Already exists | auth |
| Website | No | Lets admin verify legitimacy | `vendor_accounts.website` |
| Phone | No | Contact for approval follow-up | `vendor_accounts.phone` |
| Business Description | No | What they sell, why they're a fit | `vendor_accounts.description` |
| Product Categories | No | Helps admin assess catalog fit | `vendor_accounts` metadata or description |

**Not collecting at this stage** (can fill in after approval via portal settings): logo, shipping config, integration type, terms acceptance. Keep the application lightweight — you want volume, not friction.

## Changes

### 1. `VendorPortalAuth.tsx`
- Expand `signupData` state to include `website`, `phone`, `description`
- Add 3 optional input fields to the Apply tab form (below Company Name, above Password)
- Include the new fields in the `vendor_accounts` insert: `website`, `phone`, `description`
- Include them in the confirmation email data so the email can show what was submitted
- Keep password fields at the bottom (they're account setup, not application data)
- Add a subtle helper text above password fields: "Create your account credentials — you'll use these to access the portal once approved."

### 2. No database migration needed
The `vendor_accounts` table already has `phone`, `website`, and `description` columns from migration `20260307222345`.

### 3. No edge function changes needed
The `vendor_application_received` email template already receives `data` — we just pass the extra fields for richer confirmation content.

### 4. Update email template (optional enhancement)
Add the submitted details (website, description) to the confirmation email's summary card so the vendor sees exactly what was submitted.

## Scope
- 1 file modified: `VendorPortalAuth.tsx`
- 1 file optionally updated: `ecommerce-email-orchestrator/index.ts` (richer email content)
- 0 migrations

