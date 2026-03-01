# Wishlist Feature — Design Consistency Audit

## Prompt

"Using UI_DESIGN.md and ROADMAP.md as context, run a wishlist consistency audit. Show me the wishlist badge treatment across every context where owned/wishlist status appears, and design the 'Mark as acquired' interaction for each. Build an interactive artifact showing all contexts side by side."

## Why This Matters

The wishlist badge appeared during the Pass 3 cards deep-dive (accessory rows inside kit card accordions). It currently uses a semantic pill (`#C4913A` warning color, 15% opacity background, "wishlist" text). Owned items show a 14px green check circle. But this was ad-hoc — we need one pattern that works consistently everywhere.

## Entities With Wishlist Status

1. **Kits** — Live in the Collection zone's Wishlist section. Have retailer URL, price, notes. "Mark as acquired" moves them to On the Shelf section.
2. **Accessories** — PE sets, resin, decals, 3D prints. Owned/wishlist boolean. Can be linked to a parent kit (appear in kit card accordion tray) or unlinked (appear in standalone Accessories section).
3. **Paints** — On the paint shelf. Owned/wishlist status, brand, name, reference code, type.

## Contexts Where the Badge Appears

| Context | Location | Current Treatment | Notes |
|---------|----------|-------------------|-------|
| Kit card (Wishlist section) | Collection zone | Status badge "Wishlist" in warning color | The whole card is in the Wishlist section, so the badge may be redundant here |
| Accessory row in kit accordion | Collection zone, inside kit card tray | Semantic pill "wishlist" / green check for owned | This is where it was designed — V5 color-edge rows |
| Standalone Accessories section | Collection zone | Not yet designed | Should match the accordion treatment |
| Paint shelf entry | Collection zone | Not yet designed | Paints have their own row treatment TBD |
| Overview Materials card | Overview zone | Not yet designed | BOM view — wishlisted items are "things to order" |
| Build zone step info | Build zone info bar | Not yet designed | If a step uses a wishlisted paint or accessory, should there be an indicator? |

## Design Questions to Resolve

1. **Badge consistency** — Same pill style everywhere, or adapted per context? The semantic pill works in accessory rows but might be too large for a paint shelf table row.
2. **Owned indicator** — Green check circle everywhere, or only where the alternative (wishlist) exists? A kit in "On the Shelf" is inherently owned — does it need a check?
3. **"Mark as acquired" interaction** — Where can you do this?
   - Kit cards: dedicated button in Wishlist section (per ROADMAP)
   - Accessories: inline toggle? Right-click? Detail panel only?
   - Paints: inline toggle on paint shelf?
4. **Prominence escalation** — A wishlisted accessory linked to an actively-building kit is more urgent than a wishlisted accessory with no kit link. Should the badge be more prominent (filled instead of tinted)? Should there be a "shopping list" aggregation view?
5. **Overview Materials card** — The BOM should distinguish owned vs. needed items. How does this interact with the wishlist badge?
6. **Batch operations** — "Mark all as acquired" for accessories that arrived together (e.g., you ordered 3 items and they all came in)?

## Current Design Tokens (from UI_DESIGN.md)

- Wishlist status color: `#C4913A` (warning)
- Semantic badge: background `{color}15`, text in status color, border `1px solid {color}25`, 10px font, 500 weight, padding 2px 10px, radius 10px (full pill)
- Owned check: 14px circle, background `#5A9A5F` at 20%, 8px white checkmark
- Accessory type colors: PE `#7B5EA7`, Resin `#C47A2A`, Decals `#3A7CA5`, 3D Print `#5B8A3C`

## Deliverable

An interactive artifact showing:
- All 6+ contexts with wishlist/owned badges applied consistently
- "Mark as acquired" interaction pattern for each context
- Prominence escalation rules (if adopted)
- A summary table of the final badge spec per context
