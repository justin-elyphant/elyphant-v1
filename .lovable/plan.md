

# Wire Hero "Shop" Button to Personalized Marketplace Route

## Problem
The hero countdown "Shop" button navigates to a dumb text search (`/marketplace?search=Curt+Davidson's+birthday+gift`) instead of the existing personalized route that activates Nicole's 4-tier intelligence system.

## Fix — Single file: `src/components/marketplace/hero/HeroContent.tsx`

### 1. Update `handleShopNowClick()` for birthday events
When `targetEvent.type === "birthday"`, navigate to `/marketplace/for/{name}` with event context state instead of a plain search:

```ts
if (targetEvent?.type === "birthday" && targetEvent.personName) {
  const slug = targetEvent.personName.toLowerCase().replace(/\s+/g, '-');
  navigate(`/marketplace/for/${slug}`, {
    state: {
      eventType: 'birthday',
      relationship: 'friend'
    }
  });
}
```

This activates the existing `PersonalizedMarketplace` page which uses `NicoleMarketplaceIntelligenceService` with the 4-tier hierarchy:
- **Tier 1**: Curt's public wishlist items
- **Tier 2**: Curt's profile interests
- **Tier 3**: AI-curated products for "birthday" + "friend"
- **Tier 4**: Demographic fallback

### 2. Update `getShopNowText()` for cleaner label
```ts
if (targetEvent.type === "birthday") {
  const firstName = targetEvent.personName?.split(" ")[0] || targetEvent.name.split("'s")[0];
  return `Shop ${firstName}'s Bday Gifts`;
}
```

### 3. Pass `personName` through the event interface
The `Event` interface in `HeroContent.tsx` needs an optional `personName` field — this is already set in `useConnectedFriendsSpecialDates` from the previous change.

```ts
interface Event {
  name: string;
  date: Date;
  type: string;
  personName?: string;  // add this
}
```

## Result
Clicking "Shop Curt's Bday Gifts" → opens `/marketplace/for/curt-davidson` → Nicole fetches Curt's wishlists + interests + AI curation → `PersonalizedGiftingSections` renders tiered results.

