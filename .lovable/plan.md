

## Fix: "Checkout Address" Used as Recipient Name in Zinc Orders

### Root Cause

Two issues combine to produce the bug:

1. **`useCheckoutState.tsx` line 347** — `saveCurrentAddressToProfile` defaults the address label to `'Checkout Address'` when no name is passed. This gets stored as `user_addresses.name`.

2. **`BuyNowDrawer.tsx` line 155** — For "Ship to Myself" orders, `shippingInfo.name` is set to `defaultAddress.name`, which is the address *label* (e.g. "Checkout Address", "Home", "Work") — not the buyer's actual name.

3. **`process-order-v2` line 385** — Splits `shippingInfo.name` into `first_name`/`last_name` for Zinc, so "Checkout Address" becomes `first_name: "Checkout"`, `last_name: "Address"`.

### Fix (2 files)

**File 1: `src/components/marketplace/product-details/BuyNowDrawer.tsx`** (~3 lines)

For "Ship to Myself" orders, use the authenticated user's profile name instead of the address label:

```text
Current (line 154-155):
  name: defaultAddress!.name,

Fix:
  // For self-purchases, use the buyer's actual name from auth, not the address label
  const userProfile = user?.user_metadata;
  const buyerName = [userProfile?.first_name, userProfile?.last_name].filter(Boolean).join(' ');

  // In shippingInfo (self case):
  name: buyerName || defaultAddress!.name,
```

This ensures Zinc gets "Justin Meeks" instead of "Checkout Address" for self-shipments.

**File 2: `src/components/marketplace/checkout/useCheckoutState.tsx`** (~1 line)

Change the default address label from `'Checkout Address'` to something that won't be confused with a person's name:

```text
Current (line 347):
  const saveCurrentAddressToProfile = async (name: string = 'Checkout Address', ...

Fix:
  const saveCurrentAddressToProfile = async (name: string = 'Home', ...
```

This prevents future addresses from being saved with a misleading label.

### What This Fixes

- Zinc orders will have the buyer's real name (from user metadata) on "Ship to Myself" orders
- Gift orders already use `selectedRecipient.name` (line 147), which is correct
- Future saved addresses default to "Home" instead of "Checkout Address"
- No edge function changes needed — `process-order-v2` correctly splits whatever name it receives

