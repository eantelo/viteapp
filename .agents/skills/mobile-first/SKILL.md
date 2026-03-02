---
name: mobile-first
description: "Apply mobile-first responsive optimization to any page or component. Audits layout, scroll, touch targets, and side panels — then implements fixes preserving desktop behavior. Triggers on: mobile-first, responsive, mobile optimization, adaptar a móvil, optimizar móvil, bottom sheet, touch-friendly."
---

# Mobile-First Page Optimization

Systematic skill for making any `viteapp` page fully responsive and touch-friendly while preserving desktop layout.

---

## Workflow

**Always follow this 4-phase process:**

### Phase 1 — Audit
1. Read the target page/component fully.
2. Identify which patterns apply (see Decision Matrix below).
3. Check for existing mobile patterns in the file (snap states, `useIsMobile`, responsive classes).
4. List all problems found (clipped content, fixed panels, small touch targets, etc.).

### Phase 2 — Plan
1. Map each problem to a pattern from the catalog.
2. List files to modify (page, shared components, hooks).
3. Flag any risks or regressions.
4. Confirm plan before implementing.

### Phase 3 — Implement
1. Apply changes incrementally — one pattern at a time.
2. Reuse existing project utilities (see Project Conventions below).
3. Never break desktop layout.
4. Validate no TypeScript/lint errors after each change.

### Phase 4 — Validate
1. Run the Validation Checklist (see below).
2. Document changes in `/viteapp/docs/`.

---

## Decision Matrix

Use this to determine which patterns to apply:

| Condition in the page | Patterns to apply |
|---|---|
| Any page (always) | P1 Scroll, P2 Layout, P8 Accessibility |
| Has header with multiple elements | P3 Header |
| Has interactive card grid | P4 Touch Cards |
| Has fixed side panel (summary, cart, actions) | P5 Bottom Sheet + P6 Interactions + P7 Swipe |
| Has data table | Check `data-table.tsx` — likely already handled |
| Has form with many fields | P2 Layout (stack fields vertically) |

---

## Pattern Catalog

### P1 — Mobile Scroll

**Problem:** `overflow-hidden` or `h-screen` on root containers blocks scrolling on mobile.

**Fix:** Mobile gets scrollable layout, desktop keeps fixed viewport.

```tsx
// Root container pattern
<div className="flex min-h-dvh w-full flex-col overflow-y-auto overflow-x-hidden md:h-screen md:overflow-hidden">
```

**Rules:**
- Use `min-h-dvh` (not `min-h-screen`) — accounts for mobile browser chrome.
- `overflow-y-auto` + `overflow-x-hidden` on mobile.
- `md:h-screen` + `md:overflow-hidden` on desktop.
- Remove any global `overflow-hidden` that clips mobile content.
- Add `pb-24 md:pb-0` if a bottom sheet or fixed bottom element exists.

---

### P2 — Responsive Layout

**Problem:** Fixed-width panels or horizontal layouts overflow on small screens.

**Fix:** Stack vertically on mobile, side-by-side on desktop.

```tsx
// Main content + side panel
<div className="flex flex-col md:flex-row">
  <main className="flex-1 min-w-0">{/* content */}</main>
  {/* Side panel: full-width on mobile, fixed on desktop */}
  <aside className="w-full md:w-[380px] md:min-w-[380px]">
    {/* summary/actions */}
  </aside>
</div>
```

**Rules:**
- Convert `w-[Xpx]` to `w-full md:w-[Xpx] md:min-w-[Xpx]`.
- Use `flex-col md:flex-row` for main axis.
- Add `min-w-0` on flex children to prevent overflow.
- If the side panel becomes a bottom sheet on mobile (P5), hide `<aside>` on mobile and show the sheet instead.

---

### P3 — Robust Mobile Header

**Problem:** Headers with many elements clip or overflow on narrow screens.

**Fix:** Allow wrapping and hide secondary info on mobile.

```tsx
<header className="z-10 flex min-h-14 flex-wrap items-center justify-between gap-2 px-4 py-2 md:h-14 md:flex-nowrap md:py-0">
  {/* Primary info: always visible */}
  <div className="flex items-center gap-2">
    <h1 className="text-base font-semibold md:text-lg">Title</h1>
  </div>
  {/* Secondary info: hidden on mobile */}
  <div className="hidden items-center gap-2 md:flex">
    <span>{fullDateTime}</span>
  </div>
  {/* Short info for mobile */}
  <span className="text-xs text-muted-foreground md:hidden">
    {shortTime}
  </span>
</header>
```

**Rules:**
- `flex-wrap` on mobile, `md:flex-nowrap` on desktop.
- `min-h-14` instead of fixed `h-14` to allow wrapping.
- Hide secondary text with `hidden md:flex` or `md:hidden`.
- Keep critical info visible on all sizes.

---

### P4 — Touch-Friendly Cards

**Problem:** Small cards are hard to tap and read on mobile.

**Fix:** Increase touch targets and improve readability.

```tsx
<div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
  <button
    className="min-h-[120px] rounded-lg border p-3 text-left transition-colors
               active:scale-[0.98] md:min-h-[100px] md:hover:bg-accent"
    aria-label={`Add ${product.name} to order`}
  >
    <span className="text-sm font-medium md:text-xs">{product.name}</span>
    <span className="text-base font-bold md:text-sm">{product.price}</span>
  </button>
</div>
```

**Rules:**
- `min-h-[120px]` on mobile (at least 44px × 44px touch target per WCAG).
- `text-base` / `text-sm` on mobile, scale down on `md:`.
- Use `active:scale-[0.98]` for tactile feedback on touch.
- Reduce grid columns on mobile: `grid-cols-2 sm:grid-cols-3 md:grid-cols-4`.
- Add bottom padding (`pb-24`) when a bottom sheet exists.

---

### P5 — Bottom Sheet (for side panels)

**Problem:** Fixed side panels (cart, summary, filters) don't fit on mobile.

**Fix:** Convert to a bottom sheet with 3 snap points on mobile; keep as panel on desktop.

**Type definition:**
```tsx
type MobileSnapPoint = "collapsed" | "mid" | "full";
```

**State:**
```tsx
const [mobileSnap, setMobileSnap] = useState<MobileSnapPoint>("collapsed");
const isMobileExpanded = mobileSnap !== "collapsed";
```

**Snap point heights:**
```tsx
const snapClass =
  mobileSnap === "full"
    ? "translate-y-0"
    : mobileSnap === "mid"
      ? "translate-y-[calc(100%-22rem)]"
      : "translate-y-[calc(100%-4.25rem)]"; // collapsed: just the handle bar
```

**Sheet markup (mobile only):**
```tsx
{/* Bottom sheet — visible only on mobile */}
<div
  className={cn(
    "fixed inset-x-0 bottom-0 z-30 flex flex-col rounded-t-2xl border-t bg-background shadow-2xl",
    "transition-transform duration-300 ease-out will-change-transform",
    "h-[calc(100dvh-3.5rem)]",  // max height = viewport minus header
    "md:hidden",                 // hidden on desktop
    snapClass
  )}
>
  {/* Handle bar + header */}
  <div className="flex items-center justify-between border-b px-4 py-3">
    <div className="mx-auto h-1.5 w-10 rounded-full bg-muted" />
    <span className="text-sm font-semibold">{items.length} items — {total}</span>
  </div>
  {/* Scrollable content */}
  <div className="flex-1 overflow-y-auto p-4">
    {/* Cart/summary items */}
  </div>
  {/* Actions */}
  <div className="border-t p-4">
    {/* Pay, hold, clear buttons */}
  </div>
</div>
```

**Rules:**
- Use `md:hidden` on the sheet; show normal `<aside>` with `hidden md:flex`.
- Auto-collapse when opening dialogs (payment, customer search, etc.):
  ```tsx
  const openPaymentDialog = () => {
    setMobileSnap("collapsed");
    setIsPaymentDialogOpen(true);
  };
  ```
- Use `h-[calc(100dvh-3.5rem)]` for max height (accounting for header).

---

### P6 — Sheet Interactions

**Snap navigation helpers:**
```tsx
const getNextSnapUp = (current: MobileSnapPoint): MobileSnapPoint => {
  if (current === "collapsed") return "mid";
  if (current === "mid") return "full";
  return "full";
};

const getNextSnapDown = (current: MobileSnapPoint): MobileSnapPoint => {
  if (current === "full") return "mid";
  if (current === "mid") return "collapsed";
  return "collapsed";
};
```

**Interaction points:**
- **Tap on handle bar:** advance snap up.
- **Up/Down buttons:** explicit snap control with `aria-label`.
- **Overlay:** when expanded, tap outside to collapse.

```tsx
{/* Overlay */}
{isMobileExpanded && (
  <div
    className="fixed inset-0 z-20 bg-black/20 md:hidden"
    onClick={() => setMobileSnap("collapsed")}
    aria-label="Cerrar panel"
  />
)}
```

**Up/Down button example:**
```tsx
<button
  onClick={() => setMobileSnap((prev) => getNextSnapDown(prev))}
  disabled={mobileSnap === "collapsed"}
  aria-label="Bajar panel"
  title="Bajar panel"
  className="rounded-md p-1.5 disabled:opacity-40"
>
  <ChevronDown className="h-4 w-4" />
</button>
```

---

### P7 — Touch Swipe Gestures

**Problem:** Users expect to swipe the sheet handle to expand/collapse.

**Implementation:**
```tsx
const gestureRef = useRef<{ startY: number; startTime: number } | null>(null);

const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
  const touch = e.touches[0];
  if (!touch) return;
  gestureRef.current = { startY: touch.clientY, startTime: Date.now() };
};

const handleTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
  const gesture = gestureRef.current;
  const touch = e.changedTouches[0];
  if (!gesture || !touch) return;

  const deltaY = touch.clientY - gesture.startY;
  const elapsed = Math.max(Date.now() - gesture.startTime, 1);
  const speed = Math.abs(deltaY) / elapsed;

  // Threshold: 36px distance OR fast swipe (>=0.55 px/ms)
  const isSwipeUp = deltaY <= -36 || (deltaY < 0 && speed >= 0.55);
  const isSwipeDown = deltaY >= 36 || (deltaY > 0 && speed >= 0.55);

  if (isSwipeUp) setMobileSnap((prev) => getNextSnapUp(prev));
  else if (isSwipeDown) setMobileSnap((prev) => getNextSnapDown(prev));

  gestureRef.current = null;
};
```

**Attach to sheet handle:**
```tsx
<div
  onTouchStart={handleTouchStart}
  onTouchEnd={handleTouchEnd}
  className="cursor-grab touch-none"
>
  <div className="mx-auto h-1.5 w-10 rounded-full bg-muted" />
</div>
```

**Rules:**
- Only attach to the handle/header area, not the full sheet (so content scrolls normally).
- Use `touch-none` on the handle to prevent browser scroll interference.
- Threshold: `36px` distance or `0.55 px/ms` speed.

---

### P8 — Accessibility

**Always apply these regardless of other patterns:**

- Every icon-only button must have `aria-label` and `title`.
- Use semantic elements: `<header>`, `<main>`, `<nav>`, `<aside>`, `<button>`.
- Inputs must have associated `<label>` (or `aria-label`).
- Maintain contrast >= 4.5:1 (WCAG AA).
- Disabled states: `disabled` attribute + `opacity-50 cursor-not-allowed`.
- Touch targets: minimum 44x44px on mobile.
- Test keyboard navigation: all interactive elements reachable via Tab.

---

## Project Conventions (viteapp)

**Always reuse these existing utilities and patterns:**

| Utility | Location | Usage |
|---------|----------|-------|
| `useIsMobile()` | `src/hooks/use-mobile.ts` | Breakpoint detection (768px) |
| `cn()` | `src/lib/utils.ts` | Merge Tailwind classes conditionally |
| `MobileSnapPoint` type | Define in the page | `"collapsed" \| "mid" \| "full"` |
| shadcn/ui components | `src/components/ui/` | Buttons, Dialogs, Sheets, etc. |

**Breakpoint convention:** `md:` = 768px (aligns with `useIsMobile`).

**Reference implementations:**
- `RestaurantPosPage.tsx` — full bottom sheet + swipe + snap points.
- `PointOfSalePage.tsx` — similar pattern for retail POS.
- `data-table.tsx` — Drawer direction based on `isMobile`.

---

## Validation Checklist

After implementation, verify ALL of these:

### Mobile (viewport 390x844)
- [ ] Full vertical scroll — no content clipped.
- [ ] No horizontal overflow (no sideways scroll).
- [ ] Header wraps gracefully, critical info visible.
- [ ] Cards/buttons have adequate touch targets (>=44px).
- [ ] Bottom sheet (if applicable):
  - [ ] Collapsed state shows handle + summary.
  - [ ] Mid state shows partial content.
  - [ ] Full state shows all content.
  - [ ] Swipe up/down works on handle.
  - [ ] Tap outside (overlay) collapses.
  - [ ] Auto-collapses on dialog open.
- [ ] All actions still work (add, remove, pay, etc.).

### Desktop (viewport >=1024px)
- [ ] Layout unchanged from before.
- [ ] Side panel (if any) remains fixed.
- [ ] No bottom sheet visible.
- [ ] All functionality intact.

### Code Quality
- [ ] No TypeScript errors.
- [ ] No invalid Tailwind classes.
- [ ] All icon buttons have `aria-label` + `title`.
- [ ] No duplicated logic.
- [ ] `useIsMobile` and `cn()` reused where applicable.

---

## Output Format

After completing the optimization, provide:

1. **Files modified** — list with relative paths.
2. **Summary per file** — 1-2 sentences each.
3. **Checklist results** — filled checklist above.
4. **Risks** — any regressions or edge cases to watch.
5. **Documentation** — create/update a doc in `/viteapp/docs/` with:
   - Problem found
   - Root cause
   - Changes applied
   - Suggested manual tests
   - Expected result
