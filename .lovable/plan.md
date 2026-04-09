

## Simplify Wishlist Creation Dialog with Lululemon Styling

### What Changes

Strip the dialog down to 2 fields (Title + Description) and apply the monochromatic Lululemon design system.

### Visual Design

```text
┌─────────────────────────────────────┐
│                                     │
│  Create New Wishlist                │
│  Save and share your gift ideas.    │
│                                     │
│  NAME                               │
│  ┌─────────────────────────────┐    │
│  │ My Birthday Picks           │    │
│  └─────────────────────────────┘    │
│                                     │
│  DESCRIPTION (OPTIONAL)             │
│  ┌─────────────────────────────┐    │
│  │                             │    │
│  └─────────────────────────────┘    │
│                                     │
│  ┌───────────┐  ┌─────────────┐    │
│  │  Cancel    │  │   Create    │    │
│  │  (outline) │  │ (black bg)  │    │
│  └───────────┘  └─────────────┘    │
└─────────────────────────────────────┘
```

### Styling Details (Lululemon System)
- **Dialog background**: white, clean with generous padding
- **Labels**: uppercase tracking-wide text-xs text-muted-foreground (like Lululemon form labels)
- **Inputs**: minimal border, rounded-md, bg-[#F7F7F7] on focus
- **Create button**: `bg-black text-white hover:bg-gray-900` (Lululemon primary CTA)
- **Cancel button**: outline with black border, no color
- **No separator, no "Organization" section** -- removed entirely
- **Title placeholder**: contextual based on user interests (e.g., "Summer Running Gear")

### File Changes

**`src/components/gifting/wishlist/CreateWishlistDialog.tsx`**
- Remove: Category dropdown, Priority selector, Tags/EnhancedTagInput, Separator, "Organization" heading
- Remove imports: `Select*`, `EnhancedTagInput`, `normalizeTags`, `Separator`
- Strip schema to just `title` (required) + `description` (optional)
- Style labels with `uppercase tracking-wider text-xs`
- Style Create button with `bg-black text-white hover:bg-gray-900`
- Auto-assign defaults on submit: `category: "personal"`, `priority: "medium"`, `tags: []`
- Pull user interests from profile for smart placeholder text

**`src/components/gifting/hooks/operations/useWishlistCreate.tsx`**
- Add auto-tagging: match title words against `profile.interests` array and set as tags

### What Stays Unchanged
- `EditWishlistDialog` -- Category, Priority, Tags remain accessible for post-creation editing
- `FormValues` type contract with consumers -- defaults supplied silently
- Data model / Wishlist type -- no schema changes

