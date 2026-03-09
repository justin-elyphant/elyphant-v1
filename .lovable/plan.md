

# Vendor Application Detail View

## What We're Building
A slide-out sheet (or dialog) in Trunkline's Vendor Management that opens when you click a vendor row, showing all collected application data and approval actions.

## Data Available
From `vendor_accounts` table (already fetched):
- Company name, contact email, website, phone, description
- Approval status, applied date, updated date

From `profiles` table (needs a join or secondary query):
- First name, last name, profile_type, signup_source, signup_metadata

The applicant's title (e.g. "Founder") is stored in `auth.users.raw_user_meta_data` which isn't directly queryable from the client. We can surface it if it was also written to `profiles.signup_metadata` or `profiles.metadata`.

## Implementation

### 1. Create `VendorDetailSheet` component
A new `Sheet` component (`src/components/trunkline/vendors/VendorDetailSheet.tsx`) that:
- Accepts a `Vendor` object and open/close state
- Fetches the associated `profiles` row via `vendor_accounts.user_id`
- Displays all application fields in organized sections:
  - **Contact**: first name, last name, title, email, phone
  - **Company**: company name, website, description
  - **Status**: approval status, applied date
- Includes approve/reject/suspend action buttons at the bottom

### 2. Update `VendorAccounts` table row data
Expand the `Vendor` type and `useVendorManagement` hook to also select `description` and `phone` (already in the table but mapped). These fields are already mapped in the hook.

### 3. Make table rows clickable
In `VendorsTable.tsx`:
- Add `onClick` to each `TableRow` that opens the detail sheet
- Add `cursor-pointer hover:bg-muted/50` styling
- Track `selectedVendor` state
- Render `VendorDetailSheet` with the selected vendor

### 4. Fetch profile data inside the sheet
A small query inside the sheet component fetches `profiles` by `user_id` to get first_name, last_name, and any signup_metadata (which may contain the title).

### Files Changed
- **New**: `src/components/trunkline/vendors/VendorDetailSheet.tsx`
- **Edit**: `src/components/trunkline/vendors/VendorsTable.tsx` — add click handler + sheet
- **Edit**: `src/components/trunkline/vendors/types.ts` — ensure description/phone are included (already there)

