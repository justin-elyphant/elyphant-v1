

# Bank Typography & Iconography Strategy to plan.md

Append a new section **"Vendor Portal UI/UX — Typography & Iconography"** after the Vendor Operations Strategy section (line 288), before the Completed Plans section.

## Content to Bank

### Typography
- **Dual-font system**: Plus Jakarta Sans (or Geist) for headings/UI elements, Inter for body text
- Add `font-display` family to `tailwind.config.ts`
- Type scale: `text-2xl font-semibold tracking-tight` for page titles, `text-xs uppercase tracking-wider` for table headers, `tabular-nums` for metrics
- Scoped to vendor portal only — consumer app unchanged

### Iconography
- Standardize Lucide icons: `size={18}`, `strokeWidth={1.5}` (thinner/more elegant)
- Color: `text-slate-400` default, `text-slate-700` on hover/active — no brand blue in nav
- Create `VendorIcon.tsx` wrapper component for consistency
- Only metric trend indicators and status dots get color (green/red)

### Files to Create/Modify
- `src/index.css` — Google Font import for Plus Jakarta Sans
- `tailwind.config.ts` — add `font-display` family
- `src/components/vendor/layout/VendorIcon.tsx` — icon wrapper component

