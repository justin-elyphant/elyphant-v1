

# Fix: Gift Note Textarea Unusable on Mobile When Keyboard Opens

## Problem
On iPhone (live site), tapping the gift note textarea opens the keyboard, which pushes the drawer content up. The textarea scrolls out of view, leaving only the order total and "Place your order" button visible. The user can't see what they're typing.

## Root Cause
The drawer content area has `overflow-y-auto` but the iOS keyboard resize doesn't trigger a scroll-into-view for the focused textarea. The `max-h-[85vh]` on `DrawerContent` doesn't account for the reduced viewport when the keyboard is open.

## Solution
Two changes to `BuyNowDrawer.tsx`:

1. **Auto-scroll textarea into view on focus**: Add an `onFocus` handler to the `Textarea` that calls `scrollIntoView()` after a short delay (to let the keyboard finish animating). This ensures the textarea stays visible when the user taps it.

2. **Adjust drawer max-height for keyboard**: Use `visualViewport` API to detect keyboard presence and reduce the drawer height dynamically. Add a `useEffect` that listens to `window.visualViewport.resize` events and updates a CSS variable or inline style on the drawer content.

## Technical Changes

### File: `src/components/marketplace/product-details/BuyNowDrawer.tsx`

**1. Add a ref for the textarea and scroll-into-view on focus:**

```typescript
const textareaRef = React.useRef<HTMLTextAreaElement>(null);

const handleTextareaFocus = () => {
  // Delay to let iOS keyboard finish animating
  setTimeout(() => {
    textareaRef.current?.scrollIntoView({ 
      behavior: 'smooth', 
      block: 'center' 
    });
  }, 300);
};
```

Apply to the Textarea:
```tsx
<Textarea
  ref={textareaRef}
  onFocus={handleTextareaFocus}
  value={giftNote}
  onChange={...}
  // also add font-size: 16px to prevent iOS zoom
  className="text-sm min-h-[72px] resize-none text-[16px]"
  style={{ fontSize: '16px' }}
/>
```

**2. Add VisualViewport listener for keyboard-aware height:**

```typescript
const [drawerMaxHeight, setDrawerMaxHeight] = useState('85vh');

useEffect(() => {
  if (!open) return;
  const vv = window.visualViewport;
  if (!vv) return;

  const onResize = () => {
    const ratio = vv.height / window.innerHeight;
    // If keyboard is open (viewport shrunk significantly)
    if (ratio < 0.75) {
      setDrawerMaxHeight(`${vv.height - 20}px`);
    } else {
      setDrawerMaxHeight('85vh');
    }
  };

  vv.addEventListener('resize', onResize);
  return () => vv.removeEventListener('resize', onResize);
}, [open]);
```

Apply to DrawerContent:
```tsx
<DrawerContent 
  className="flex flex-col"
  style={{ maxHeight: drawerMaxHeight }}
>
```

**3. Prevent iOS zoom on textarea** by ensuring `font-size: 16px` (iOS auto-zooms inputs below 16px).

These three changes together ensure:
- The textarea stays visible when the keyboard opens
- The drawer resizes to fit the reduced viewport
- iOS doesn't auto-zoom the input field
