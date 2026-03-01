**SCRUM-34 — Accessibility Review: Service Centers Listing UI**

**Summary**
This document contains an accessibility review of the Service Centers listing UI. I inspected the frontend code (main files listed below) and identified issues against common accessibility guidelines (WCAG). I also propose fixes and testing steps.

**Scope / Files inspected**
- `frontend/src/pages/ServiceCentersPage.tsx`
- `frontend/src/components/serviceCenter/ServiceCenterCard.tsx`
- `frontend/src/hooks/useServiceCenters.ts` (usage)

**High priority issues (fix soon)**

- Search input has only placeholder text. Screen readers need a label.
	- Fix: add visible or sr-only `<label>` and `id`, or add `aria-label` attribute.

- Filter buttons lack `aria-pressed` so assistive tech cannot tell which is selected.
	- Fix: add `aria-pressed={filter === '...'}` and ensure keyboard operable.

- Auto-refresh updates are not announced to screen readers (visual `lastUpdated` only).
	- Fix: add a polite `aria-live` region for update messages (visually-hidden if needed).

- Many decorative SVG icons do not have `aria-hidden="true"` and may be read aloud.
	- Fix: add `aria-hidden="true" focusable="false"` on decorative SVGs.

**Medium priority issues (improve UX)**

- Cards use `<div>` wrapper (no semantic role). Make them `article` with `aria-labelledby` and make entire card keyboard-focusable and activate on Enter.

- Disabled booking button: native `disabled` prevents focus and screen readers may miss why disabled. Provide `aria-describedby` with reason or use `aria-disabled` with focusable element.

- Status badge relies on color. It has text, but verify color contrast and add `role="status"` for dynamic changes.

**Low priority / polish (optional)**

- Verify color contrast for light gray text and placeholders at small sizes.
- Ensure consistent focus styles for interactive elements (filters, cards, buttons).

**Concrete code fix snippets**

1) Search input (add label + id):

```tsx
<label className="sr-only" htmlFor="centers-search">Search service centers</label>
<input id="centers-search" aria-label="Search service centers" ... />
```

2) Filter buttons (aria-pressed):

```tsx
<button aria-pressed={filter === 'all'} onClick={() => setFilter('all')}>All</button>
```

3) Announce refresh (aria-live):

```tsx
<div aria-live="polite" className="sr-only">{lastUpdated ? `List updated at ${lastUpdated.toLocaleTimeString()}` : ''}</div>
```

4) Decorative SVGs:

```tsx
<svg aria-hidden="true" focusable="false" ...>...</svg>
```

5) Card semantics + keyboard activation:

```tsx
<article
	tabIndex={0}
	role="group"
	aria-labelledby={`center-${center.centerId}-title`}
	onKeyDown={(e) => { if (e.key === 'Enter') navigate(`/book/${center.centerId}`) }}
>
	<h3 id={`center-${center.centerId}-title`}>{center.name}</h3>
</article>
```

6) Disabled book button explanation:

```tsx
<button
	disabled={!available}
	aria-describedby={`book-desc-${center.centerId}`}
>
	Book
</button>
<span id={`book-desc-${center.centerId}`} className="sr-only">Booking unavailable because center is closed</span>
```

**Testing & verification checklist**

- Run automated scans (axe-core, Pa11y) against the Service Centers page.
- Manual keyboard test: Tab order, Enter/Space activation for card and controls, clear search button.
- Screen reader smoke test (NVDA/VoiceOver): check labels, live region announcements, and ARIA pressed states.
- Contrast check for all text colors (WCAG AA: 4.5:1 normal text, 3:1 large text).


Document produced by reviewing the UI code of Service Centers page and card components.
