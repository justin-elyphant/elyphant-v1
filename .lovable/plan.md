

# Add "How to Connect" Guide to Shopify Integration Page

## What
Add a collapsible "How to Connect Your Shopify Store" guide on the Integrations page, aimed at non-technical vendors. This will be a step-by-step walkthrough with numbered steps, screenshots descriptions, and FAQ-style tips.

## Implementation

### New component: `src/components/vendor/ShopifyHowToGuide.tsx`
A collapsible card (using `Collapsible` from radix) with:

**Step-by-step instructions:**
1. **Find your store URL** — Log into Shopify admin → your URL is `yourstore.myshopify.com` (shown in browser address bar)
2. **Enter your store URL** — Paste it into the "Store URL" field on this page and click "Connect"
3. **Authorize access** — You'll be prompted to grant Elyphant read-only access to your product catalog
4. **Review synced products** — Once connected, your products will appear below with sync settings you can customize

**Common questions (accordion or simple list):**
- "Where do I find my Shopify store URL?" — with clear instructions
- "What data does Elyphant access?" — Read-only product/inventory data only
- "Will this affect my existing Shopify store?" — No, we only read your catalog
- "What is the 30% convenience fee?" — Brief explanation of the markup model
- "I don't have a Shopify store yet" — Link to Shopify signup

Uses `Collapsible` + `Accordion` components already in the project. Toggle button says "Need help connecting? View step-by-step guide."

### Wire into the Integrations page
In the new `VendorIntegrationsPage.tsx` (from the approved but not-yet-implemented integrations plan), render `ShopifyHowToGuide` above the `ShopifyIntegration` component. If the integrations page isn't built yet, this component will be created alongside it.

### Files
- **Create**: `src/components/vendor/ShopifyHowToGuide.tsx`
- **Edit**: The integrations page (to include the guide) — either the new `VendorIntegrationsPage.tsx` or wherever `ShopifyIntegration` gets rendered

