# R2 consistency review resolution

2026-10-08. Three specialist subagents audited workflow coverage, visual measurements, and interaction/accessibility, then reread the canonical document and tokens through successive correction passes. Final reviews reported no further consequential contradictions in their areas. This is specification review, not proof of implementation or usability.

Resolved decisions:

- Counting follows view mode: Current journal/sample/archive count records; All active and Selected journals deduplicate encounters even with one selected journal. History counts records. Preserve existing semantics.
- History sorts the domain comparator descending: known instants precede unknown times on the same day. Date-only entries have no invented time.
- Capture is a separate card/page, outer704/content656 with24px padding; ordinary dialogs cap at560px.
- Invalid editable Save stays enabled to submit/focus validation; busy/read-only/unavailable are separate states.
- Pager boundary buttons remain focusable with aria-disabled, retaining initiating focus.
- Disjoint Find matches retain geography and evidence filters; scope change is explicit and continuous.
- Map/Text/detail use geography-aware selectors; Patterns and record totals use evidence filters only. All-time explanations retain the same selected journals.
- Atomic Save/Import blocks dismissal while pending. Detail Escape handles its own surface and restores the stored origin.
- Newly imported archived journals retain imported history; adding to an existing archived destination requires restoration. Concurrent changes refresh actionable preview; completion names actual committed results.
- Conflict resolutions recheck current revisions and cannot silently recreate deleted journals or bypass restrictions.
- Undo/Trash/purge/archive/clear/empty-journal deletion remain distinct. Save confirmation offers inspection rather than inventing a new-entry Undo action.
- Numeric tokens, responsive thresholds, type roles, states, colors and proposed map-size geometry agree. Penpot font proxies and unwired specimen controls are declared limitations.

Remaining acceptance work is explicit in guidelines §15: actual build fidelity, rendered contrast, responsive/zoom/input testing, screen-reader workflows and representative user research. None was claimed completed by this document review.
