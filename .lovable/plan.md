

# Navigation Link Audit and Rebalancing

## Problem

Several key e-commerce links are unreachable or hard to find on mobile and tablet:
- **Orders**: zero entry points on mobile/tablet (desktop sidebar only)
- **Notifications**: badge shows on avatar but no link in mobile dropdown
- **Connections**: desktop sidebar only
- **Mobile avatar dropdown**: too sparse (Dashboard, Settings, Sign Out) vs. desktop (Profile, Payments, Help)
- **Bottom nav active gradient**: purple-blue gradient violates monochromatic design system

## Solution

### 1. Enrich the Mobile Avatar Dropdown

Currently the mobile dropdown (UserButton.tsx, lines 139-208) only shows Dashboard, Settings, and Sign Out. Add the missing links to match the desktop experience:

**New mobile dropdown structure:**
```
[Avatar + Name + Email]
---
Dashboard
Orders          <-- NEW
Connections     <-- NEW  (with pending badge)
Notifications   <-- NEW  (with unread badge)
---
My Profile
Account Settings
Payment Methods
Help & Support
---
(Trunkline - employee only)
---
Sign Out
```

**File: `src/components/auth/UserButton.tsx`**
- Replace the sparse mobile dropdown (lines 139-208) with a richer version
- Add profile header (avatar + name + email) matching desktop
- Add Orders, Connections, Notifications links with badge counts
- Add Profile, Payment Methods, Help links
- Keep Dashboard, Settings, Trunkline, Sign Out

### 2. Fix Bottom Nav Active State (Monochromatic)

**File: `src/components/navigation/MobileBottomNavigation.tsx`**
- Line 113: Replace `bg-gradient-to-r from-purple-600 to-sky-500 text-white` with `bg-black text-white` (monochromatic, Lululemon-style)
- This aligns with the design system: grey background, black active state, red for CTAs only

### 3. No structural changes to bottom nav tabs

The 5-tab structure (Shop, Recurring, Wishlists, Messages, Account) is solid for a gifting-focused e-commerce app. Orders belongs in the avatar dropdown (Amazon and Target both put Orders behind the account menu on mobile, not in the tab bar). Adding a 6th tab would violate iOS HIG.

### 4. No changes to desktop sidebar or header

The desktop sidebar already has all links properly organized. The header icons (Wishlists heart, Cart) are appropriately placed.

## Technical Details

### UserButton.tsx Mobile Dropdown Changes

Replace the mobile return block (lines 139-208) with:
- Add `useConnectionsAdapter` and `useNotifications` imports (already imported but unused in mobile path)
- Profile header section with avatar, name, email
- Shopping section: Dashboard, Orders (with Package icon)
- Social section: Connections (with pending count badge), Notifications (with unread count badge)
- Account section: My Profile, Account Settings, Payment Methods, Help and Support
- Footer: Trunkline (employee), Sign Out

### MobileBottomNavigation.tsx Active State

Single line change on line 113:
- From: `"bg-gradient-to-r from-purple-600 to-sky-500 text-white"`
- To: `"bg-black text-white"`

## What This Fixes

- Orders: now 1 tap away (avatar -> Orders) on mobile and tablet
- Notifications: now accessible from mobile dropdown with badge count
- Connections: now accessible from mobile dropdown with pending count
- Profile, Payments, Help: now available on mobile (were desktop-only)
- Active tab style: monochromatic, aligned with Lululemon design system

## Files Modified

1. `src/components/auth/UserButton.tsx` -- enrich mobile dropdown
2. `src/components/navigation/MobileBottomNavigation.tsx` -- fix active state color

