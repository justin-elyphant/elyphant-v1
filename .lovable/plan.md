
Plan: update the investor deck competitive landscape slide with current, defensible competitor claims and add hover/tap insight tips on competitor checkmarks.

## Scope

Update `src/components/investors/slides/CompetitionSlide.tsx` only, unless verification reveals a shared tooltip styling issue.

## Content updates

1. Replace outdated headline and thesis
   - Current:
     - `$7B+ Market Cap. 0 Offer Automation.`
     - `The giants are missing what matters most`
   - New:
     - `Gifting tools exist. Relationship automation does not.`
     - Supporting copy focused on Elyphant’s differentiation: social graph, automated relationship moments, wishlist intelligence, address resolution, and group gifting.

2. Update competitor positioning cards
   - Etsy:
     - Market cap: change from `$7B+` to approximately `~$6B`
     - Gap: change from `Not gifting-focused` to `Marketplace + Gift Mode`
   - Elfster:
     - Keep wishlist/gift-exchange positioning
     - Gap: `Wishlist + exchanges`
   - Snappy:
     - Update from `B2B only` / no AI framing to `Corporate AI gifting`
   - Goody:
     - Update from `B2B focus` to `Business + personal`

3. Replace boolean-only comparison data with richer statuses
   - Use:
     - `yes`
     - `partial`
     - `no`
   - Add optional `note` text for competitor cells that are `yes` or `partial`.

## Tooltip / insight-tip behavior

4. Add an info tip for competitor checkmarks and partial marks
   - For competitor columns only, not Elyphant.
   - When a competitor has a green checkmark or partial mark, wrap the icon in the existing `Tooltip` system.
   - The tooltip will explain why Elyphant still competes despite that visible capability.

Example tooltip copy:
   - Etsy + AI Gift Discovery:
     - `Etsy Gift Mode helps discovery, but Elyphant connects discovery to recipient profiles, relationships, scheduling, and checkout.`
   - Snappy + On-Platform Purchasing:
     - `Snappy supports corporate purchasing; Elyphant competes with consumer gifting, social context, wishlist signals, and recurring relationship moments.`
   - Goody + On-Platform Purchasing:
     - `Goody supports gift sending and recipient choice; Elyphant adds social graph, auto-gifting, wishlist intelligence, group funding, and marketplace personalization.`
   - Elfster + Giftee Wishlist:
     - `Elfster has wishlists and exchanges; Elyphant pairs wishlists with AI recommendations, checkout, gift scheduling, and automated reminders.`

5. Make the tooltip affordance obvious but compact
   - Keep the green checkmark as the primary visual.
   - Add a tiny `Info` icon or subtle dotted underline beside/around competitor checkmarks that have notes.
   - On desktop: hover/focus opens the insight.
   - On mobile/tablet: tap/focus opens the insight.
   - Use existing `TooltipProvider`, `Tooltip`, `TooltipTrigger`, and `TooltipContent` from `src/components/ui/tooltip.tsx`.

## Comparison table update

6. Proposed rows

   - `AI Gift Discovery`
     - Elyphant: yes
     - Etsy: partial/yes with note about Gift Mode being discovery-focused
     - Elfster: no
     - Snappy: partial/yes with note about corporate AI assistant
     - Goody: partial with note about curated/assisted gifting

   - `Relationship-Based Auto-Gifting`
     - Elyphant: yes
     - Etsy: no
     - Elfster: no
     - Snappy: partial with note about campaign-based corporate gifting
     - Goody: partial with note about business birthdays/work anniversaries

   - `Giftee Wishlist / Social Profile`
     - Elyphant: yes
     - Etsy: partial/no, depending on final copy, with note that favorites are not a gifting social graph
     - Elfster: yes with note that Elyphant adds AI + commerce + automation
     - Snappy: no
     - Goody: partial/no with note that recipient choice is not a wishlist network

   - `On-Platform Purchasing`
     - Elyphant: yes
     - Etsy: yes with note that Etsy is marketplace checkout, not relationship automation
     - Elfster: no/external shopping
     - Snappy: yes with note about corporate gifting context
     - Goody: yes with note about send-and-choice model vs Elyphant’s social automation

   - `Recipient Address Collection`
     - Elyphant: yes
     - Etsy: no/limited
     - Elfster: no
     - Snappy: yes with note about corporate send flows
     - Goody: yes with note about recipient-entered shipping but no social profile layer

   - `Consumer + Social Graph`
     - Elyphant: yes
     - Etsy: no
     - Elfster: partial with note about group exchange utility, not broad social commerce
     - Snappy: no
     - Goody: partial with note about personal gifting but not relationship graph

   - `Group Funding`
     - Elyphant: yes
     - Etsy: no
     - Elfster: no
     - Snappy: no
     - Goody: no

7. Add an investor-safe footnote
   - Copy:
     - `Based on publicly marketed product capabilities as of 2026. “Partial” indicates limited, business-only, campaign-based, or non-core support.`
   - This keeps the slide defensible and avoids overstating competitor gaps.

## Visual design

8. Preserve the investor deck aesthetic
   - Keep the dark gradient pitch deck style.
   - Keep the table compact for the 16:10 slide frame.
   - Use:
     - green check for `yes`
     - amber dash or `Partial` pill for `partial`
     - muted X for `no`
   - Keep Elyphant column highlighted.

## Verification

9. After implementation
   - Run build/typecheck.
   - Open `/investors`.
   - Navigate to the Competition slide.
   - Verify:
     - updated competitor claims render correctly
     - tooltips open on hover/focus
     - mobile/tablet tap behavior works
     - table is not clipped at the current preview size around `1000x611`
     - slide remains readable in fullscreen and standard deck view
