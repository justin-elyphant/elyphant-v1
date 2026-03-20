

## Email Orchestrator — Unify and Clean Up

### What we found

**Two template systems exist:**
1. `ecommerce-email-orchestrator/index.ts` — the live 1,523-line monolith with ~20 inline templates. This is what actually sends emails.
2. `render-email-template/email-templates/` — 10 standalone files with their own `base-template.ts`. **Dead code** — nothing imports these, and the `EmailTemplatesManager` even has a TODO noting they were removed. These should be deleted.

**Style split inside the orchestrator:**
- Vendor templates (application received/approved/rejected, connection request, nudge reminder, vendor new order) already use the clean Lululemon aesthetic — dark `#1a1a1a` buttons, `1px solid #e5e7eb` bordered cards, editorial `font-weight: 300` headings, no emoji.
- Consumer templates (order confirmed, shipped, failed, pending, welcome, connection invitation, auto-gift approval, recurring gift, gift coming, auto-gift payment failed, guest order confirmation, wishlist shared, connection established, ZMA alert) still use emoji headings, gradient info cards, gradient CTA buttons, and colorful backgrounds.

### Plan

**1. Delete dead `render-email-template/email-templates/` directory**
Remove all 10 standalone template files plus `base-template.ts`. These are unused duplicates.

**2. Redesign the base template header and footer (orchestrator)**
- Replace the full-width purple-to-cyan gradient header with a white background, centered "Elyphant" wordmark (`font-weight: 300; font-size: 28px; color: #1a1a1a`), and a thin 40px-wide gradient accent line below
- Clean up the footer to match vendor template style — lighter `#9ca3af` text, no pipe separators

**3. Restyle all consumer templates to match vendor aesthetic**

For each consumer template, apply these consistent changes:

| Element | Before | After |
|---|---|---|
| Headings | `"Order Confirmed! 🎉"` (700 weight) | `"Your order is confirmed."` (300/600 split, no emoji) |
| Info cards | `background: linear-gradient(135deg, #faf5ff → #f3e8ff); border-left: 4px solid #9333ea` | `border: 1px solid #e5e7eb; border-radius: 8px; background: #ffffff` |
| CTA buttons | `background: linear-gradient(90deg, #9333ea → #0ea5e9)` | `background: #1a1a1a; border-radius: 6px; font-weight: 500` |
| Secondary buttons | `border: 2px solid #9333ea; color: #9333ea` | Same — keep as outlined, but with `#1a1a1a` border |
| Bullet lists | `🎁 **Share wishlists** - Never guess...` | `Share wishlists — never guess...` (clean typography, no emoji) |
| Status labels | `text-transform: uppercase; color: #9333ea` | `text-transform: uppercase; letter-spacing: 0.08em; color: #9ca3af` |
| Gift message boxes | Green gradient bg with `🎁 Gift Message:` | Bordered card with "Gift message" label |

**4. Clean up subject lines in `getEmailTemplate`**
Remove all emoji from subject lines across all event types.

**5. Clean up shared partials**
- `renderShippingAddress`: remove `📍` emoji
- `renderGiftShippingAddress`: remove `📍` and `🔒` emoji
- `renderItemsHtml` / `renderPricingBreakdown`: already clean, keep as-is

**6. Clean up `src/utils/messageTemplates.ts`**
Remove emoji from all message template strings (birthday, anniversary, holiday, etc.).

**7. Deploy**
Redeploy the `ecommerce-email-orchestrator` edge function.

### Files affected
- **Delete**: `supabase/functions/render-email-template/email-templates/` (11 files)
- **Edit**: `supabase/functions/ecommerce-email-orchestrator/index.ts` (base template + ~15 consumer templates + subject lines + partials)
- **Edit**: `src/utils/messageTemplates.ts` (remove emoji from message strings)

### What stays unchanged
- All sending logic, data fetching, Resend integration, order enrichment
- Vendor templates (already clean)
- Connection request and nudge reminder templates (already clean)
- All utility functions (`formatPrice`, `getFirstName`, `possessive`, etc.)

