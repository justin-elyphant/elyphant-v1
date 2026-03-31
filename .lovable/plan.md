

## Enhance Beta Approved Email with Guided Onboarding

### What Changes

**File**: `supabase/functions/ecommerce-email-orchestrator/index.ts` — `betaApprovedTemplate` function (lines 1316-1351)

**1. Credit card subtitle** (line 1319): Change "Available across multiple orders" → "Up to $25 per order across multiple purchases"

**2. New "Why your testing matters" block** (inserted after credit card): Brief paragraph explaining they're part of a small group shaping the platform before public launch. Sets the tone that their usage directly influences the product.

**3. Replace "What we need from you" section** (lines 1321-1344) with **5-step testing guide**:

| Step | Title | What it tests |
|------|-------|---------------|
| 1 | Build your wishlist | Product search + wishlist system |
| 2 | Invite a friend or family member | Referral flow (they get $100 too) |
| 3 | Schedule a gift | Core gifting engine |
| 4 | Buy something for yourself | Standard checkout |
| 5 | Tell us what you think | Feedback loop |

**4. Update "How credits work" copy** (lines 1347-1350): Add $25 per-order cap language — "up to $25 per order, so you can spread it across at least 4 purchases and test different parts of the platform."

### What stays the same
- Credit amount display ($100.00 card)
- "Start Shopping" CTA button
- Subject line, preheader, overall Lululemon-inspired styling
- `baseEmailTemplate` wrapper

### Post-edit
- Deploy `ecommerce-email-orchestrator` edge function

