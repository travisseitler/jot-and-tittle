# Jot & Tittle — Visual Design Guidelines

Revision r2 · 2026-10-08 · Working design specification under the user's design request; not explicitly user-approved. This document is comprehensive for the current product scope and governs the current build. Implementation evidence is recorded separately in [implementation-r2.md](implementation-r2.md). Requirements below are not claims of implemented behavior, accessibility conformance or completed user research.

## 1. Authority, scope and evidence

The editable working reference is [local Penpot: Jot & Tittle · Reference desk · r2](http://localhost:9001/#/workspace?team-id=389359b9-41aa-8115-8008-c1d036bbf00b&file-id=389359b9-41aa-8115-8008-c1dd1c742e50&page-id=389359b9-41aa-8115-8008-c1dd1c742e51). [The design contract](design-contract.md) records its board identifiers, exports, implementation mappings and verification limits. R1 is historical; its screenshots do not verify r2.

This document governs behavior and meaning. [tokens-r2.json](tokens-r2.json) governs numeric defaults, colors, type roles and responsive thresholds. Penpot demonstrates compositions and reusable states; its static prototype links do not simulate parsing, persistence, counters, focus or assistive technology. When an example omits a control/state, follow the written specification rather than remove functionality. Resolve discrepancies in the contract before implementation; never silently choose between conflicting references.

Evidence: [original product brief excerpt](original-spec-excerpt.md), source inspection, [functional research](scholarship-design-research.md), [visual audit](visual-audit-findings.md), and subagent reviews of [workflow coverage](review-workflow-coverage.md), [visual consistency](review-visual-consistency.md), and [interaction/accessibility](review-interaction-accessibility.md). Competitor dimensions are measured samples or explicitly labeled screenshot estimates, not Jot & Tittle requirements. This document's exact defaults are design decisions.

Scope is the four existing in-app views: **Map, History, Patterns, Your data**, plus journals, capture/edit, inspection, filtering, backup/import and recovery. Text view and the adjacent detail pattern are included additions. Preserve React/TypeScript/Vite, local records, the 66-book Protestant canon and KJV-compatible 31,102-verse numbering. Do not add bundled Bible text, commentary, accounts, cloud synchronization, telemetry, spiritual scores, streak incentives or an independent verse-note notebook through this design work.

## 2. Philosophy and product language

**Editorial calm for reflection, precise utility for recording.** The distinctive identity is a continuous field of verses revealing a person's recorded attention. Warm paper and restrained serif headings frame that field; compact tools make recording immediate; personal notes receive comfortable prose space.

Hierarchy: recording and orientation first; map second; relevant history/notes third; descriptive summaries and configuration fourth. Dense data and comfortable decisions coexist. Do not make every datum a card, repeat a marketing hero for returning users, or devote permanent map space to onboarding.

Before adding primary-workspace content, ask whether it helps someone record a reading, identify their place, understand evidence or inspect relevant history.

Use sentence case and explicit verbs. Wordmark is **jot & tittle**; prose product name is **Jot & Tittle**. Navigation uses the short labels above with accessible names Verse map, Reading history, Reading patterns, Your data. Main action is **Log a reading**; first use may say **Log your first reading**. New entry submits **Save reading**; editing submits **Save changes**. Prefer “recorded verses,” “readings logged,” “last recorded” and “no readings in this view.” Avoid “completed,” “behind,” “mastered,” achievement colors and encouragement that evaluates spiritual merit.

### Terms that must remain distinct

- **Current journal:** normal recording destination and default viewing journal. **Recording in:** explicit destination for a new entry. **View readings:** journal/date evidence filter, independent of recording destination. **Map scope:** verse geography, independent of evidence filters.
- **Reading record:** a saved session with passage ranges, date and optional note. **Encounter:** identity used to avoid counting copied records as separate encounters when aggregating journals. History/record counts can differ from deduplicated verse frequencies. Every summary names its unit.
- **Personal note:** belongs to a reading. An inspected verse can expose matching readings and their notes; it does not create a separate editable verse annotation.
- **Archive:** preserves read-only history. **Clear readings:** moves records to Trash. **Delete empty journal:** permanently removes that journal. **Permanently delete from Trash:** purges records. These are different operations.
- **Undo:** 30 seconds in the current tab; survives view/journal navigation, not reload/closing. **Trash:** 30 days in persisted storage. Trash is excluded from maps, history, patterns and backups until restored.
- **Download initiated:** an export request succeeded. It is not proof the backup file was saved or remains durable.

## 3. Foundations and tokens

Use one semantic source. CSS variables map dot names to kebab case: `surface.page` → `--surface-page`. Temporary legacy aliases may point to these values but must not redefine them. Keep data colors in the domain layer; UI tokens never override metrics.

### Color roles

- Page `#F7F5EF`; panel `#FFFEF9`; disabled surface `#EEF0E7`; error surface `#FFF1ED`.
- Primary text `#29392E`; secondary/disabled text `#5E6A5B`; on-action text `#FFFEF9`. Placeholders use secondary text, not reduced opacity.
- Primary action `#365640`; hover `#294632`; pressed `#233C2C`; disabled action `#EEF0E7`. The hover token is **action.hover**, not action.primary.hover, because Penpot cannot combine a leaf token with a nested namespace at that path.
- Selection surface `#E7EEE3`, plus an explicit marker/check/current-state label.
- Subtle border `#DCE1D5`; essential outlined-control boundary `#7B8B77`. A fine divider is not an adequate sole input boundary.
- Focus ring `#29392E` with panel-colored separation `#FFFEF9`.
- Error/destructive `#963F35`; hover `#7F322B`; pressed `#692720`. Always pair with explicit text.
- Modal backdrop uses `#29392E` at 0.18 opacity. It indicates inactive background; it does not establish readable foreground contrast by itself.

Neutral surfaces dominate. Forest marks actions and selection; red identifies an error or a clearly destructive action. Success uses forest and explicit saved text/check, not a new success palette. Archive, sample, loading and empty states are neutral. Prose links use forest plus underline. Do not use gradients, paper textures, large decorative green regions, unrelated category colors or religious imagery as filler.

[Color calculations](color-contrast-r2.json) use opaque sRGB relative luminance. Primary/page is 11.21:1, secondary/page 5.22:1, panel text/forest 8.12:1, essential border/panel 3.58:1. Subtle border/panel is only 1.32:1. Calculated default/hover/pressed destructive pairs and disabled text/surface meet the specified targets; real rendering still needs verification. Ordinary text targets 4.5:1; qualifying large text 3:1; essential non-text controls/states 3:1 against adjacent colors. Do not round a failing ratio up. [W3C text contrast](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html), [non-text contrast](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html).

### Typography

Root font size is 100%; use rem equivalents for text. Operational stack: `system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`. Editorial stack: `Georgia, "Times New Roman", serif`. No remote fonts are required. Penpot uses **Inter and Source Serif 4 as visual proxies**; do not add them to the app or claim pixel-identical font metrics.

Exact default roles:

- Wordmark: editorial 24/32px, weight 400.
- Page title: editorial 32/40px desktop, 30/38px tablet, 26/34px phone, weight 400. First use follows this scale; no separate oversized hero.
- Editorial section/dialog/passage heading: 24/32px, weight 400. Phone passage-detail page uses the phone page-title role.
- Utility subdivision: operational 20/28px, weight 600. History passage title: operational 18/27px, weight 600.
- Notes/body/explanation: operational 16/26.4px (1.65), weight 400. Fields and compact table data: 16/24px.
- Buttons/navigation/labels: operational 14/20px, weight 600. Metadata/help/status: 14/20px, weight 400.
- Summary number: operational 24/32px, weight 600, tabular numerals. Dates/count columns also use tabular numerals where alignment helps.
- Compact chart axes/captions: 12/18px only with full labels and exact data available in text. Narrow phone navigation may use 12/18px; essential form instructions/actions elsewhere remain 14–16px. Do not shrink body text to make a layout fit.

Preserve paragraph breaks. Notes cap at 65ch; wrap long words/URLs. Journal names support 60 characters. References may span books and multiple ranges; editors never truncate their value. Visual previews may shorten content only with access to the full text. Type scales with user settings; fixed text-container heights must not clip it. Reserve capitalization for short ancillary labels, not entire navigation rows.

### Geometry, layers and motion

Spacing scale: 4, 8, 12, 16, 24, 32, 48px. Labels sit 8px above fields; helper/error text 8px below. Related controls use 8–12px gaps, form sections 24px, page sections 32px. Control radius 8px, panel/dialog radius 12px, cells/rows square. Pills are limited to tags and compact intentional choices.

Primary buttons/fields are at least 48px high; ordinary secondary/icon/row actions have at least 44×44px interactive footprints. Icons are 20px within the target. Text and localization may increase height. This 44px product goal is stronger than WCAG 2.2 AA's generally 24px minimum with exceptions/spacing provisions. [W3C target size](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html).

Permanent surfaces are flat. Use spacing, panel fill and 1px structural rules; overlays use a boundary and backdrop rather than a required shadow. Layer defaults: content 0, sticky 10, navigation 20, popover 30, modal 40, status 50. A modal's operation feedback belongs inside that modal, not behind it or over its actions.

Feedback transitions are 120ms; overlay transitions 180ms; easing `cubic-bezier(.2, 0, 0, 1)`. Reduced motion removes animated relocation and illustrative motion. First-use illustration has labeled Pause/Play and freezes under reduced motion. No looping animation on real recorded cells, automatic map pan on arrival, or sound-based-only feedback.

Reuse Lucide outline icons, approximately 2px stroke. Existing navigation mappings are Grid2X2, BookOpen, ChartNoAxesColumnIncreasing, HardDrive. Pair primary icons with words. Give every icon-only action an accessible name; tooltips supplement visible touch/keyboard instructions. Do not mix filled and outline icon families.

## 4. Responsive composition

Use these bands rather than accumulating historical CSS overrides:

- **Desktop, ≥1024px:** 192px sidebar; main gutters 32px. Main usable width is viewport minus 256px. At 1440px it is 1184px, starting at x=224. Branding/current journal/navigation live in the sidebar; heading, evidence scope and logging action occupy the main header.
- **Tablet, 768–1023px:** full-width brand/journal header, horizontal four-item top navigation, 24px content gutters. At 768px content is 720px. Stack tools naturally; no sidebar or desktop first-use columns.
- **Phone, <768px:** one column, 16px gutters, visible journal/destination context and recording action, four labeled bottom destinations. Navigation is at least 64px plus bottom safe area; content reserves its actual height plus 16px. At 320px retain the 16px gutters and wrap labels/actions.

Adjacent detail uses a **328px pane and 24px gap only at ≥1248px**, leaving at least 640px map width. At 1440px the map is 832px wide. Do not promise two-thirds at every width. Below 1248px, passage/history detail uses a separate content view with a return action; action/settings confirmations remain modal. Preserve evidence scope, geography, selected reference, search/page and scroll on return.

Keep reading action reachable without a repeated hero. Sticky headers must not obscure focus. When the virtual keyboard would cover bottom navigation, hide that navigation and preserve a clear return action. Forms scroll focused fields and Save into view; a fixed footer never covers notes/errors. Use dynamic viewport height and safe-area insets. Status sits in normal flow or above navigation without covering controls.

Ordinary content must reflow at 320px, text resize and zoom. A fixed map can scroll within its visualization region; do not allow its width to overflow the whole page. Popovers escape map clipping, clamp to viewport edges and wrap long items. A long title or journal name grows its row rather than displacing actions outside the screen.

## 5. Shared component state contract

State is combinable: interaction (default/hover/pressed/focus), selection, availability (enabled/disabled/read-only), process (idle/busy), validity (neutral/error). Focus coexists with selection/error. Busy does not erase context. Hover applies only where hover is supported.

### Actions and selection

Primary: 48px minimum, 16px horizontal padding, 8px content gap, 8px radius, 14/20 weight 600. Forest/panel text; darker hover/pressed tokens. Secondary: 44px minimum, 12px horizontal padding, panel/primary text, essential border 1px; hover selection surface, pressed forest inset marker. Quiet actions retain a 44px target and primary text; prose-like links are underlined.

Focus-visible: 2px ink outline, 2px offset, 2px panel separation against a dark fill. Include links, custom selections and controls in errors. Disabled: explicit disabled surface/secondary text, no blanket opacity; explain unavailable prerequisites when consequential. Read-only is still readable/selectable; it is not a disabled editor.

Busy actions keep their width/context, prevent duplicate submissions and name the operation: Saving, Moving, Copying, Restoring, Importing, Exporting. Progress graphics are decorative when text conveys status. Destructive actions use error tokens only after intent is clear; row actions remain secondary. Selected navigation/metric controls combine surface with marker/check and semantic state; focusing or hovering never clears selection.

### Fields, options and disclosures

Fields: visible label, native type where appropriate, 48px minimum, 12px horizontal padding, 16/24 text, essential border 1px, radius 8px. Textarea minimum 104px and vertically resizable. Multi-passage inputs may wrap. Error retains value and adds error border/text; focus ring remains visible. Disabled shows reason; read-only retains primary text and contextual label. Processing never blanks input.

Normal validation does **not disable Save merely because editable input is invalid**: submitting must reveal/focus the error. Disable writes for busy, storage unavailable, read-only context or no eligible destination, with a reason. This is the r2 decision where earlier reviews differed.

Checkbox/radio marks are 20px within a labeled 44px target, with shape/check plus color. Native select is preferred. A custom popover has panel fill, essential border, 12px radius, padding 8px, rows ≥44px, selected check/text, explicit keyboard/dismissal behavior and restored trigger focus. Width is content-driven, minimum 200px when possible, maximum viewport minus 32px.

Use genuine ARIA tabs only for tab panels with their keyboard contract. Map metrics/layout choices and Map/Text presentation can use named groups of native pressed buttons. Disclosures expose expanded/controls state; Apply/Cancel form disclosures are distinct from an immediate-action menu. Pagination uses labeled Previous/Next, visible page/range and disabled boundaries; keep the initiating control focused and announce the changed result.

### Lists, detail, dialogs and messages

History rows are flat, 16px vertical padding, 12px content gaps and subtle divider. Passage first; date/journal next; count/preview last. Selected row has selection surface and a 3px forest edge. Rows grow for content; full notes use body typography. Touch/keyboard More actions expose visible Move/Copy/Delete labels.

Desktop detail is a labeled nonmodal complementary region: no inert background, modal semantics or trap. Explicit Inspect focuses its reference heading; preview does not steal focus. Close restores the initiating control or a stable replacement. Handle Escape within the detail surface, outside editing fields/forms, using that stored origin; route/browser Back follows the same return-state rule. Phone detail is a separate view with Back to map/Text view, heading focus and return-state restoration.

Dialog: panel surface, essential border, radius 12px; width min(560px, viewport minus 32px), padding 24px desktop/16px phone; max-height available dynamic viewport minus 32px. Title 24/32, close ≥44px, section gap 24px, actions gap 8px and wrap. Long content scrolls; context/actions stay reachable. Modal background is inert; focus contained; Escape/Cancel when safe; restoration on close. Long informational dialogs initially focus a heading. Permanent confirmations initially focus Cancel. Empty dialogs keep Tab on the dialog itself.

Inline status: 12px padding, 8px gap, 14/20 text, explicit operation/context. Error surface/border and corrective message; success neutral/selection surface with forest/check and named result. Toast max-width 480px or viewport minus 32px, padding 16px, action targets 44px; important recovery remains accessible after dismissal. Persistent polite status announces saves/results once. Actionable errors associate with the responsible field/surface. Never announce every hover, countdown tick or partial keystroke.

## 6. Shell, journals and evidence filters

The shell has a named navigation landmark, skip-to-main link, current-page semantics, stable reading order, current journal and local-storage status. Heading focus follows explicit view navigation, not routine filter/metric/resize updates. Preserve unsaved form drafts for reopening during the session; Discard draft is explicit. Navigation does not silently save or lose edits.

View scope above Map/History/Patterns names applied journals and inclusive date period. Recording destination is separately labeled when it differs. Draft filter selections do not style results as already applied. Modes are current journal, all active journals, selected journals; selected may include archives. Periods are all time, this month, this year, custom inclusive dates. This month and This year end at today; custom bounds may include preserved imported future records. Custom errors retain both values. Apply commits and announces scope; Cancel/Escape discards draft; Reset restores current journal/all dates. Chip removal restores focus to a surviving chip or filter trigger. Zero selected journals is a specific neutral empty state with Choose journals, not first-use onboarding.

Manage journals: name/status first, count second, regular lifecycle actions third; destructive actions separated. Names trim, require nonempty text, maximum 60 characters, case-insensitive uniqueness. Create/rename errors preserve input. Suggestions are optional secondary actions. Rename shows old name; Create journal and Save name are the primary verbs. Mobile stacks actions and wraps names.

The default journal may be renamed/cleared, never archived/deleted. Nondefault journals can archive/restore without losing data. Archived inspection exposes its name, read-only status and Restore/Return; no editable controls masquerade as enabled. Empty nondefault journal deletion is permanent; nonempty deletion is blocked with Clear/backup guidance. Permanent confirmation names the journal, keeps Export backup available and explains Trash may need another restoration destination. Ordinary archive/restore needs no extra destructive confirmation.

Lifecycle conflicts identify your intended change and the journal saved in another tab. Offer applicable Reload/Keep change/Cancel choices with consequences; never reuse a reading-conflict message for a deleted/renamed/archived journal. Missing or archived recording destinations disable new writes with guidance to select/create/restore an active journal.

## 7. Map geometry, metric meaning and legend

Keep one uninterrupted canonical sequence. No permanent book/chapter gaps, rounded individual verses or card per book. Book hover/structure-on-inspection is transient and distinct from a persistent selected verse.

R2 default is **4px square marks with 5px stride** (1px gap). UI Cell size values are 4, 6, 8, 10, 12, 14px; stride equals cell size plus one. Flow recalculates columns from available visualization width. Fixed has 160 columns, hence 800px internal width at default. This is an explicit geometry change from current code, where `zoom` is stride 4–14 and mark size is zoom minus one. Do not call current zoom=4 a 4px mark or change stored reading semantics through this migration. Disable size controls at endpoints and retain Reset size.

Geography: whole Bible, book, chapter or one continuous passage range, including cross-book ranges. Changing book resets chapter/passage; Whole Bible resets geography only, never journal/date evidence. Go to passage uses the existing parser but rejects discontinuous ranges for map geography; logging accepts multiple ranges. Invalid search retains the last valid map and field text. A single-verse inspector rejects larger ranges with a specific message. Map scope affects its recorded-verse summary; record/session summaries and Patterns are evidence-view relative and must say so when they differ.

Preserve domain colors in `src/domain.ts`:

- Neutral `#E5E8E0`; sequential single-metric colors `#D1DDBB`, `#B5CC8F`, `#91B669`, `#69964D`, `#467338`, `#294E29`.
- Frequency buckets: 1; 2–4; 5–9; 10–24; 25–49; 50+. Current journal, archived inspection and sample views count qualifying reading records. All active journals and Selected journals views deduplicate shared encounter identities, even when only one journal is included. Coverage counts distinct verses in either case. Labels and explanations state the applicable counting rule. Universal encounter deduplication would require a separately documented domain correction.
- Recency buckets: 365+ days; 90–364; 30–89; 7–29; 1–6; Today/within 24 hours. Date-only readings use local calendar-day age; known instants use elapsed time. The calculation date/time must be coherent across views.
- Combined changes hue by recency [28,45,63,85,110,145] degrees and lightness by frequency [70,60,50,41,32,24] percent. Saturation is 46 + 3×recencyIndex + 2×frequencyIndex. Preserve exact bucket indices/formula.
- No qualifying records produces neutral. Future last dates produce neutral in recency/combined under current semantics, while frequency can still show count. Therefore gray must not be labeled unconditionally “never read.” Exact filtered count/date and all-time context distinguish never recorded, filtered zero and imported future/legacy records. New logs reject future dates.

Compact combined legend shows **both** hue/recency and depth/frequency keys plus View color key. Expanded key has all 36 combinations with row/column labels, neutral explanation, date-only/instant distinction and the non-color access route. Single metrics show every bucket with visible labels. Hover titles alone are insufficient. Compact chart labels may use 12px with readable enlarged/full text access.

Selection uses dark outer and light inner locators, an explicit reference and focused/readable inspector; metric fill stays unchanged. Test every combination plus neutral, adjacent cells, map edges and zoom levels. Color perception and small-cell discriminability remain unvalidated; do not assert that 36 colors are universally distinguishable.

## 8. Equivalent text access, keyboard and touch

Text view is first-class visible content, reachable before interacting with the map. A shared evidence model supplies applied journals/date period and calculation time. Geography-aware selectors supply map, legend, Text view and passage detail; record/session summaries and Patterns use evidence filters without geography. Metric changes presentation, not the evidence model. Presentation changes do not alter recording destination. Persist presentation locally as a proposed preference.

Desktop uses a semantic table with scope caption, column headers, reference row headers and Inspect actions. Phone uses a labeled ordered list. Only the active representation enters the accessibility tree. Rows include every in-scope verse, including zeros, in canonical order; show reference, integer count, exact last date or No readings in this view, note count/access and full record context in detail. Provide an all-time last date separately where it explains filtered zero: all dates in the same selected journals, excluding Trash. With zero journals selected, return zero count, no date and no matching notes while retaining navigable canonical rows. Notes follow the active filters and are attributed to their reading/date/journal; do not multiply one multi-verse record in detail totals.

Pagination defaults: 12 verses desktop/tablet, 4 phone; shown range, total, Previous/Next, boundary buttons remain focusable with aria-disabled and suppress activation, preserving stable DOM nodes. These defaults are design hypotheses. Keep focus on the initiating page control and announce results once. Find passage accepts the same references/ranges as capture and keeps evidence filters and geography. It selects and pages to the first canonical in-scope match; labeled Previous match/Next match reach remaining matches and the result names omitted ranges. A partly/outside-scope request explains the mismatch and offers **Change passage scope** explicitly. Geography accepts one continuous range: choose one disjoint range or explicitly approve a continuous extent, never silently join disjoint ranges. Zero count is a valid match. Book/chapter/reference navigation avoids forcing thousands of pages.

Hide the canvas graphics from the accessibility tree only after equivalent data/actions work. A generic image name or current one-verse lookup is not sufficient. Do not create 31,102 Tab stops, fabricated ARIA grid cells or `role=application`. [W3C non-text content](https://www.w3.org/WAI/WCAG22/Understanding/non-text-content.html).

Optional spatial navigator is a named focusable group with visible instructions, plus ordinary Previous verse, Next verse and Inspect buttons. Left/Right move ±1 canonical verse; Up/Down ±actual columns (160 in Fixed). Clamp to scope. Home/End use in-scope row endpoints; Ctrl+Home/End use scope endpoints. Enter opens detail; Escape dismisses preview/detail and restores the useful origin. Normal Tab leaves; never intercept editing keys in fields. Deliberate navigation updates reference/count/date, keeps only its cell in view, and politely coalesces key-repeat announcements. Hover does not announce. Screen-reader browse-mode shortcuts are not guaranteed; standard text controls remain the dependable route.

Touch scroll/drag/pointer-cancel never records, opens detail or commits a selection. Stationary tap previews an inferred reference with an explicit Inspect passage action; tiny cells are not the sole entry point. Keep browser pinch zoom and normal scrolling; no `user-scalable=no` or global gesture suppression. Map size controls describe cell geometry, distinct from browser zoom. Dismissible previews stay within viewport, remain available while needed and have keyboard/touch equivalents. [W3C keyboard](https://www.w3.org/WAI/WCAG22/Understanding/keyboard.html).

## 9. Capture, editing and concurrency

Order: passage, parser preview/help, date, recording destination, optional notes, primary Save and secondary Cancel. Capture uses a separate page/card, with outer width at most 704px and 24px internal padding, yielding at most 656px content; generic modal width remains 560px. The desktop reference demonstrates the separate page/card; long explanatory prose/notes still respects 65ch. Phone is full-width inside gutters. New date defaults today; errors reject invalid/future dates. Editing preserves a known instant when its calendar date is unchanged; changing date produces date-only history. Explain legacy timestamp/date behavior where relevant.

Parse visibly while typing, but announce validation on blur/submit or a settled successful preview, not every incomplete fragment. Raw text remains editable; normalized references and unique verse count appear separately. Labels/help/errors use stable associations; invalid fields expose invalid state. Invalid submit focuses the first invalid field and preserves passage/date/notes/destination. Enter submits a single-line form; Enter in notes inserts a newline. Any save shortcut is supplementary and documented.

Saving prevents duplicates, retains draft and marks the form busy. While an atomic Save or Import write is pending, disable dismissal, Escape and Cancel, explain Saving/Merging, and restore dismissal on resolution. Never imply that closing cancels an in-flight operation. Success follows persistence, names passage/date/journal and whether current filters hide the record. Show this reading states that it changes filters: clear date restrictions, choose the saved journal, focus the first saved range. Retain discoverable saved context in History after a transient status closes.

Edit begins with original values and Save changes; its journal is not silently changed through a destination picker. Move is separate. Closing a form retains an unsaved session draft; explicit Discard draft abandons it. Cancel changes no stored record. Storage failure appears inside the active surface, keeps every value and offers retry/backup where safe.

Cross-tab conflict distinguishes **Your draft** from **Saved in another tab**, with full references/date/journal/notes. Show only applicable Keep mine, Use theirs, Save as new reading, Discard edit, Delete current version or Cancel. Explain which version survives. Long comparison text scrolls/wraps without truncation. A removed record cannot be silently recreated as an overwrite. Journal conflicts use journal-specific context, not this reading comparison. Every resolution checks the latest stored revision again; another change reopens comparison. Keep mine never silently recreates a deleted journal or bypasses default-journal, archive, destination or permanent-deletion restrictions.

## 10. History, notes and record operations

Date-only readings show their calendar date without an invented time; known instants show local date/time with timezone context. History follows the domain comparator in descending order: newest local calendar day first, known instants newest first within a day, followed by date-only records with no inferred order among unknown times. First/last statistics use the same comparator. Group history by date, newest first; show the search-result count separately from total evidence-view records. Search supports raw/normalized references, notes and date forms. Distinguish no match from no records in the journal or filters. Preserve query and group orientation after detail/edit return.

Rows use passage title, date/journal, unique verse count and optional preview. Full notes retain whitespace in detail. No notes is neutral. Sample/archive detail is explicitly read-only. Text-entry and verse-event lists open the same reading detail; one selected passage can expose multiple matching records. Contextual actions remain labeled when expanded.

Move/copy names source passage/date/journal and destination/effect. Eligible destinations are active, distinct journals; no same-journal copy. If none exists, offer Create journal or Cancel. Retain selection on failure. Copies retain encounter identity and add a history record; aggregate verse frequency deduplicates encounters. Notes-only edits do not create a new encounter; changing a copied date/ranges does. Do not label record count and deduplicated encounter count identically.

Delete reading and Clear readings name exact target and affected count. Clearing uses the confirmation snapshot; readings added afterward in another tab remain. Use the actual selected journal name in confirmation and feedback, not whichever journal is viewed. Persist before removing rows. Destructive action is distinct from Cancel; explain Undo/Trash recovery. After deletion focus a surviving row or heading, never a removed trigger.

## 11. Undo, Trash, archival recovery and permanence

Undo notices preserve operation/count/journal context, Undo and Dismiss, 30-second remaining availability and inline failure. Multiple notices stack without covering navigation or focused actions. Announce initial availability once, not every tick. Dismiss closes only the notice. When Undo expires, offer Trash rather than imply all recovery ended.

Trash groups show record count, original journals, deleted/expiry dates and expandable full record context. Restore is primary; purge is separated/destructive. Destination must be eligible and explicit when original journals are missing/archived. Preserve chosen destination/error on failure. Restoration is atomic; ID collisions, expired/already restored/purged groups and unavailable destinations explain recovery. No automatic overwriting. After success preserve neighboring orientation.

Purge confirmation names group/count and permanent consequence; Cancel receives initial focus. Empty-journal deletion is a different permanent action with its own name/context. Export omits Trash: state **Restore readings before exporting if you want them in the backup**. Do not promise that Undo or Trash survives clearing browser storage.

## 12. Patterns and quantitative presentation

Patterns uses the applied journal/date evidence view, not current map geography. Explain count units. Unique verses have at least one qualifying record; revisited verses have frequency greater than one; total verse readings sum the applicable frequencies. Current journal, archived inspection and sample views count qualifying reading records. All active journals and Selected journals views deduplicate shared encounter identities, even when only one journal is included. History/session counts always count saved records. Explain this distinction wherever aggregate copies affect the totals.

Use modest 24px summary numerals and plain labels. Book breakdown retains all 66 books in canonical order, with textual recorded fraction and percentage using the book's verse total as denominator. Bars describe recorded coverage, not achievement. Zero is a known count; “—” means no applicable date, not unknown canon size. No red unrecorded books, celebration for high percentages or rank badges.

Repeated-verse list sorts count descending then canonical order for ties; explain ties where useful. Empty/no-repeat state is neutral. Book/verse actions retain evidence filters while opening geography/detail. Provide textual chart equivalents, full accessible action names and focus. Verify empty, one reading, repeats, filtered periods and aggregate-copy cases.

## 13. Your data, backup, import and system states

Primary copy says **this browser on this device**; put IndexedDB/database/canon/version details in About. Privacy, portability and durability are distinct: local records are not automatically backed up. Different browsers/origins can hold different histories. No account sync is implied. Offline use depends on a completed first load and supported origin; do not claim dev-server or never-loaded offline availability. Source-code download is explicitly not personal-data backup.

Initialization has its own state: keep shell/Loading your readings context, disable writes until storage is ready, and avoid briefly showing first-use empty or “saved locally” before readiness. Storage-open/upgrade-blocked failures show recovery guidance, retry when supported and safe labeled sample exploration. Never label failed persistence successful. Any proposed live offline indicator must be backed by actual state, not decorative certainty.

Export includes all journals, including empty/archived, ignores view filters and excludes Trash. Show never initiated, unexported changes, exporting, download initiated, current snapshot status and failure distinctly. Preserve prior status on failure. “Download initiated; check the saved file” is the success language; no guarantee of durable backup. Prevent duplicate export and keep scope nearby.

Import states: chooser cancelled (no change), filename selected, Reading backup, malformed/unsupported/canon/date/ownership failure, validated preview, no additions, duplicate-heavy, renamed journal collisions, legacy conversion, archived destination conflict, merging, completion and write failure. Validate before offering merge. Preview uses actual format version, filename, additions, existing IDs kept, journal rename mappings and affected destinations. Cancel never mutates existing records. One primary Merge action; retain preview on failure. A newly imported archived journal retains its archive state and imported history; adding readings to an existing archived journal requires restoring that destination first. Preview distinguishes these cases. Atomic merge preserves concurrent changes and existing IDs. If concurrent changes alter additions, duplicate counts, destination eligibility or rename mappings, refresh the preview before an actionable merge; completion reports actual committed counts and names. Reset file input so the same corrected file can be selected again.

Errors remain local to the initiating form/dialog as well as an appropriate global storage notice. Read-only, busy and unavailable are distinct. Do not silently discard imported content, hide essential recovery in a 4.5-second toast, or present a technical stack trace as the user's next step.

## 14. Required state coverage and implementation mapping

These state families must receive design/implementation evidence; component specimens can cover combinations without a full-screen board for every permutation:

- Shell: four destinations, long names, current/evidence/destination differences, sample/archive notices and all responsive bands.
- Initialization/first use: loading, blocked storage, true personal empty, paused/reduced-motion illustration, labeled sample and return to personal.
- Filters: collapsed/expanded, draft/applied, modes, invalid custom dates, zero selected, chip removal, reset and filtered empty.
- Map: whole/book/chapter/cross-book scope, invalid/discontinuous geography, all metrics, Flow/Fixed, size endpoints/reset, full legends, hover/selected/focus at edges and palette extremes, never/filtered-zero/future date, text inspector and complete Text view.
- Capture/edit: blank/typing/valid/invalid/date-invalid/multi-range/long-note/legacy, busy, saved/hidden-by-view, storage failure, retained draft and every applicable conflict branch.
- History/detail: day groups/search/no match/empty/long content/read-only, move/copy eligibility and failure/success, delete/clear snapshot and accurate targets.
- Journals: create/rename validations, mixed active/archive manager, restore, default restrictions, blocked/permitted deletion and concurrent lifecycle conflicts.
- Patterns: zero/one/repeat/filtered/copy-deduplicated evidence, book disclosure/canonical ties, context-preserving navigation.
- Data/recovery: every export/import state, collisions/legacy/archive conflicts, multiple Undo/expiry/reload, empty Trash/destination/ID failures, restore and purge.
- System/access: long strings, text resize/spacing, keyboard/pointer/touch, reduced motion, mobile keyboard/safe area, focus/status occlusion and assistive technology.

Existing mapping: shell/capture/history/patterns/data/journal/conflict/recovery JSX in `src/main.tsx`; `ReadingViewControls` filters; `MapDisplayControls` display; `Heatmap`/`layout.ts` geometry; `MetricLegend` data key; `ReadingDetail` record notes; `Dialog` modal behavior; `domain.ts` parser/counts/palette; `journals.ts` encounter aggregation; `storage.ts` persistence/recovery; `backup.ts` serialization. TextView, adjacent detail, FieldFeedback, RecoveryNotice and ImportPreview are proposed component extractions/additions, not existing implementation claims.

Implementation sequence: (1) shared tokens/type/responsive shell and combinable controls; (2) shared evidence model, Text view, exact inspection and focus/touch paths; (3) capture/draft/validation/storage conflicts; (4) journal/transfer/recovery/import consistency; (5) Patterns/long-content polish; (6) design fidelity, accessibility and real-user validation. Preserve domain/storage semantics unless a separately documented correction is needed. Do not encode layout changes in data migrations.

## 15. Verification, research and acceptance

Compare matched states at 1440×1000, 768×1024, 390×844 and 320×720; also inspect 767/768, 1023/1024 and 1247/1248 boundaries. Exercise 200% text resize, 400% browser zoom/reflow, text-spacing overrides, long references/60-character journal names/multi-paragraph and unbroken notes, reduced motion, keyboard-open phone and safe areas. Essential two-dimensional map geometry has a bounded reflow exception; ordinary controls/prose do not. [W3C reflow](https://www.w3.org/WAI/WCAG22/Understanding/reflow.html).

Verify actual contrast for all interaction/selection/error combinations, locator over all 36 cells plus neutral, no focus obscured by authored surfaces, hit targets, labels/roles/states and error associations. Keyboard-only workflows cover capture, filters, search/paging/zero verses, notes/editing, dialogs, import and recovery. Check modal root/no-control/nested focus trapping and removed-trigger restoration. Announcements are deliberate and deduplicated. [W3C focus not obscured](https://www.w3.org/WAI/WCAG22/Understanding/focus-not-obscured-minimum.html), [modal guidance](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/), [status messages](https://www.w3.org/WAI/WCAG22/Understanding/status-messages.html).

Meaningful automated tests verify shared-query equivalence across map/text/detail including zeros and filter combinations; pagination has no missing/duplicate IDs; navigator handles partial rows/clamps; invalid import/write failure changes no data; copy deduplication matches labels; draft/Undo/Trash/concurrency outcomes remain correct. Visual exports are fidelity references, not browser regression baselines. Establish baselines only after reviewing the build against them.

Manual assistive-technology journeys must include VoiceOver/Safari and another supported desktop pairing such as NVDA/Firefox or Chrome; include phone VoiceOver/TalkBack for supported mobile use. Record actual versions/results. Automated checks and code inspection cannot establish conformance. WCAG 2.2 AA is the intended target, not a certificate.

Planned formative research: 5–8 actual/prospective returning readers, including phone-first and relevant keyboard/low-vision/screen-reader participants. No recruitment or results have occurred. Use fictional/disposable journals. Record success, assistance, time, misinterpretation, lost input and accidental actions. Tasks:

1. Log multiple passages with date/destination and a two-paragraph note; one correct record, no accidental duplicate. Initial speed hypothesis: under 60 seconds excluding note composition.
2. Find a filtered zero-count verse and distinguish no readings in this view from never recorded, without color dependence.
3. Inspect/edit a long note and return with reference, filters, page/scroll and useful focus preserved, on desktop and phone.
4. Navigate Text view by scope/search/paging through a final verse, inspecting count/date without canvas use or thousands of Tab presses.
5. Scroll/pinch the phone map and inspect through reference controls, without accidental selection/logging or blocked browser zoom.
6. Correct invalid passage/date and recover from persistence failure without re-entering unaffected input.
7. Explain a duplicate/name-collision import preview, cancel without changes, then merge once; delete/restore through the appropriate recovery path.
8. Interpret frequency, recency and combined examples against exact dates/counts; identify ambiguous hues and revise legend/defaults if needed.

Repeated task failure or an inaccessible primary path blocks acceptance; document and retest affected journeys. Default pagination, interaction speed and color discrimination are hypotheses, not claimed findings. All future revisions must update this document, tokens, contract and relevant Penpot/export references together.

## Information design refinement · 2026-10-08

The information architect, marketing director, copywriter and social media marketer approved punchlist v3 before implementation. This refinement governs current copy where historical r2 reference boards show different wording; board IDs, tokens and geometry remain unchanged.

- P1: Keep the wordmark descriptor, use operational navigation and footer labels, and explain the nonjudgmental philosophy once in About. Remove decorative sidebar/footer slogans. The map reflection card points to reading exploration.
