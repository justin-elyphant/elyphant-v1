

## Audit & Fix: Beta Program Links, Buttons, and URLs for Production

### Issues Found

**1. Broken route in beta approval email: `/shop` does not exist**
The "Start Shopping" CTA in the beta approval email links to `https://elyphant.ai/shop`, but there is no `/shop` route — the marketplace lives at `/marketplace`.

**2. ~30 hardcoded `elyphant.lovable.app` URLs in the email orchestrator**
Links for recurring gifts, dashboard, vendor portal, and the beta check-in fallback still use the staging domain (`elyphant.lovable.app`) instead of the production domain (`elyphant.ai`). These are clickable links inside emails sent to real users.

**3. NudgeModal uses `window.location.origin + '/signup'` for invitation URL**
This means in local dev or preview environments, nudge reminder emails send localhost/preview links instead of the production `elyphant.ai` URL. The AddConnectionSheet and PendingTabContent already correctly hardcode `https://elyphant.ai/auth?invite=...`, but NudgeModal does not.

**4. AddConnectionSheet copy-link uses `window.location.origin`**
The "Copy invite link" button builds URLs from `window.location.origin`, which produces preview URLs in non-production environments. Same issue in `EnhancedConnectionSearch.tsx`.

**5. AddressRequestManager uses `window.location.origin`**
Address request emails use the current origin for the request URL link.

**6. EmailTemplatesManager sample data uses `elyphant.lovable.app`**
The beta_checkin sample URL in the test email previewer uses the staging domain — minor but inconsistent.

### Plan

**File 1: `supabase/functions/ecommerce-email-orchestrator/index.ts`**
- Replace all `elyphant.lovable.app` references with `elyphant.ai` (~30 occurrences across recurring gift, dashboard, vendor portal, and beta check-in templates)
- Fix `/shop` → `/marketplace` in the beta approval template CTA
- Redeploy edge function

**File 2: `src/components/connections/NudgeModal.tsx`**
- Change `window.location.origin + '/signup'` to `https://elyphant.ai/auth` (consistent with other invite flows)

**File 3: `src/components/connections/AddConnectionSheet.tsx`**
- Change copy-link from `window.location.origin` to production URL using `getAppUrl()` from `urlUtils.ts` (which already handles localhost fallback)

**File 4: `src/components/connections/EnhancedConnectionSearch.tsx`**
- Same fix: use `getAppUrl()` for the share URL

**File 5: `src/components/connections/AddressRequestManager.tsx`**
- Use `getAppUrl()` for the address request URL in emails

**File 6: `src/components/trunkline/communications/EmailTemplatesManager.tsx`**
- Update sample `feedback_url` from `elyphant.lovable.app` to `elyphant.ai`

### Technical details

- `src/utils/urlUtils.ts` already exists with `getAppUrl()` that returns `elyphant.ai` in production and `localhost` in dev — perfect for the frontend fixes
- The edge function runs server-side so it should always use the hardcoded production domain
- Total: 6 files modified, 1 edge function redeployed

