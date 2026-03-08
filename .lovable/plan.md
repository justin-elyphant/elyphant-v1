

## Plan: Post-Submission Confirmation + Lululemon Style Overhaul

### Current Issues
The vendor portal uses SaaS-style colors (blue buttons, green submit, slate backgrounds) that conflict with the Lululemon-inspired design system used across the consumer app: monochromatic grey/black/white with red (#DC2626) accent for CTAs only.

### Changes to `src/components/vendor/auth/VendorPortalAuth.tsx`

**1. Add post-submission confirmation state**
- Add `submitted` boolean state
- On successful signup, set `submitted = true`
- When `submitted` is true, render a confirmation view:
  - CheckCircle icon, "Application Submitted!" heading
  - Message: "We'll review your application and notify you by email once approved."
  - Auto-redirect to `/` after 5 seconds via `useEffect`
  - Manual "Back to Elyphant" button

**2. Restyle to Lululemon monochromatic design**
- Background: `bg-[#F7F7F7]` instead of `bg-slate-100`
- Card: `rounded-none` border style, clean white
- Heading: black text (`text-foreground`), not `text-slate-800`
- Labels: `text-foreground` instead of `text-slate-700`
- Sign In button: `bg-black hover:bg-gray-800 text-white` (not blue)
- Apply button: `bg-red-600 hover:bg-red-700 text-white` (red accent for primary CTA)
- Forgot password link: `text-foreground` with underline, not blue
- Tab triggers: neutral styling consistent with monochromatic palette
- Confirmation page "Back to Elyphant" button: `bg-black text-white`
- Remove all blue-600/green-600 color references

