

# Inline "Add New Card" in Buy Now Drawer

## What Changes

Replace the "Manage payment methods" link at the bottom of the card picker with an "Add new card" option that reveals a Stripe card input form directly inside the drawer — no navigation away.

## How It Works

1. User taps "Pay with" to expand the card picker
2. Below the list of saved cards, they see "+ Add new card" instead of "Manage payment methods"
3. Tapping it reveals the Stripe CardElement form inline (cardholder name + card input + "Save Card" button)
4. On success, the new card is saved via the existing `save-payment-method` edge function, added to the list, and auto-selected
5. User can tap "Cancel" to collapse the form and go back to the card list

## Visual Flow

```text
+----------------------------------+
| Pay with                         |
|  Visa ····4242              [v]  |
|----------------------------------|
|  > Visa ····4242            [✓]  |
|  > Mastercard ····5555           |
|  + Add new card                  |
|----------------------------------|
```

After tapping "+ Add new card":

```text
|----------------------------------|
|  Cardholder Name                 |
|  [___________________________]   |
|  Card Information                |
|  [Card Element from Stripe]      |
|  [Save Card]        [Cancel]     |
|----------------------------------|
```

## Technical Details

### File: `src/components/marketplace/product-details/BuyNowDrawer.tsx`

1. **New imports**: Add `Elements` from `@stripe/react-stripe-js`, `stripeClientManager`, and `UnifiedPaymentForm`

2. **New state**: `showAddCardForm` boolean to toggle between card list and inline form

3. **Replace "Manage payment methods" button** with two elements:
   - "+ Add new card" button that sets `showAddCardForm = true`
   - When `showAddCardForm` is true, render the `UnifiedPaymentForm` wrapped in `<Elements>` in `mode="setup"`

4. **Success handler**: When a card is saved successfully:
   - Call `save-payment-method` edge function (already handled by `UnifiedPaymentForm`)
   - Re-fetch payment methods from the database
   - Auto-select the newly added card
   - Collapse the form back to the card list

5. **Cancel handler**: Simply sets `showAddCardForm = false` to return to the card list

### No new dependencies needed
- `Elements` provider and `UnifiedPaymentForm` already exist in the codebase
- `stripeClientManager` singleton already initialized
- `save-payment-method` edge function already deployed

### No backend changes
- The existing `save-payment-method` edge function handles everything (Stripe attach + DB insert)

