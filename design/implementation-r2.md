# Jot & Tittle · r2 implementation and verification

2026-10-08 · Implemented under the user's instruction to apply the visual guidelines throughout the app. This report describes the app build, separately from the static Penpot reference and the historical r1 verification.

## What changed

The four views—Map, History, Patterns and Your data—share the r2 paper/forest palette, semantic CSS tokens, system sans/Georgia typography, restrained headings, control geometry and responsive shell. Desktop has a 192px sidebar; tablet uses top navigation; phone uses safe-area-aware bottom navigation. Page titles follow the 32/30/26px roles. Primary fields/actions use 48px targets, secondary actions at least 44px. Notes preserve whitespace and wrap long content at 16px/1.65; History titles use 18px/27px.

Map retains the verse field and metric meaning. A visible Text view provides all canonical verses within geography, including zero-count verses, with exact counts, dates and reading-note access. Desktop/tablet use a semantic table; phone uses an ordered list, with only the active representation exposed. Pagination, Find passage, explicit scope changes and preserved filters make the alternative usable without interpreting color. The spatial control supports row/scope keyboard navigation, a dual-contrast locator and coalesced announcements. Stationary taps preview a verse; Inspect opens it. Drag/scroll/pointer cancellation do not open a passage or save a reading. The Combined legend now includes its complete two-axis matrix.

Capture/edit uses a separate page with explicit destination, associated help/errors, normalized reference preview and retained drafts. Invalid submit focuses the relevant field; storage errors preserve input. Saving blocks duplicate submissions and dismissal. Saved feedback names passage/date/journal and offers recovery if filters hide the result. Adjacent passage and reading detail use a 328px pane only when the main area can retain 640px plus a 24px gap; narrower widths use a separate detail view with return navigation.

History uses date groups, full note detail and labeled record actions. Patterns retain all 66 books, including zeros, with record/encounter units explained. Your data separates browser-local storage, backup/export, previewed imports and recovery. Import preflight checks current data again; journal and reading conflicts compare relevant versions rather than substituting generic errors. Cancelled edit drafts retain their original revision so a later remote change still opens comparison. Saving a removed reading as a new record requires an eligible, explicit destination and does not recreate a deleted journal.

Dialogs share initial focus, complete Tab/Shift+Tab containment, inert background, Escape/return behavior and pending-write protection. Destructive operations retain their existing confirmation and recovery semantics. Journal management, archive, transfers, Undo, Trash, purge, import/export, About/privacy, sample, loading, empty and failure surfaces inherit the same foundations and interaction states. A first keyboard stop targets the active main surface.

## Implementation ownership and oversight

Three specialist subagents handled the visual foundations/responsive composition, map/Text view and input methods, and shared surfaces/filters/recovery. The primary agent integrated their changes, reviewed the reference contract and rendered states, and reconciled cross-component focus, draft revision, import preflight and modal behavior. Subsequent reviews targeted observed failures rather than adding unrelated product features.

The canonical sources remain [guidelines](visual-design-guidelines.md), [numeric tokens](tokens-r2.json) and [Penpot contract](design-contract.md). Source implementation is concentrated in `src/design.css`, `src/map-design.css`, `src/main.tsx`, `src/TextView.tsx`, `src/Heatmap.tsx`, `src/MetricLegend.tsx`, `src/DetailSurface.tsx`, `src/Dialog.tsx`, `src/ReadingDetail.tsx` and `src/ReadingViewControls.tsx`. Domain, numbering and persisted storage semantics remain in their existing modules.

## Verified coverage

- Four viewport compositions: 1440×1000, 768×1024, 390×844 and 320×720. Preserved browser images cover first use, capture, map, passage detail, History, reading detail, Patterns and Your data. Long notes and unbroken references deliberately stress wrapping.
- Breakpoint boundaries: 767/768, 1023/1024 and 1247/1248px. Checks measure actual shell width, heading type, detail width/gap, surviving map width, field borders and page overflow.
- Capture validation, date validation, cancelled draft retention, one-shot storage failure/retry, persistence after reload, cross-tab reading/journal conflicts, current-revision resolution and explicit recovery destinations.
- Map keyboard endpoints, touch preview versus drag/cancel, Text view zeros/pagination, disjoint/partial/out-of-scope Find and retained filters. Existing map geometry, palette, recency and references remain covered.
- Filter label/error associations and focus restoration, modal Tab cycles, capture return, reading details, record actions, imports, backups, transfers, archive, Undo/Trash and offline behavior where supported by the test engine.

Browser images are in [evidence/r2](evidence/r2). These are app screenshots, not pixel-identical Penpot goldens. Penpot uses font proxies, illustrative counts and a cropped representative verse field; app evidence uses real system/Georgia fonts and deterministic synthetic records. Fixed bottom navigation and transient notices can appear partway down a full-page capture because they belong to the viewport, not the document flow. Such screenshots are inspected alongside interaction/geometry checks. A controlled reading-detail rerun confirmed heading focus while reproducing an offscreen skip-link artifact in a full-page capture after programmatic focus scrolled the page. Final visual captures start at the document origin and allow the save notice to expire naturally; this removes that artifact without changing application focus behavior. Initial captures are retained in `evidence/r2/initial-review/`.

## Checks and results

- `npm test`: 52 passed; zero failures/skips.
- `npm run build` (executed by the final browser run): TypeScript, production Vite bundle, offline assets and source bundle generated successfully.
- Final Chromium, WebKit, mobile Chromium and mobile WebKit matrix: **253 passed, 19 intentional skips, zero failures and zero flaky results** (272 cases, about 105 seconds). Skips cover matched visual evidence on non-reference engines, desktop-only absence of touch, and offline checks unsupported by the WebKit harness. The final JSON report is preserved in [browser-matrix-final.json](evidence/r2/browser-matrix-final.json).
- Focused Chromium visual suite: 5 passed after compacting the phone toolbar and adding the reading-heading focus assertion.
- Prettier check passed for all changed/new implementation components and r2 test files; `git diff --check` passed.

The first complete final-pass matrix had 245 passes, 19 intentional skips and four identical assertion failures: the app correctly rendered canonical “Psalms 23” while a new test expected “Psalm 23.” The assertion was corrected before the final run. Earlier implementation failures led to actual focus, modal Tab, validation-click and draft-revision fixes; no failed run is being treated as proof of completion.

## Limits and acceptance still outstanding

Firefox's installed Playwright runtime failed before app navigation with “Could not find profile folder,” including a retry outside the sandbox with a canonical temporary directory. Firefox behavior is unverified. Chromium and WebKit automation are engine coverage, not a claim of testing every real browser/device combination.

Keyboard, focus, semantics, touch and computed style assertions do not establish screen-reader compatibility or WCAG conformance. No actual assistive-technology session, external user study, localized copy evaluation or complete browser/text-zoom audit was performed in this implementation pass. The guidelines' research and acceptance requirements remain applicable. Saved synthetic screenshots are visual review evidence; visual regression thresholds should be adopted only after human design review.

The editable local Penpot reference and its named r2 version remain preserved. No account/cloud-sync/telemetry/Bible-text features were introduced, and no deployment or Git commit is implied by this report.
