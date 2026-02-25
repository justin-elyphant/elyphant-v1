

# Fix: Inline Add-Card in Buy Now Drawer + Auto-Save

## Problem

When a user has a shipping address but no saved payment method, the Buy Now drawer shows a dead-end "Go to Settings" screen. The inline Stripe card form already exists inside the payment collapsible (lines 443-487) and already saves cards via the `save-payment-method` edge function -- it's just unreachable because the entire drawer UI is gated behind `defaultAddress && activePayment` (line 289).

## Solution

Three surgical changes in `BuyNowDrawer.tsx`:

### 1. Relax the main gate (line 289)

Change from:
```
) : (defaultAddress && activePayment) ? (
```
to:
```
) : defaultAddress ? (
```

This lets the full 3-step drawer render when the user has an address but no card yet.

### 2. Auto-open the payment section when no card exists

Add a `useEffect` after the existing sync effect (after line 112):

```tsx
useEffect(() => {
  if (!paymentLoading && !activePayment && defaultAddress) {
    setPaymentPickerOpen(true);
    setShowAddCardForm(true);
  }
}, [paymentLoading, activePayment, defaultAddress]);
```

This immediately shows the Stripe card form so the user doesn't have to click through two levels to find it.

### 3. Update the payment trigger label for empty state (line 418)

Change from:
```
<p className="text-sm">{formatCard()}</p>
```
to:
```
<p className="text-sm">{activePayment ? formatCard() : 'Add a payment method'}</p>
```

### 4. Simplify the fallback (lines 520-539)

The fallback now only handles the missing-address case:

```tsx
) : (
  <div className="py-4 text-center">
    <p className="text-sm text-muted-foreground mb-3">
      Add a shipping address to use Buy Now
    </p>
    <Button
      variant="outline"
      className="min-h-[44px]"
      onClick={() => { onOpenChange(false); navigate("/settings"); }}
    >
      Go to Settings
    </Button>
  </div>
)}
```

### 5. Footer CTA remains gated (line 544 -- no change)

The "Place your order" button already requires `defaultAddress && activePayment`, so it only appears after the user saves a card. No change needed.

## Card Saving Already Works

The existing `onSuccess` callback (lines 457-469) already:
1. Calls `save-payment-method` edge function (via `UnifiedPaymentForm` setup mode)
2. Refreshes the payment methods list from the database
3. Auto-selects the newly added card as `selectedPaymentMethod`

So the card persists and won't be asked for again on the next Buy Now.

## Scope

1 file: `BuyNowDrawer.tsx`. 4 small edits. No backend changes.

