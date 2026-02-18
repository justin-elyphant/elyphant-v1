

# Purchase Flow Test Plan (5 Flows + Trunkline Scheduler)

## Pre-Flight Setup

**Stripe Test Cards**
- Success: `4242 4242 4242 4242` (Exp: `12/34`, CVC: `123`)
- Decline: `4000 0000 0000 0002`

**Requirements**
- Logged-in test account with at least one connection (with a shipping address)
- At least one product visible in the marketplace
- Access to Trunkline at `/trunkline/auto-gift-testing`
- Stripe Dashboard open (test mode) to verify sessions/payments

---

## Flow 1: Standard Checkout

**Route:** `/shop` -> `/cart` -> `/checkout`

| Step | Action | Expected |
|------|--------|----------|
| 1 | Browse `/shop`, add 1-2 items to cart | Cart badge updates |
| 2 | Go to `/cart`, verify items and quantities | Correct items, prices, quantities |
| 3 | Click "Proceed to Checkout" | Redirected to `/checkout` |
| 4 | Fill shipping address (your own address) | Form validates |
| 5 | Click "Place Order" | Redirected to Stripe hosted checkout |
| 6 | Pay with test card `4242...` | Redirected to `/order-success?session_id=...` |
| 7 | Check confirmation page | Order number shown, correct total |
| 8 | Check email | Order confirmation received (your address shown in full) |

**Stripe Dashboard check:** Session completed, payment captured.

---

## Flow 2: Wishlist Purchase

**Route:** Connection's profile -> Add wishlist item to cart -> Standard checkout

| Step | Action | Expected |
|------|--------|----------|
| 1 | Navigate to a connection's profile page | See their wishlist items |
| 2 | Click "Add to Cart" on a wishlist item | Item added to cart |
| 3 | Go to `/cart` -> `/checkout` | Item shows in checkout |
| 4 | Verify recipient auto-populates from connection | Connection's name and shipping address pre-filled |
| 5 | Add a gift message | Message field accepts text |
| 6 | Complete payment on Stripe | Redirected to success page |
| 7 | Check email | Confirmation shows masked address (City, State only -- no street) |

**Key verification:** Gift message appears in Stripe session metadata (`gift_message` field).

---

## Flow 3: Buy Now (One-Off Gift)

**Route:** Product page -> Buy Now drawer

| Step | Action | Expected |
|------|--------|----------|
| 1 | On any product page, click the red "Buy Now" button | 4-step drawer opens |
| 2 | Step 1 -- Recipient: Select a connection | Recipient list shown, collapsed by default |
| 3 | Step 2 -- Gift Note: Type a gift message | Text area auto-expands when connection selected |
| 4 | Step 3 -- Payment: Review payment method | Payment section shown |
| 5 | Step 4 -- Order Summary: Verify subtotal, $6.99 shipping, gifting fee, grand total | All line items correct |
| 6 | Click "Place your order" | Redirected to Stripe checkout |
| 7 | Pay with test card | Success page shown |
| 8 | Check Stripe Dashboard | `gift_message` and `recipient_id` in session metadata |
| 9 | Check confirmation email | Address masked for gift; gift message preserved |

**Also test:** Try clicking "Place your order" without selecting a recipient -- button should be disabled.

---

## Flow 4: Scheduled Gift (via Buy Now or Checkout)

**Route:** Buy Now drawer -> "Schedule Gift" option, OR `/checkout` with scheduling

| Step | Action | Expected |
|------|--------|----------|
| 1 | Open Buy Now drawer on any product | Drawer opens |
| 2 | Select a connection as recipient | Recipient selected |
| 3 | Click the "Schedule Gift" option | `UnifiedGiftSchedulingModal` opens |
| 4 | Pick a date 30+ days in the future | Date accepted (must be 7+ days out) |
| 5 | Verify the summary shows "Scheduled for: [date]" | Correct date displayed |
| 6 | Complete checkout via Stripe | Success page shown |
| 7 | Check Stripe Dashboard | `capture_method: manual` (funds authorized, not captured) |
| 8 | Check order in database | `status = 'scheduled'`, `scheduled_delivery_date` set |

**Trunkline verification (see Flow 5B below):** Use the scheduler to simulate payment capture and fulfillment without waiting.

---

## Flow 5: Recurring Auto-Gift Setup

**Route:** Connection profile or gifting settings -> Set up recurring rule

| Step | Action | Expected |
|------|--------|----------|
| 1 | Navigate to a connection's gifting settings | Auto-gift options visible |
| 2 | Enable auto-gifting for a holiday (e.g., Birthday, Christmas) | Toggle activates |
| 3 | Set a budget (e.g., $50) | Budget saved |
| 4 | Choose gift source: Wishlist, AI, or Both | Selection saved |
| 5 | Save the rule | Confirmation toast shown |
| 6 | Check email | "Auto-Gift Rule Created" confirmation received |

**This rule won't fire until T-7 before the event.** Use Trunkline to test it immediately (see below).

---

## Trunkline Scheduler: Testing Without Waiting

Navigate to `/trunkline/auto-gift-testing` to manually trigger the auto-gift and scheduled order pipelines.

### 5A: Test Auto-Gift Execution (Recurring Gifts)

This simulates the T-7 -> T-4 -> T-3 pipeline that normally runs on cron.

| Step | Action | What it does |
|------|--------|--------------|
| 1 | (Optional) Paste a specific User ID in the filter field | Limits testing to one user |
| 2 | Set the **Orchestrator date** field to 7 days before the event (e.g., if Birthday is Mar 15, enter `2026-03-08`) | Simulates "today" as T-7 |
| 3 | Click **"Run Orchestrator"** | Finds matching auto-gift rules, creates execution records, sends approval emails |
| 4 | Check the **Live Execution Monitor** below | New execution should appear with status `pending` or `awaiting_address` |
| 5 | Check email for the approval notification | "Auto-Gift Approval Needed" email with Approve/Reject links |
| 6 | Click **"Approve"** in the email | Execution status updates to `approved` |
| 7 | Click **"Create Executions"** then **"Process Executions"** | Creates checkout session and processes payment |
| 8 | Check the **Scheduled Orders** panel | Order should appear with status `scheduled` |
| 9 | Set the **Scheduler date** field to the event date minus 3 days (e.g., `2026-03-12`) | Simulates T-3 for fulfillment |
| 10 | Click **"Run Scheduler"** | Captures payment and submits to Zinc |
| 11 | Check order status | Should move to `processing` |

### 5B: Test Scheduled Gift Processing (One-Time Scheduled Gifts)

After creating a scheduled gift in Flow 4:

| Step | Action | What it does |
|------|--------|--------------|
| 1 | Find your scheduled order in the **Scheduled Orders** panel | Should show with future delivery date |
| 2 | Set the **Scheduler date** field to 7 days before the scheduled delivery date | Simulates T-7 (payment capture) |
| 3 | Click **"Run Scheduler"** | Captures the held payment (changes from authorized to captured) |
| 4 | Verify in Stripe Dashboard | Payment intent status: `succeeded` (captured) |
| 5 | Set the **Scheduler date** to 3 days before delivery | Simulates T-3 (Zinc submission) |
| 6 | Click **"Run Scheduler"** again | Submits order to Zinc for fulfillment |
| 7 | Check order status | Should be `processing` |

### Trunkline Quick Reference

| Button | What it triggers | When to use |
|--------|-----------------|-------------|
| **Create Executions** | `auto-gift-orchestrator` daily check | Find rules with upcoming events |
| **Process Executions** | Processes approved executions into orders | After approving via email |
| **Run Scheduler** (with date) | `scheduled-order-processor` with simulated date | Capture payments and submit to Zinc |
| **Run Orchestrator** (with date) | `auto-gift-orchestrator` with simulated date | Pretend "today" is a different date |
| **Refresh Data** | Reloads all panels | After any action |

---

## Quick Checklist

| # | Flow | Key Verification |
|---|------|-----------------|
| 1 | Standard Checkout | Order created, payment captured, full address in email |
| 2 | Wishlist Purchase | Recipient pre-filled, address masked in sender email |
| 3 | Buy Now Gift | Gift message in Stripe metadata, address masked |
| 4 | Scheduled Gift | `capture_method: manual`, use Trunkline to process |
| 5 | Recurring Auto-Gift | Rule created, use Trunkline orchestrator + scheduler to simulate full lifecycle |

