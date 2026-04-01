

## Fix: Beta Share Text Not Updating

### Problem

The `quickShare` function in `useProfileSharing.ts` uses `useCallback` with dependency array `[profileUrl, profileName]` (line 70), but **`isBetaTester` is not included**. This means the callback captures the initial `false` default value and never re-creates when `isBetaTester` becomes `true` after the beta credits load. The old generic text gets locked in.

### Fix

**`src/hooks/useProfileSharing.ts`** — Add `isBetaTester` to the `useCallback` dependency array on line 70:

```typescript
// Line 70: change from
}, [profileUrl, profileName]);
// to
}, [profileUrl, profileName, isBetaTester]);
```

One line, one missing dependency. That's the entire fix.

