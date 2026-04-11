

## Give Superadmin Access to Vendor Portal

### Problem
The VendorGuard blocks non-vendors from `/vendor` routes by checking for a `vendor` role in `user_roles` and `isVendor` from user context. Your account (justin@elyphant.com) is an employee/admin but not a vendor, so you get blocked.

### Solution (3 changes)

**1. Update VendorGuard to allow employees through**
Modify `src/components/vendor/auth/VendorGuard.tsx` to check `isEmployee` from the auth context. If the user is an employee, grant access immediately without requiring a vendor role. This is the cleanest approach -- no fake vendor roles needed, and any employee can inspect the vendor portal.

**2. Add "Vendor Portal" link to avatar dropdown**
In `src/components/auth/UserButton.tsx`, add a "Vendor Portal" menu item in the employee section (next to the existing Trunkline link), using a `Store` icon. This appears in both mobile and desktop dropdowns when `isEmployee` is true.

**3. No database changes needed**
Since we're bypassing the vendor check for employees, no role insertion is required.

### Technical details

- **VendorGuard.tsx**: Import `useAuth`, check `isEmployee` early in the access check. If true, set `accessStatus = 'allowed'` and skip all vendor-specific checks.
- **UserButton.tsx**: Add `Store` icon import from lucide-react, add a `DropdownMenuItem` navigating to `/vendor` in both mobile (line ~320) and desktop (line ~455) employee sections.

