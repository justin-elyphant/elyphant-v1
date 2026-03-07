

## Bank "Non-Shopify Vendor Experience" to plan.md

Append a new section before the "Completed Plans" heading (line 317) covering the three vendor tiers and the platform-exclusive vendor experience.

### Content to Add

**Three Vendor Tiers:**
1. **Shopify Retailers** — Shopify Storefront API sync, read-only inventory, automated product import
2. **Tech-Savvy Vendors** — Direct API integration, webhook-based inventory sync, custom platform connectors
3. **Platform-Exclusive Vendors** — Manual product creation forms, CSV bulk upload, image uploads, internal inventory management via Elyphant portal

**Platform-Exclusive Vendor Features (CSV/Manual):**
- Manual product creation form with image upload (multi-image), pricing, variants (size/color), description, category assignment
- CSV bulk upload with template download, validation preview, error reporting
- In-portal inventory management — stock levels, price updates, product status toggling
- Fulfillment routing via `vendor_direct` — vendor receives order notifications by email, ships directly
- No external platform dependency — Elyphant IS their storefront

**Files to build (future):**
- `src/components/vendor/products/ManualProductForm.tsx`
- `src/components/vendor/products/CSVUploadFlow.tsx`
- `src/components/vendor/products/InventoryManager.tsx`

