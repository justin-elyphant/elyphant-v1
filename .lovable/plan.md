

## Remove Duplicate "Share Invite Link" Button on Mobile

Since both buttons now trigger the same native share sheet on mobile, the "Share Invite Link" button is redundant. Hide it on mobile, keep it on desktop/tablet.

### Change

**`src/components/connections/ConnectionsHeroSection.tsx`**

Wrap the "Share Invite Link" button's `motion.div` with a conditional that only renders it when `!isMobile`. The "Invite a Friend, Get $100" button remains as the single CTA on mobile.

