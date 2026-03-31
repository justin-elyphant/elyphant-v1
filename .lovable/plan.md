

## Fix: "cannot call json_array_elements on a scalar"

### Root cause

In `BetaFeedback.tsx` line 98, `JSON.stringify(entries)` converts the array to a string before passing it to Supabase. The Supabase client automatically serializes parameters, so the RPC receives a doubly-encoded scalar string like `"[{...}]"` instead of an actual JSON array `[{...}]`.

### Fix

**`src/pages/BetaFeedback.tsx`** — line 98: change `JSON.stringify(entries)` to just `entries`:

```typescript
const { data, error } = await supabase.rpc("submit_beta_feedback", {
  p_token: token!,
  p_feedback: entries,  // was: JSON.stringify(entries)
});
```

One file, one line. No other changes needed.

