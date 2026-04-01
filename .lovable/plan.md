

## Mobile: Make "Invite a Friend, Get $100" Trigger Native Share Sheet

### What changes

On **mobile only**, the "Invite a Friend, Get $100" button should behave identically to the "Share Invite Link" button — triggering the native OS share sheet (iMessage, WhatsApp, etc.) instead of opening the AddConnectionSheet email form.

On **desktop and tablet**, both buttons remain as they are today: "Invite a Friend" opens the email invite sheet, "Share Invite Link" opens the sharing dialog.

### Single file change

**`src/components/connections/ConnectionsHeroSection.tsx`** (~line 45-48)

Update `handleInvite` to check if the device is mobile:
- If mobile: call `quickShare()` (native share sheet) instead of `onInvite()` (email form)
- If desktop/tablet: keep calling `onInvite()` as before

Use the existing `isMobile` prop already passed to this component — no new dependencies needed.

```text
Current:
  [Invite a Friend, Get $100] → opens email form (all devices)
  [Share Invite Link]         → native share / clipboard (all devices)

After:
  Mobile:
    [Invite a Friend, Get $100] → native share sheet (text, iMessage, etc.)
    [Share Invite Link]         → native share sheet (same behavior)

  Desktop/Tablet:
    [Invite a Friend, Get $100] → opens email invite form (unchanged)
    [Share Invite Link]         → opens sharing dialog (unchanged)
```

This is a ~3-line change in the `handleInvite` function. No new files, no new imports.

