

# Development Guardrails for Vendor Portal Build

Before we start building, here are the rules I recommend we enforce throughout development. These are based on what I found in your existing codebase, your architecture decisions, and e-commerce security best practices.

---

## 1. No Overengineering

- **Build only what's needed for the current phase.** No speculative abstractions or "just in case" utilities.
- **One component = one responsibility.** If a component file exceeds ~200 lines, split it.
- **No wrapper components that add zero logic** — only create wrappers (like `VendorIcon`) when they enforce a real convention.
- **Reuse existing UI primitives** (shadcn/ui, Radix) — don't build custom dropdowns, modals, or tabs from scratch.

## 2. Code Bloat Prevention

- **No duplicate services.** Before creating a new service/hook, search for existing ones that do the same thing.
- **No unused imports or dead code** left behind after refactors.
- **Shared types go in a single `types.ts`** per feature area, not scattered across components.
- **Edge functions:** Only the 8 core payment functions + essential utilities listed in `config.toml`. No new edge functions without justification.

## 3. Vendor Data Security (RLS)

Your existing patterns are solid — `vendor_accounts` already has row-level security with `auth.uid() = user_id`. We extend this consistently:

- **Every new vendor table gets RLS enabled** with `auth.uid() = user_id` for vendor-owned data.
- **Cross-vendor data isolation is absolute** — a vendor must never see another vendor's orders, products, revenue, or customer data.
- **Use `can_access_vendor_portal()` SECURITY DEFINER function** (already exists) for all vendor-gated access checks — never check vendor status client-side.
- **No vendor email/PII exposed in any API response** beyond what the vendor themselves owns.
- **Product data is public-read, vendor-write** — customers can browse products, but only the owning vendor can edit/delete.

## 4. Authentication & Authorization

- **Roles stay in `user_roles` table** (already implemented with `app_role` enum including `'vendor'`). Never store roles on profiles.
- **Never trust client-side role checks** for gating vendor features — always validate via `has_role()` or `can_access_vendor_portal()` in RLS policies.
- **Vendor portal routes must check approval status** — `vendor_accounts.approval_status = 'approved'` is the gate, not just `user_type = 'vendor'`.

## 5. Payment & Order Security

- **Stripe Checkout Sessions only** — no new Payment Intent flows (per project knowledge).
- **Vendor payout data is never exposed client-side** — settlement amounts, commission rates, and Stripe Connect details stay in edge functions.
- **Order data visible to vendors is scoped** — vendors see only their own orders, with customer addresses masked (city/state only, per existing privacy standards).

## 6. Frontend Conventions

- **Lululemon design system**: grey (#F7F7F7) background, black text, white components, red (#DC2626) accent for CTAs only. No gradients, no purple/blue/orange.
- **Vendor portal gets its own layout** (`VendorPortalLayout`) — never share the consumer app's navigation shell.
- **Full-page routes, not modals** for any data-heavy views (products, orders, analytics).
- **Mobile-first** — all vendor views must work on mobile (vendors manage shops from phones).

## 7. Database Discipline

- **No new columns on `orders` table** without checking the Phase 2 simplification target (22 columns).
- **New vendor tables should be lean** — use JSONB `metadata` columns for extensible data instead of adding 20+ columns upfront.
- **Indexes on foreign keys** — every `vendor_id` / `user_id` column gets an index.
- **Timestamps on every table** — `created_at` and `updated_at` with auto-update triggers.

## 8. Testing & Validation

- **Zod schemas for all form inputs** — vendor product forms, CSV uploads, settings updates.
- **Edge function inputs validated server-side** — never trust client data.
- **Manual test before shipping** — especially for any flow that touches payments or order creation.

---

## Proposed Action

Bank these as a **"Vendor Portal Development Guardrails"** section in `plan.md` so every future prompt respects these constraints. Want me to proceed?

