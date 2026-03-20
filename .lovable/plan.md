

## Make Suggestions the Default Tab + Enable Search Filtering

### Problem
1. The "Friends" tab is currently the default across all layouts, but for new users (0 connections), this shows an empty state immediately. "Suggestions" should be primary to drive discovery.
2. The search bar already filters suggestions (`filteredSuggestions`), so it does work — but users may not realize it since they land on the Friends tab.

### Changes

**1. Default to "Suggestions" tab across all layouts**
- Line 112: Change the initial `activeTab` state from `"friends"` to `"suggestions"` (unless URL param overrides to `pending`)
- Desktop layout (line 682): Change `defaultValue={activeTab}` — already uses `activeTab` state, so this is automatic

**2. Reorder tabs: Suggestions first**
In all three layouts (mobile, tablet, desktop), move the Suggestions tab trigger to the first position, followed by Friends, then Pending. This applies to:
- Mobile (lines 317-343)
- Tablet (lines 508-533)
- Desktop (lines 683-696)

**3. Reorder TabsContent to match**
Move `TabsContent value="suggestions"` before `value="friends"` in all three layouts for code consistency (not strictly required by Radix, but cleaner).

### What already works
- The search bar filters suggestions via `filteredSuggestions` (line 217-219) — this already applies when on the Suggestions tab. No additional wiring needed.

### Files affected
- **Edit**: `src/pages/Connections.tsx` — change default tab + reorder tab triggers and content in all 3 layouts

