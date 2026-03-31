

## Add User Filter to Beta Feedback Viewer

### What changes

Add a **user dropdown** next to the existing feature filter in the "All Feedback" table header. This lets you filter by tester so you can view one person's feedback at a time as the list grows.

### Implementation

**File: `src/components/trunkline/beta/BetaFeedbackViewer.tsx`**

1. Add a `userFilter` state (`"all"` | user_id string)
2. Add a second `<Select>` dropdown next to the feature filter, populated from the `profiles` data (tester names)
3. Apply the user filter alongside the existing feature filter when computing `filtered`
4. Group the two dropdowns in a flex row for clean layout

No new files, no backend changes — purely a UI filter addition to the existing component.

