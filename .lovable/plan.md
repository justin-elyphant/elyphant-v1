
# Cookie Consent Banner Redesign — Lululemon Style

## What's Wrong With the Current Design

The screenshot shows a classic SaaS-style cookie dialog: rounded card floating in the center-bottom, a colored cookie icon with a tinted background, `text-primary` blue links, and default shadcn Button styling. None of this matches the site's aesthetic.

The site uses:
- `bg-white/80 backdrop-blur-xl border-t border-border` for the bottom nav (flat, white, subtle border-top, no rounded card floating)
- `bg-foreground text-background` (black pill) for the active nav tab — that's the primary action style
- `text-muted-foreground` for secondary labels, no colored icons
- No floating card shadows for bottom-anchored UI — the bottom nav is flush/edge-anchored with a top border only
- `rounded-t-2xl` for the mobile nav's top corners only, not a fully rounded floating card

## Design Direction

Replace the SaaS floating card with a **flat, flush bottom bar** — same visual language as the mobile bottom navigation. It should feel like a native site element, not a third-party popup.

Key changes:
- **No floating card** — replace with a flat `bg-white border-t border-border` bar flush to the bottom (above the mobile nav)
- **No cookie icon or colored icon background** — remove entirely
- **No `text-primary` blue links** — replace "More info" toggle with plain underline text in `text-foreground`
- **"Accept All" button** → `bg-foreground text-background` (black, matches active nav tab style)
- **"Essential Only" button** → `border border-border text-foreground bg-transparent` (clean outline, no colored border)
- **Expanded detail section** → plain `bg-gray-50 border border-border rounded-md` (no `bg-muted/50` tint)
- **X dismiss button** → keep but use `text-muted-foreground`, no hover color change needed
- **Mobile offset** → keep `mb-16 lg:mb-0` so it clears the bottom nav on mobile, but strip card border-radius to `rounded-none` on mobile and `rounded-t-xl` on desktop if centered

## Files to Modify

**One file only:**
- `src/components/legal/CookieConsentBanner.tsx`

## Exact Changes

### Structure
```
Fixed bottom bar (not a card):
├── border-t border-border
├── bg-white (not bg-background which can be dark-mode aware — this stays white like the nav)
├── px-4 py-3
└── max-w-screen — full width on mobile, constrained inner content max-w-2xl on desktop

Inner layout (same flex pattern as current):
├── Left: text block (title + description + expand toggle)
├── Right: action buttons (Accept All black pill | Essential Only outline) + X
```

### Color / Class Mapping

| Current | New |
|---|---|
| `bg-background border border-border rounded-xl shadow-lg` | `bg-white border-t border-border` (flush bar) |
| `bg-primary/10 rounded-lg p-2` + Cookie icon | Remove entirely |
| `text-primary underline` (More info link) | `text-foreground underline underline-offset-2` |
| `<Button size="sm">` (default primary) | `bg-foreground text-background hover:bg-foreground/90 text-xs h-9 px-4 rounded-full font-medium` |
| `<Button size="sm" variant="outline">` | `border border-border text-foreground bg-white hover:bg-gray-50 text-xs h-9 px-4 rounded-full` |
| `bg-muted/50 rounded-lg` (expanded detail) | `bg-gray-50 border border-border rounded-md` |
| `text-primary hover:underline` (Privacy Policy link) | `text-foreground underline underline-offset-2` |
| `mb-16 md:mb-0 mx-4 mb-4` wrapper (floating) | `pb-16 lg:pb-0` on the fixed bar itself (no `mx-4` — full width) |

### Motion
Keep the existing `framer-motion` slide-up animation — it's appropriate. Just change `y: 100` to a shorter slide (`y: 60`) since the bar is shorter than the card was.

### Mobile offset
The bar sits directly above the mobile bottom nav. Since the bottom nav is `h-14` (56px), the banner uses `pb-14 lg:pb-0` to clear it, same pattern as how other overlays handle the nav.

## Result

The redesigned banner will look like a natural extension of the bottom navigation — a thin white strip with a top divider, black pill CTA, and clean typography. No SaaS popup feel, fully consistent with the Lululemon monochromatic system.
