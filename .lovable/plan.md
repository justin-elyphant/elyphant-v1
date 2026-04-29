# Product Pages Rendering With Dashboard Sidebar

## What you're seeing

This is **not new** — but you're noticing it now because of the routing fix we just shipped. Before, clicking a product from the header search sometimes hit a broken route (`/product/:id`) and produced a blank page. Now that route works, but it lands on `ProductDetails.tsx`, which wraps itself in **`SidebarLayout`** — the dashboard chrome with the left rail showing Shop / Cart / Orders / Wishlists / Connections / Messages / Notifications.

Meanwhile the rest of the shopping experience (Marketplace, Cart, Checkout) uses **`MainLayout`** — fullscreen with just the top header and category nav. So entering a product from search visually drops you into "dashboard mode," which feels inconsistent.

Per project memory (Header Layout Strategy): MainLayout = shopping/marketing surfaces, SidebarLayout = account/dashboard surfaces. Product detail is a shopping surface and should be in MainLayout.

## Fix

Update `src/pages/ProductDetails.tsx`:
- Replace `import { SidebarLayout } from "@/components/layout/SidebarLayout"` with `import MainLayout from "@/components/layout/MainLayout"`
- Replace both `<SidebarLayout>...</SidebarLayout>` wrappers (loading state around line 207 and main render around line 227–282) with `<MainLayout>...</MainLayout>`

No other changes needed — the inner 60/40 split content stays the same.

## Result

Product detail pages will render fullscreen with the Elyphant header + Beauty/Electronics/Fashion/Wedding/Baby/Shop All nav, matching Marketplace and the rest of the shopping flow. No backend or data changes.

Approve and I'll apply it.