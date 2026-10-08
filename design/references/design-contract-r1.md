# Jot & Tittle design reference · revision 1

Date: 2026-10-08. Status: implementation reference drafted by the agent under the user's redesign request; not explicitly approved. Base: ca62e0e.

## Product intent and scope

Preserve the original specification (see original-spec-excerpt.md): data before hierarchy, structure on demand, fast capture, local ownership, descriptive analytics. Keep React/Vite, verse colors, continuous canonical flow, journal isolation, and all existing backup/recovery behavior. No scores, streaks, remote fonts, or services.

This pass improves first-run capture, visual hierarchy, map tools, history readability, and mobile navigation. The default map stays a dense uninterrupted field; book and chapter structure appears through controls and inspection.

## Canonical reference

Local editable SVG: references/first-reading-desktop-r1.svg. This contract defines states and adaptations beyond that first-run composition. Penpot access was attempted but reported no connected instance; service synchronization is unverified. Local files are canonical for this revision. Browser captures in evidence/ are verification evidence, not independent design references or regression baselines.

## Routes and states

The app uses in-app views, not separate routes: Map, History, Patterns, Your data. First-run Map: concise introduction, first-reading action and sample action beside the illustrative map; storage guidance below. Logged/sample Map: compact scope-aware counts, map display and passage tools, then a visually separated text inspector and recent readings. History: readable passage titles, secondary date/notes, flexible search. Existing loading, parser validation, storage failures, empty filtered views, archived read-only, backup/import and deletion recovery remain supported.

## Tokens and component mapping

Paper #f7f5ef; surface #fffef9; ink #29392e; secondary ink #5e6a5b; forest #365640; soft green #e7eee3; line #dce1d5. Georgia headings and numerical summaries, system sans-serif controls. Working text 14–16px; decorative labels 11–12px; heading 44px desktop / 34px mobile. Spacing 4/8/12/16/24/32/40. Surface radius 12px; controls 7px. No added animation; preserve demo pause/reduced-motion behavior.

Shared tokens in src/design.css map to sidebar, welcome, view-controls, map-card, reading-summary, inspector, history and dialogs. Retain domain metric palettes unchanged.

## Viewports and interactions

Desktop 1440×1000: 228px sidebar, bounded main content, two-column welcome with action column first in reading order. Tablet 768px: existing narrower sidebar and stacked welcome. Mobile 390×844 and 320×720: journal selection above content, persistent bottom navigation with icons/text, sticky reading toolbar, stacked welcome with actions before illustration, wrapped scope/display/inspection controls. All three summary values remain visible at narrow widths. Account for bottom safe-area and reserve content space.

Actions retain explicit names; sample data never mixes with personal history. Map search opening moves focus to the reference field; Escape closes it and restores trigger focus. Text inspection stays available without requiring canvas interaction. Passage fields retain inputs after invalid submissions. Mobile Log a reading remains available when scrolling.

## Acceptance and assumptions

Target WCAG 2.2 AA: labels, visible focus, keyboard reachability and modal containment/restoration; accessible metric equivalents; 44px touch targets; no horizontal page overflow at 320px; reduced motion; readable tooltip text. Automated/manual checks are evidence, not conformance certification. Screen reader use remains untested unless separately exercised.

Assumption: retain established restrained identity. Preserve shipped Combined default even though the original early specification described it as a future option. No new product integrations or paid design-provider configuration.
