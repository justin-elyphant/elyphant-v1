

## Auto-Connect Invited Users — Fix Share Link Gap

### Current state

There are two invitation paths:

| Path | Entry point | Auto-connects? |
|------|-------------|----------------|
| **Email invite** (AddConnectionSheet) | Token in URL → `accept_invitation_by_token` RPC | Yes — status set to `accepted` immediately |
| **Share link** (`/invite/:username`) | User ID stored in session → `sendConnectionRequest` | No — creates a `pending` request |

When Heather shares her invite link and a friend signs up, they land in a pending state — Heather has to manually accept. That defeats the purpose.

### What to fix

Make the share link path behave like the token path: **auto-accept the connection** instead of leaving it pending.

### Approach — reuse existing code

The `connectionService.ts` already has an `acceptConnectionRequest` function. Rather than creating new logic, we'll call it immediately after `sendConnectionRequest` succeeds in the post-signup flow.

### Changes

**File 1: `src/pages/Auth.tsx`** (post-signup linking, ~line 132-145)

Currently sends a connection request and leaves it pending. Change to:
1. After `sendConnectionRequest` succeeds, immediately call `acceptConnectionRequest` with the returned connection ID
2. Update the toast from "Connection request sent!" to "Connection established!"
3. This mirrors what `accept_invitation_by_token` does — both paths end in `accepted` status

**File 2: `src/pages/InvitePage.tsx`** (logged-in user clicking "Connect", ~line 86-115)

When a logged-in user visits `/invite/:username`, the same issue exists — it sends a pending request. Change to:
1. After `sendConnectionRequest` succeeds, auto-accept from the inviter's side since the invite link itself is the intent signal
2. Update toast to "Connected with [name]!"

### What stays the same

- `sendConnectionRequest` in `connectionService.ts` — no changes needed
- `accept_invitation_by_token` RPC — already works for the email invite path
- `AddConnectionSheet` — already uses the token path correctly
- All email templates — unchanged

### Technical detail

The `acceptConnectionRequest` function in `connectionService.ts` updates the `user_connections` row to `status = 'accepted'`. We'll import and call it with the connection ID returned by `sendConnectionRequest`. This is ~5 lines of additional code per file, fully reusing existing logic.

