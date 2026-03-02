# Customers Page — Mobile Optimization

## Problems Found

| # | Problem | Impact |
|---|---------|--------|
| 1 | Table with 5 columns (Nombre, Email, Teléfono, Ciudad, Acciones) would overflow horizontally on narrow screens | Content clipped / horizontal scroll on mobile |
| 2 | Action buttons `h-8 w-8` (32×32 px) below the 44×44 px WCAG touch target minimum | Hard to tap on touch devices |
| 3 | Pagination buttons same `h-8 w-8` size | Hard to tap on touch devices |

## Root Cause

The page only had a desktop-oriented `<Table>` with no responsive fallback. No mobile-specific layout was defined.

## Changes Applied

**File:** `src/pages/CustomersPage.tsx`

### 1 — Mobile Card List (`md:hidden`)

Replaced the single `<Table>` with a dual-view pattern:

- **`< md` (mobile):** `<ul>` with `<li>` cards. Each card shows:
  - Name (bold, truncated)
  - Phone + city on one line (secondary text)
  - Email below if available
  - Edit and Delete buttons with `h-11 w-11` (44×44 px touch targets) and `active:scale-95` tactile feedback
- **`≥ md` (desktop):** Original `<Table>` restored with `hidden md:table`, fully unchanged.

### 2 — Pagination Touch Targets

Pagination buttons now use `h-11 w-11 md:h-8 md:w-8` so they are 44 px on mobile and revert to 32 px on desktop.

### 3 — Accessibility

All icon-only buttons now have both `aria-label` and `title` attributes.

## Suggested Manual Tests

1. Open `/customers` at 390×844 px viewport.
2. Verify the card list renders (no horizontal scroll).
3. Tap Edit on a card → dialog opens correctly.
4. Tap Delete on a card → confirmation + deletion works.
5. If total pages > 1, verify pagination buttons are easy to tap.
6. Switch to 1024 px+ → table appears, cards are hidden, layout unchanged.

## Expected Result

- Mobile: clean, scrollable card list with comfortable touch targets.
- Desktop: original table layout, zero visual changes.
