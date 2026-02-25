

# Unify Buy Now Recipient Selection with SimpleRecipientSelector

## Problem

The Buy Now drawer has a hand-rolled recipient list (lines 300-377 in `BuyNowDrawer.tsx`) that:
- Only shows connections that already have addresses on file
- Has no search capability
- Has no "Invite New Recipient" option
- Has no "Assign Later" option
- Duplicates logic that `SimpleRecipientSelector` already handles well

Meanwhile, `SimpleRecipientSelector` already provides exactly what you're asking for:
- Search bar to find connections
- Top 3 connections shown by default, with "search to find more" hint
- Inline "Invite New Recipient" form (name + email → sends invitation)
- "Ship to Myself" option
- Pending invitation visibility during search
- Haptic feedback, scroll-into-view, avatar display

The fix is to replace the hand-rolled recipient section in the drawer with the `SimpleRecipientSelector` component.

## Changes

### File: `src/components/marketplace/product-details/BuyNowDrawer.tsx`

**1. Import `SimpleRecipientSelector` and its type:**

Add import for the shared component (already used in `UnifiedRecipientSelection` and `UnifiedGiftSchedulingModal`).

**2. Replace the recipient Collapsible internals (lines 300-378):**

Remove the hand-rolled "Myself" button and `connectionsWithAddress.map(...)` loop. Replace the `CollapsibleContent` body with:

```tsx
<CollapsibleContent>
  <div className="py-2 border-b border-border">
    <SimpleRecipientSelector
      value={selectedRecipient ? {
        type: selectedRecipient.type,
        connectionId: selectedRecipient.connectionId,
        connectionName: selectedRecipient.name,
        shippingAddress: selectedRecipient.address ? {
          name: selectedRecipient.name,
          address: selectedRecipient.address.address_line1 || '',
          city: selectedRecipient.address.city || '',
          state: selectedRecipient.address.state || '',
          zipCode: selectedRecipient.address.zip_code || '',
          country: selectedRecipient.address.country || 'US',
        } : undefined,
      } : null}
      onChange={(selected) => {
        // Map SimpleRecipientSelector output back to drawer's format
        handleSelectRecipient({
          type: selected.type === 'self' ? 'self' : 'connection',
          name: selected.connectionName || userName,
          address: selected.shippingAddress ? {
            ...selected.shippingAddress
          } : defaultAddress?.address,
          connectionId: selected.connectionId,
        });
      }}
      userAddress={defaultAddress?.address}
      userName={defaultAddress?.name || 'Myself'}
      onInviteNew={(name, email) => {
        // Handle invite - creates pending connection
        toast.info(`Invitation sent to ${email}`);
      }}
    />
  </div>
</CollapsibleContent>
```

**3. Remove the `connectionsWithAddress` dependency** from the drawer if it's only used for the recipient list. The `SimpleRecipientSelector` fetches its own connections via `useEnhancedConnections`.

**4. Adjust the `SimpleRecipientSelector` to render inline (no outer Collapsible):**

Since the Buy Now drawer already wraps this section in its own `Collapsible`, the `SimpleRecipientSelector` should render in an "always open" mode when embedded. Add an optional `embedded` prop:

```tsx
// SimpleRecipientSelector.tsx
interface SimpleRecipientSelectorProps {
  // ...existing props
  embedded?: boolean; // When true, skip the outer Collapsible wrapper
}
```

When `embedded={true}`:
- Skip the outer `Collapsible` + trigger `Button`
- Render the inner content directly (search, connections list, invite form)
- The parent controls open/close state

This avoids a nested collapsible-inside-collapsible situation.

## Technical Details

### Data mapping

The Buy Now drawer uses its own `selectedRecipient` shape:
```ts
{ type: 'self' | 'connection', name: string, address: {...}, connectionId?: string }
```

`SimpleRecipientSelector` uses `SelectedRecipient`:
```ts
{ type: 'self' | 'connection' | 'later', connectionId?, connectionName?, shippingAddress?, addressVerified? }
```

A thin adapter in the `onChange` handler converts between them. No new types needed.

### What this removes from BuyNowDrawer
- ~75 lines of hand-rolled recipient UI (lines 321-377)
- The `connectionsWithAddress` filtering logic (if not used elsewhere in the file)
- The address-gating that hid connections without addresses

### What users gain
- Search bar to find any connection by name
- "Invite New Recipient" inline form right in the Buy Now flow
- Visibility of pending invitations when searching
- "+N more" hint showing they have more connections
- Consistent experience across Buy Now, Cart, and Schedule Gift

## Scope
- 2 files modified: `BuyNowDrawer.tsx` (replace recipient section), `SimpleRecipientSelector.tsx` (add `embedded` prop)
- No backend changes
- No new dependencies

