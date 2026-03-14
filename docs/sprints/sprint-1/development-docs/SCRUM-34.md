# SCRUM-34  Accessibility Review: Service Centers Listing UI

## Summary

Accessibility review of the Service Centers listing UI in QueueLanka Pro. This document was created by inspecting the frontend source files listed below against WCAG 2.1 AA guidelines. Issues are categorised by priority, each with a concrete code fix.

---

## Scope  Files Inspected

| File | Purpose |
|------|---------|
| `frontend/src/pages/ServiceCentersPage.tsx` | Main page  renders list, search bar, filter controls, auto-refresh |
| `frontend/src/components/serviceCenter/ServiceCenterCard.tsx` | Individual center card component |
| `frontend/src/hooks/useServiceCenters.ts` | Data-fetching hook used by the page |

---

## High Priority Issues

### 1. Search input has no accessible label

**Problem:** The search input only has a placeholder. Screen readers announce placeholder text as a hint, not a label; it disappears when the user types.

**Fix:**
```tsx
<label className="sr-only" htmlFor="centers-search">Search service centers</label>
<input
  id="centers-search"
  type="text"
  aria-label="Search service centers"
  placeholder="Search centers..."
  ...
/>
```

---

### 2. Filter buttons do not announce selected state

**Problem:** Filter buttons (e.g. All / Available / Unavailable) have no `aria-pressed` attribute. Keyboard and screen reader users cannot tell which filter is active.

**Fix:**
```tsx
<button
  aria-pressed={activeFilter === 'all'}
  onClick={() => setActiveFilter('all')}
>
  All
</button>
```

---

### 3. Auto-refresh updates are silent for screen reader users

**Problem:** The page auto-refreshes the center list every N seconds. The visual `lastUpdated` timestamp updates, but there is no accessible live announcement.

**Fix:** Add a visually hidden `aria-live` region that announces updates:
```tsx
<div aria-live="polite" className="sr-only">
  {lastUpdated ? `Service center list updated at ${lastUpdated.toLocaleTimeString()}` : ''}
</div>
```

---

### 4. Decorative icons are read aloud by screen readers

**Problem:** SVG icons used purely for decoration do not have `aria-hidden="true"`. Screen readers attempt to read them, creating noise.

**Fix:** Add to every decorative SVG:
```tsx
<svg aria-hidden="true" focusable="false" ...>
  ...
</svg>
```

---

## Medium Priority Issues

### 5. Center cards use `<div>` wrapper with no semantics

**Problem:** Cards are `<div>` elements. There is no landmark, heading, or focusable wrapper. Keyboard-only users cannot navigate to or activate them.

**Fix:** Use `<article>` with `tabIndex` and keyboard handler:
```tsx
<article
  tabIndex={0}
  aria-labelledby={`center-${center.centerId}-title`}
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') navigate(`/book/${center.centerId}`)
  }}
>
  <h3 id={`center-${center.centerId}-title`}>{center.name}</h3>
</article>
```

---

### 6. Disabled booking button gives no explanation

**Problem:** When a center is full or unavailable, the Book button is set to `disabled`. Native `disabled` removes focus and screen readers may not say why.

**Fix:** Use `aria-disabled` with visible/hidden explanation text:
```tsx
<button
  aria-disabled={!center.isAvailable}
  aria-describedby={`center-${center.centerId}-status`}
  onClick={() => center.isAvailable && navigate(`/book/${center.centerId}`)}
>
  Book
</button>
<span id={`center-${center.centerId}-status`} className="sr-only">
  {center.isAvailable ? '' : 'This center is currently unavailable for booking.'}
</span>
```

---

### 7. Status badge relies on colour only

**Problem:** Available / Unavailable status is shown with a coloured dot. Users with colour blindness may not distinguish states.

**Fix:**
- Ensure the badge has a text label (not just a dot), e.g. "Available" or "Unavailable".
- Add `role="status"` if the badge changes dynamically.
- Verify colour contrast ratio is at least 4.5:1 for text and 3:1 for UI components.

---

## Low Priority / Polish

| Issue | Recommendation |
|-------|---------------|
| Placeholder text contrast | Placeholder text is often light grey. Verify contrast ratio meets 4.5:1. |
| Focus ring visibility | Ensure all interactive elements (filter buttons, cards, Book button) have a visible focus indicator (not just the default outline). |
| Skip navigation link | Add a "Skip to main content" link at the top of the page for keyboard users who want to bypass the nav bar. |
| Loading state | Announce loading state to screen readers with `aria-busy="true"` on the list container while fetching. |

---

## Availability Data Accessibility Note

The `isAvailable` field returned by `GET /api/service-centers/{id}/availability` reflects real-time status. If the status badge is updated dynamically (e.g. via polling), the `aria-live` region must announce the change to screen reader users.

---

## Testing Checklist

- [ ] Navigate the page using keyboard only (Tab, Enter, Space, arrow keys).
- [ ] Test with NVDA (Windows) or JAWS screen reader.
- [ ] Test with macOS VoiceOver.
- [ ] Run axe DevTools browser extension and resolve all critical and serious violations.
- [ ] Verify all form inputs have visible or sr-only labels.
- [ ] Verify all interactive elements are keyboard-focusable.
- [ ] Verify colour contrast with Colour Contrast Analyser (WCAG AA minimum).

---

*Document generated from inspecting: `ServiceCentersPage.tsx`, `ServiceCenterCard.tsx`, `useServiceCenters.ts` (Sprint 1 build  March 2026).*
