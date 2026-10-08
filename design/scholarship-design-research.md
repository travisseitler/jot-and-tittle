# Design philosophy from Bible reading and scholarship tools

Research date: 2026-10-08. Status: proposed direction, not user-approved. Three subagents examined eight platforms; synthesis is by the primary agent. This research does not change the current interface or establish a new approved visual reference.

The follow-up [visual audit](visual-audit-findings.md) covers size, color, shape, typography and density. The [Visual Design Guidelines](visual-design-guidelines.md) translate these findings into proposed app tokens and component rules: **editorial calm for reflection, precise utility for recording**.

## Core philosophy

**A quiet, verse-anchored record of attention: immediate capture, continuous orientation, and depth on demand.**

Jot & Tittle should make it easy to record what someone read, understand where that reading belongs, and investigate their own history without losing their place. The uninterrupted verse map remains the main surface. Detail grows around a selected verse or passage. Personal records remain authoritative and portable.

The research supports reference anchoring and progressive depth. Local-first ownership and descriptive, non-gamified analytics come from the original product brief. We should retain those choices rather than attribute them to a competitor consensus.

## Scope and confidence

Subagents inspected live public desktop interfaces for Bible.com, Bible Gateway, Bible Hub, Logos guest mode, STEP Bible, Blue Letter Bible, Sefaria and NET Bible. Official documentation supplemented observations. No authenticated annotation workflows, mobile comparison, screen-reader session or usability study was conducted. Reach is a sampling rationale, not evidence of design quality.

There is no comparable public ranking of scholarship-specific usage across these eight products. Similarweb estimates place Bible Gateway third in worldwide Faith and Beliefs web traffic for September 2026. Its August pages place Bible Hub seventh and Bible.com ninth in that category in the United States; Blue Letter Bible's July page places it fifteenth. These dates and geographies differ. They establish prominence, not a single league table. [September category ranking](https://www.similarweb.com/top-websites/community-and-society/faith-and-beliefs/), [Bible Hub](https://www.similarweb.com/website/biblehub.com/), [Bible.com](https://www.similarweb.com/website/bible.com/), [Blue Letter Bible](https://www.similarweb.com/website/blueletterbible.org/).

YouVersion reports over one billion installs across its family of apps; Logos reports more than four million users served; BLB reports over forty million unique users across website and apps in 2025; Sefaria reports 775,000 average monthly users in 2024. These are differently defined, self-reported measures. No comparable current STEP or NET audience measure was established. [YouVersion](https://www.youversion.com/history), [Logos](https://www.logos.com/about), [BLB newsletter](https://www.blueletterbible.org/assets/pdf/newsletter/2026-02_BLB-Newsletter.pdf), [Sefaria report](https://www.sefaria.org/static/files/Sefaria_Impact_Report_2024.pdf).

## What the interfaces show

### Bible.com / YouVersion

Observed: a spacious serif chapter reader with compact translation, audio and navigation controls, plus recent passages. Videos follow the reading rather than taking its opening position. Lesson: continuity and low visual competition support the main task. Its reading-first default does not transfer literally to a product whose core is a map. [Observed John 1](https://www.bible.com/bible/111/JHN.1.NIV).

### Bible Gateway

Observed: direct reference search and version selection, with chapter text beside a separate study panel. Passage tools and footnote return links preserve textual context. Plus and shopping promotions introduce competing actions. Lesson: auxiliary exploration can stay adjacent to a stable primary surface. [Observed John 1](https://www.biblegateway.com/passage/?search=John%201&version=NIV).

### Bible Hub

Observed: a precise verse address ties together translations, nearby text, cross-references, commentary and Greek material. Dense abbreviated navigation makes many destinations reachable but increases the learning burden. Lesson: stable verse identity is more transferable than the quantity of visible links. [Observed John 1:1](https://biblehub.com/john/1-1.htm).

### Logos

Observed: the guest workspace presents Bible, Insights and commentary together, with matching reference and link set. Official guidance confirms synchronized resources and expandable excerpts. Lesson: maintain one selection across related surfaces. Its multi-panel controls are proportionate to a large library, not necessarily a small reading journal. The accessibility tree directs users to limited view mode for assistive technology; this is a specific access-mode observation, not an accessibility audit. [Web introduction](https://support.logos.com/hc/en-us/articles/360023029051-Get-started-with-Logos-for-free), [Insights documentation](https://support.logos.com/hc/en-us/articles/25352521268109-Using-the-Insights-Panel).

### STEP Bible

Observed: reference/translation controls sit above the text; global tools have text labels; chapter/book summaries open contextually. Original-language and comparison functions are documented. Repeated help overlays compete with first use. Lesson: label capabilities plainly and let context open without a route change. [Live app](https://www.stepbible.org/), [Official overview](https://stepweb.atlassian.net/wiki/spaces/SUG/pages/31195147/Quick%2Boverview).

### Blue Letter Bible

Observed: each verse has a Tools action that inserts a tabbed research panel immediately beneath it. The selected verse remains above the panel. Lesson: let an individual mark open its relevant records in place, with a clear close/return path. [Observed John 3](https://www.blueletterbible.org/kjv/jhn/3/1/).

### Sefaria

Observed: selecting a verse highlights it while retaining the surrounding chapter, opening categorized related sources beside it. Counts communicate available depth. Promotional overlays also compete with reading. Lesson: context should survive investigation, and categories should communicate what opening them will reveal. [Observed Genesis 1:1](https://www.sefaria.org/Genesis.1.1?lang=bi&with=all&lang2=en).

### NET Bible

Observed: passage and notes coexist; note categories distinguish translation, study and textual criticism. Markers connect prose to detailed evidence. The translation's official overview describes its scholarly team and explanatory notes. Lesson: trust improves when the interface explains what information means and where it came from. [Live reader](https://netbible.org/bible/Matthew+1), [Translation overview](https://netbible.com/about/).

## Principles for Jot & Tittle

1. **Preserve the reader's place.** Map, selected passage, history and notes should share a visible reference. Closing detail should restore scope, scroll position and keyboard focus. This is the strongest repeated pattern across Logos, BLB and Sefaria.
2. **Keep the data dense and the decisions clear.** Preserve the continuous canonical verse field. Limit permanent controls to logging, reference navigation and viewing context. Density is useful when it is structured; minimalism is useful when it protects the primary task. Neither is an end in itself.
3. **Capture before configuration.** Put passage entry, default date, destination and save within immediate reach; keep notes optional. The original brief establishes this priority. Scholarly workspaces demonstrate why exposing every capability first would undermine it.
4. **Reveal depth without replacing context.** One selection can expose exact counts, reading dates and personal notes beside or beneath the map on desktop, and in an accessible sheet on mobile. This is a proposed pattern; current modal behavior remains until a separate implementation pass.
5. **Make meaning inspectable.** Explain recency, frequency, combined colors, date scope, journal scope and copy deduplication. Keep sample data, personal observation and imported records distinguishable. Recorded coverage is evidence of logging, not proof of understanding or spiritual merit.
6. **Use restraint to support attention.** Readable type, strong contrast, a neutral surface and semantic map colors should organize the task. Brand headings should be brief for returning users. Persistent promotional, onboarding or motivational interruptions would compete with recording and exploration.

## Consequences for the next design pass

- Make the returning-user map appear sooner; reduce repeated hero copy and decorative chrome.
- Unify the selected reference across map, inspection and history; expose that context consistently.
- Keep Log a reading available, with explicit journal destination and durable input on errors.
- Keep the legend understandable and exact metrics available without hover or color discrimination.
- Favor contextual history and notes over a permanent scholarly toolbar.
- Preserve export/import as ordinary product actions and retain safe recovery.

Do not add a bundled Bible reader, original-language analysis or commentary library just because comparison tools have them. The original product's verse-level visualization is the distinctive task. External passage links could be a separate optional enhancement if later requested.

## Decision test

Before adding a component, ask: does it help the reader record a reading, identify their place, understand the displayed evidence, or inspect relevant history? If it does none of those, its place in the primary workspace is doubtful.

The revised philosophy is a design hypothesis to test with real users, especially frequent returners and people using a phone. Competitive inspection cannot establish user preference or accessibility conformance.
