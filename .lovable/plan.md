

# Add `vendor_application_received` Email Template

## What exists today
- `vendorNewOrderTemplate` is already wired (line 942-987, case at line 1068)
- `VendorPortalAuth.tsx` inserts into `vendor_accounts` with `approval_status: 'pending'` (line 152-159) but sends no email — only shows toast messages
- The `baseEmailTemplate` uses an Elyphant purple gradient header, which is fine for consumer emails but not ideal for vendor-facing communications

## Plan

### 1. Create `vendorApplicationReceivedTemplate` in `ecommerce-email-orchestrator/index.ts`
Insert before the template router (~line 988). Design principles inspired by Lululemon's editorial email style:

- **Clean monochromatic typography** — large, bold sans-serif heading with generous letter-spacing (`-0.02em`), minimal color palette (black text on white, single accent for CTA)
- **Editorial spacing** — generous padding (48px top/bottom), breathing room between sections, no visual clutter
- **Minimal card** — light border, no background fill, clean key-value layout for "Company: X", "Status: Under Review", "Expected Response: Within 72 hours"
- **Single black CTA button** — `background: #1a1a1a`, matching the vendor portal's professional SaaS aesthetic (consistent with `vendorNewOrderTemplate`)
- **Understated footer note** — small muted text about what happens next

Content flow:
1. `Thank you for applying, ${company_name}.` — large heading
2. Brief confirmation paragraph — "We've received your application to join the Elyphant Vendor Program."
3. Clean summary card — company name, status, review timeline
4. CTA: "Visit Elyphant" linking to homepage
5. Footer: "Questions? Reply to this email."

### 2. Add `case 'vendor_application_received'` to `getEmailTemplate` switch (~line 1072, before `default`)
```
subject: `Application Received — ${data.company_name} | Elyphant Vendor Program`
```

### 3. Trigger from `VendorPortalAuth.tsx` (~line 164, after successful insert)
Fire-and-forget call to the orchestrator:
```typescript
supabase.functions.invoke('ecommerce-email-orchestrator', {
  body: {
    eventType: 'vendor_application_received',
    recipientEmail: signupData.email,
    data: { company_name: signupData.companyName }
  }
}).catch(console.error);
```
Non-blocking — signup flow continues regardless of email success.

### Files changed
- `supabase/functions/ecommerce-email-orchestrator/index.ts` — new template + router case
- `src/components/vendor/auth/VendorPortalAuth.tsx` — add orchestrator invocation after vendor_accounts insert

