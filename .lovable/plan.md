

## Enable Gifting to Anyone — "Send to Someone New" with Address Entry

### Problem

Today, the Buy Now drawer's recipient selector only offers:
1. **Ship to Myself** — uses buyer's saved address
2. **Existing Connections** — must already be on the platform with an accepted connection
3. **Invite New** — sends a platform invitation, but the recipient must sign up and provide their address before the order can fulfill

If you want to buy grandma flowers, she needs to be on Elyphant first. That's a deal-breaker for impulse gifting.

### Solution: "Send to Someone New" inline form

Add a third recipient type — `manual_address` — that lets the buyer enter a name, email, and shipping address directly in the Buy Now drawer. No platform signup required to fulfill the order.

**The viral loop:** After checkout, the recipient gets a branded "You've received a gift!" email with a CTA to join Elyphant — organic signup driven by real gift deliveries.

### How it works

**Step 1 — Recipient selector gets a new option**

In `SimpleRecipientSelector`, replace the current "Invite New Recipient" button (which only collects name + email and waits for signup) with **"Send to Someone New"** — a compact inline form:

- Name (required)
- Email (required) — used for gift notification + signup invite
- Shipping address fields (required) — street, city, state, zip

When submitted, this creates a `SelectedRecipient` with `type: 'manual_address'` containing the full shipping address. No connection record needed.

**Step 2 — BuyNow drawer processes manual addresses**

In `handlePlaceOrder`, add a third branch for `manual_address` recipients:
- Use the manually entered address as `shippingInfo`
- Pass `recipient_email` and `recipient_name` in checkout metadata
- Set `delivery_scenario: "gift"` and `is_gift: true`

**Step 3 — Post-checkout recipient notification**

In `stripe-webhook-v2`, when an order has `recipient_email` in metadata and no `recipient_connection_id`:
- Send a "You've received a gift!" email via the email orchestrator
- Include a signup CTA link with pre-filled email: `https://elyphant.ai/signup?email={recipient_email}&ref=gift&order={order_id}`
- If the recipient signs up, their account is auto-linked to the order for tracking

**Step 4 — Cleanup: Remove `RecipientInfoDialog` and `RecipientInfoForm`**

These files are dead code — the Buy Now drawer replaced them. Safe to delete:
- `src/components/marketplace/product-details/RecipientInfoDialog.tsx`
- `src/components/marketplace/product-details/recipient-info/RecipientInfoForm.tsx`
- `src/components/marketplace/product-details/recipient-info/schema.ts`
- `src/components/marketplace/product-details/recipient-info/PersonalInfoFields.tsx`
- `src/components/marketplace/product-details/recipient-info/AddressFields.tsx`

### Type changes

```text
SelectedRecipient.type: 'self' | 'connection' | 'later' | 'manual_address'

// New fields for manual_address type:
SelectedRecipient.recipientEmail?: string
SelectedRecipient.recipientName?: string
```

### Files changed

| File | Change |
|------|--------|
| `SimpleRecipientSelector.tsx` | Replace "Invite New" with "Send to Someone New" inline address form |
| `BuyNowDrawer.tsx` | Add `manual_address` branch in `handlePlaceOrder` |
| `src/types/recipient.ts` | Add `manual_address` type |
| `stripe-webhook-v2/index.ts` | Send gift notification email when `recipient_email` present |
| 5 dead files | Delete `RecipientInfoDialog`, `RecipientInfoForm`, `schema.ts`, `PersonalInfoFields`, `AddressFields` |

### What this does NOT change

- Existing connection-based gifting — unchanged
- "Invite New" in `UnifiedRecipientSelection` (cart page) — preserved separately, can be updated later
- Address privacy model — manual addresses are buyer-provided, not recipient-controlled
- No new database tables — recipient info flows through Stripe metadata → order record

### Viral loop summary

```text
Buyer enters grandma's address → Order fulfills immediately
                                → Grandma gets "You received a gift!" email
                                → CTA: "Join Elyphant to track gifts & create wishlists"
                                → Grandma signs up → organic user growth
```

