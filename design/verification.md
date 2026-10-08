# Design verification · revision 1

Verified 2026-10-08 against the revision 1 design contract and editable desktop SVG. Implementation: working-tree changes based on ca62e0e. No screenshot regression baseline was introduced.

## Passed

- Production build and TypeScript check; all 52 domain/storage unit tests.
- Chromium + mobile Chromium: 45 browser checks passed, one desktop-only skip of the touch test (the mobile instance passed). Suites: design, accessibility, ux-view, empty-demo, workflows, map.
- WebKit + mobile WebKit: 18 checks passed. Suites: design, ux-view.
- 1440×1000, 768×1000, 390×844 and 320×844 first-run, save, map, history and reload journeys. Real multi-passage input and long notes. No horizontal page overflow. The 320px first-reading action remains within the viewport.
- Persistent mobile navigation and reading toolbar stay in the viewport while inspecting lower content. Save notifications do not overlap navigation.
- Passage search receives focus when opened, closes with Escape, restores focus to its trigger and retains the entered passage. Submission focuses the map on the expected verse.
- Existing keyboard canvas navigation, modal containment and focus restoration, journal management, view drafts, alternate recording destination, sample isolation, import/export and local reset checks passed.
- Demo pause/resume and reduced-motion behavior passed.
- Existing rendered filter-caption check passed its minimum 14px font size and 4.5:1 contrast threshold. Tooltip secondary text now uses a light color on its dark background.

## Visual review

Inspected browser-rendered desktop first-run and sample map in the in-app browser. Inspected saved Chromium screenshots at 1440, 390 and 320px against the design contract. Composition, type, colors, action ordering, and stacked mobile adaptations match the intended hierarchy. The SVG is a composition reference, not a pixel-exact target: operating-system font metrics and the illustrative demo state differ.

The initial pass found a 13px filter caption and a save notification overlapping bottom navigation. Both were corrected, and affected tests were rerun. Desktop map scrolling retains the original 820px limit so the dense verse field keeps its existing capacity.

Evidence: evidence/first-reading-{1440,768,390,320}-r1.png and evidence/recorded-map-{1440,768,390,320}-r1.png. Captured with Chromium, UTC locale en-US, fixed 2026-10-05 test clock and reduced motion. The recorded-map images include the success notification. They are review evidence, not design authorities.

## Not exercised

No screen reader session, full automated axe scan, physical phone, explicit browser zoom test or full WCAG conformance audit. Firefox and the unrelated full end-to-end suite were not rerun for this presentation change. Penpot synchronization could not be verified because no instance was connected. Existing recovery and offline logic were unchanged; offline-specific tests were not rerun.
