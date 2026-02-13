

# Add "Ship to a Connection" in Buy Now Drawer

## What Changes

Transform the "Ship to" row from a static button (that redirects to /settings) into a collapsible inline picker -- identical in pattern to the existing "Pay with" card picker. Users can quickly switch between shipping to themselves or to a connection with a verified address.

## How It Works

1. User taps the "Ship to" row to expand the address picker
2. First option: "Ship to Myself" (user's default address) -- pre-selected
3. Below: Top 3 accepted connections **that have a verified shipping address** (no address = not shown)
4. Each connection shows their name and privacy-masked address (City, State only)
5. Selecting a connection updates the shipping info passed to `create-checkout-session`
6. No gift message, no scheduling -- that remains the "Schedule Gift" flow

## Visual Flow

```text
+----------------------------------+
| Ship to                          |
|  John, 123 Main St, NYC, NY [v]  |
|----------------------------------|
|  > Ship to Myself           [check]  |
|    John, 123 Main..., NYC, NY    |
|  > Sarah                         |
|    Denver, CO                    |
|  > Mike                          |
|    Austin, TX                    |
|----------------------------------|
```

## What This Does NOT Do

- No gift messages (use Schedule Gift for that)
- No delivery scheduling (use Schedule Gift for that)
- No invite new recipient (too complex for quick Buy Now)
- No pending/unverified connections shown
- Does not change the "Schedule Gift" button behavior

## Technical Details

### File: `BuyNowDrawer.tsx`

1. **New state**:
   - `addressPickerOpen` (boolean) -- controls collapsible
   - `selectedRecipient` (object) -- tracks who we're shipping to: `{ type: 'self' | 'connection', name, address, connectionId }`

2. **New hook usage**: Import and use `useEnhancedConnections` to fetch accepted connections with addresses

3. **Filter connections**: Only show connections where `profile_shipping_address` exists and has at least `city` and `state` populated (verified address requirement)

4. **Replace "Ship to" button**: Convert from a `<button onClick={handleGoToSettings}>` to a `<Collapsible>` with:
   - Trigger: Same visual row (MapPin icon, address text, chevron)
   - Content: List of options (self + connections with verified addresses)

5. **Update shipping info resolution**: When `selectedRecipient.type === 'connection'`, the `handlePlaceOrder` function uses the connection's address instead of `defaultAddress` in the `shippingInfo` object and sets `delivery_scenario: "gift"` in metadata

6. **Privacy masking**: Connection addresses display as "Name, City, State" only (no street/ZIP per existing privacy standard)

7. **Limit to 3 connections**: Match the SimpleRecipientSelector pattern of showing top 3 most recently added

### No new components needed
- Reuses existing `Collapsible` pattern already in the drawer
- Reuses `useEnhancedConnections` hook already in the codebase
- Reuses `EnhancedConnection` type with `profile_shipping_address`

### No backend changes
- `create-checkout-session` already accepts arbitrary `shippingInfo` -- we just pass the connection's address instead of the user's

