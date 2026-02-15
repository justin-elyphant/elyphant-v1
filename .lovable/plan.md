

## Compact Unified Header (Etsy-Inspired)

### Goal
Reduce the overall header height by ~30% and make both rows feel like one seamless component, matching Etsy's compact, unified aesthetic.

### What Changes

**1. Shrink the logo (ElyphantTextLogo.tsx)**
- Reduce container from `h-16 lg:h-20` to `h-10 lg:h-12`
- Reduce icon from `h-10 lg:h-16` to `h-7 lg:h-9`
- Reduce text from `text-xl lg:text-3xl` to `text-lg lg:text-xl`
- This alone saves ~20-30px of vertical space

**2. Reduce main row height (useHeaderState.ts)**
- Change `height` from `h-16 md:h-20` to `h-12 md:h-14`
- This trims the primary row from 64-80px down to 48-56px

**3. Tighten the category strip (ModernHeaderManager.tsx)**
- Change category row from `py-2` to `py-1`
- Remove or soften the `border-t border-gray-100` divider to make it feel continuous (use a very subtle one or remove entirely)
- The two rows will read as one unified band rather than stacked sections

**4. Compact the mobile search row**
- Reduce mobile search row padding from `py-3` to `py-2` for consistency

### What Stays the Same
- All functionality (search, categories, heart, cart, auth)
- Etsy-style layout (search in top row, categories below)
- Mobile and tablet layouts (just slightly tighter)
- All routing and component logic

### Visual Comparison

```text
BEFORE (estimated ~120px total):
| Logo(80px row) | ---Search--- | Heart Cart Auth |   ← h-20
|--- border-t ---|                                     
|  Beauty | Electronics | ... | Shop All |             ← py-2 (~44px)

AFTER (estimated ~80px total):
| Logo(56px row) | ---Search--- | Heart Cart Auth |   ← h-14
| Beauty | Electronics | Fashion | ... | Shop All |   ← py-1 (~32px)
```

### Technical Details

**Files to modify:**

1. **`src/components/ui/ElyphantTextLogo.tsx`** - Shrink container, icon, and text sizes
2. **`src/hooks/useHeaderState.ts`** - Reduce `height` config from `h-16 md:h-20` to `h-12 md:h-14`
3. **`src/components/navigation/ModernHeaderManager.tsx`** - Tighten category strip padding, soften/remove divider border, compact mobile search padding

