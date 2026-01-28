

# Fix: Gift Message Input Losing Focus After 2-3 Characters

## Problem Analysis

When typing in the gift message textarea on desktop, the input loses focus after typing just 2-3 characters. The session replay and code analysis confirm this is a **React component identity issue**.

### Root Cause

Lines 485-686 define `ModalContent` as an **inline arrow function**:

```typescript
const ModalContent = () => (
  <div className="space-y-5">
    {/* ... textarea is nested deep inside ... */}
    <Textarea
      value={giftMessage}
      onChange={(e) => setGiftMessage(e.target.value)}
    />
  </div>
);
```

**What happens:**
1. User types a character → `setGiftMessage('Ha')` called
2. Parent component re-renders
3. `ModalContent` arrow function is **recreated** (new function reference)
4. React sees a "different" component → **unmounts** old tree, **mounts** new tree
5. Textarea loses focus because it's a brand new DOM element

This is a well-known React anti-pattern: defining components inside render functions.

---

## Solution

**Convert the inline `ModalContent` function into direct JSX** by removing the wrapper function and inlining the content directly where it's used (lines 733 and 754).

### Current Architecture (Problematic)
```typescript
// Inside component body - recreated every render!
const ModalContent = () => (
  <div className="space-y-5">...</div>
);

// Used in both mobile and desktop:
<div className="overflow-y-auto">
  <ModalContent />  {/* ← Treated as new component each render */}
</div>
```

### Fixed Architecture
```typescript
// Define the JSX content once as a variable (not a function)
const modalContent = (
  <div className="space-y-5">
    {/* ... all the recipient selector, date picker, textarea, etc ... */}
  </div>
);

// Use the variable directly (same object reference):
<div className="overflow-y-auto">
  {modalContent}  {/* ← Same JSX object, stable identity */}
</div>
```

---

## Technical Changes

### File: `src/components/gifting/unified/UnifiedGiftSchedulingModal.tsx`

| Location | Change |
|----------|--------|
| Lines 484-686 | Convert `const ModalContent = () => (...)` to `const modalContent = (...)` |
| Lines 688-708 | Convert `const FooterButtons = ({className}) => (...)` to `const footerButtons = (className?: string) => (...)` or inline |
| Line 733 | Change `<ModalContent />` to `{modalContent}` |
| Line 755 | Change `<ModalContent />` to `{modalContent}` |
| Lines 737, 759 | Update footer button references as needed |

---

## Why This Works

| Approach | Function Identity | Component Tree |
|----------|-------------------|----------------|
| `const ModalContent = () => <div>...` | **New function each render** | Unmounts/remounts |
| `const modalContent = <div>...` | **Same JSX object** | Updates in place |

When the JSX is stored as a variable (not wrapped in a function), React sees the same object reference and performs a normal **update** instead of an **unmount/remount**. The textarea remains in the DOM and retains focus.

---

## Expected Result

- **Before**: Typing "Ha" causes focus loss, textarea unmounts/remounts
- **After**: Typing works normally, textarea stays focused and responsive

