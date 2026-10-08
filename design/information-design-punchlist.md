# Jot & Tittle information-design consensus

Final proposal: the v3 text preserved below. All four requested personas explicitly APPROVE the complete exact v3, all eight independently committable items and its verification contract. The user’s four-persona gate is satisfied; implementation may proceed within the approved presentation/copy scope. No app files were edited in this synthesis.

## Final signoffs

- Information architect: APPROVE v3, [final approval record](information-design-review.md#final-v3-sign-offs). No further changes requested; verifies archive-first recovery and global-history distinctions.
- Marketing director: APPROVE v3 exactly, [final approval record](information-design-review.md#final-v3-sign-offs). All eight items and verification contract approved; no scope expansion.
- Copywriter: APPROVE v3 in full, [final approval record](information-design-review.md#final-v3-sign-offs). Supersedes v2 approval; precise archive visibility wording approved.
- Social media marketer: APPROVE v3 in full, [final approval record](information-design-review.md#final-v3-sign-offs). No additional copy, feature or approval condition requested.

These approvals cover the exact proposal, not completed implementation, rendered-state verification or measured comprehension gains. Preserve approved behavior boundaries and run the existing verification contract. Later changes to approved copy/state requirements require renewed review by all four; ordinary implementation of those requirements does not reopen ideation.

## v2 → v3 resolution

Marketing and copywriter approved v2; information architect and social media marketer requested the same single correction. Generic empty-state instructions told archive readers to change journals through View readings, but archive inspection cannot switch its journal there. P4 Patterns overview and both P6 Map recent/History empty descriptions now give archive inspection precedence and use the shared exact paragraph: No readings from this archived journal appear in this view. Return to active journal to view your current readings. This remains truthful when stored archive records are excluded by dates and uses the existing return/manage banner. No filtering/navigation behavior or result set changes.

Social’s final feedback confirms that adding !readOnly to true-first-use heading/welcome predicates and readOnly to the existing map-render predicate where required implements already-approved states. It is not a punchlist revision. Verify the empty-archive counterexample even when no readings exist anywhere; archived Map recent emptiness must render its approved recovery and disabled writing actions. Keep these predicates presentation-only.

## Unchanged final eight-item list

The following P1–P8 content is copied verbatim from the approved v3 proposal. This repository copy preserves the canonical approved requirements.

## P1 — Give permanent copy distinct jobs

In main.tsx shell retain wordmark and A MAP OF YOUR READING descriptor. Remove nav-label YOUR SCRIPTURE, MAPPED, the entire decorative sidebar-note (mini-grid, poem and supporting lines), sidebar-bottom Made for attention, not achievement, and footer Every verse leaves a mark. Existing footer data button becomes Your data & backups. Preserve journal picker, navigation, storage status and About entry. Below-map reflection card loses its eyebrow; h3 becomes Explore your reading; body becomes See the books and verses in the journals and dates you’re viewing. Preserve its existing sample/Patterns actions. Place philosophy once in the existing About storage/philosophy section: Made for attention, not achievement. These marks describe the readings you’ve recorded; they don’t measure your faith, effort, or worth. No streaks or spiritual scores. This item does not require other copy changes. Desktop-only slogan removal is a desktop density improvement; mobile gains come from its footer action label.

## P2 — Visible first-use orientation

In the true first-use Map state (no saved readings, no sample, no explore-empty) h1 becomes Your verse map; rendered welcome h2 becomes Start with a passage. Visible .welcome-copy paragraph: Log a chapter, a few verses, or several Bible passages together. Each square represents a verse; color shows when and how often you’ve recorded it. Bible text is not included. Primary CTA stays Log your first reading. EmptyMapDemo caption becomes How recorded readings color the map; small marker becomes Illustration · no readings saved. Preserve animation, Pause/Play, reduced-motion behavior, existing storage/backup footnote below actions and tertiary empty-map action. Leave globally hidden Map subtitle hidden; all new orientation lives in the rendered welcome. Retain current secondary sample action until P3 renames it. No new help panel or introductory paragraph.

## P3 — One name for samples

Across main.tsx, HistoryView, ReadingViewControls and existing detail surfaces, replace Example data/sample data labels with Sample readings in breadcrumb, attribution, viewing summary, detail context and live announcements. Existing Explore sample data actions become Explore sample readings. Existing banner becomes Sample readings · separate from your journals. Keep Return to my readings and capture’s actual Recording journal label/destination. Samples remain viewed synthetic records; saving continues to use the existing real destination. Update existing sample workflow assertions, not storage behavior.

## P4 — Plain counting and Patterns interpretation

In the existing visible map .counting-rule use these exact branches: sample: Verse counts reflect sample readings.; aggregate: Linked records of the same reading count once per verse in this view.; current or archived single journal: Verse counts include each reading saved in this journal. Aggregate is precisely the existing deduplicates condition (!archivedViewId && journalScopeMode !== single && !sample), even when selected mode contains only one journal. Do not infer links from matching dates/passages, and do not change encounter identity or calculations.

Patterns receives presentation-only sample/context props and uses the same three rule branches, followed by Reading sessions count each saved record. Patterns include all books in the journals and dates you’re viewing; book and passage choices on the map do not limit them. In aggregate Patterns only append the compact example: One reading copied into two journals: one count per verse, two saved records when both copies are in this view. This example explains linked-copy behavior without promising automatic duplicate detection; no transfer/import help expansion.

Patterns h2 becomes In this view. Nonempty intro: This view contains [n] reading session(s) across [n] book(s). [n] verse(s) have/has more than one counted reading. Sample prefix: This sample contains. Correct singular/plural forms throughout. True personal emptiness retains Patterns emerge as you record readings. Log a passage, then return here to explore. If zero sessions while personal saved readings exist elsewhere or sample is active, intro becomes No readings in this view. Choose View readings to change journals or dates. Archive inspection takes precedence over every generic empty branch: its zero-session intro becomes No readings from this archived journal appear in this view. Return to active journal to view your current readings. This wording covers both an empty archive and archived readings excluded by dates. Keep the existing archive return/manage banner as the recovery action; no new log action.

Metric helpers: UNIQUE VERSES stays Verses with at least one recorded reading; REVISITED VERSES becomes Verses with more than one counted reading; VERSE READINGS becomes Sum of verse counts in this view. Replace visible canonical order wording with Bible order. Return panel intro: Up to ten verses recorded more than once, ordered by frequency. Ties follow Bible order. Empty return panel: Verses recorded more than once will appear here. Preserve numeric units/accessibility and all stats. Verify linked aggregate copies versus independent identical records and single-journal counts.

## P5 — Describe the alternative presentation accurately

Rename user-facing Text view to Verse list across selector, return label, inspection/map instructions and MetricLegend help. Keep internal component/state names. TextView section accessible name: Verse list; h3: Verse references and reading history. Add short paragraph: References, counts, dates, and your notes. Bible text is not included. Keep existing range/verse total and counting-context paragraph, including zero counts, and current search/paging/inspect behavior. Existing noted-reading action label becomes Readings with notes for [reference]; zero-search announcement becomes Search includes verses with no recorded readings.

Existing map footer instruction becomes presentation-specific. Color map: Each square is a verse. Select a square to inspect its reference, counts, and dates. Verse list: Select a verse to inspect its counts and dates. Preserve keyboard instructions and precise color key. Make the existing How it works heading button visible at 320px, 390px, tablet and desktop by a wrapping heading layout; no new help surface or changed handler. Do not expose the hidden Map subtitle. No duplicate square instruction in first-use welcome state. This commit works independently of P8; it updates old and new user-facing Text view labels wherever present.

## P6 — Empty results explain the current view

Use a global saved-history fact (allReadings.length > 0), sample and readOnly only to choose presentation wording. Current History hasReadings={!!readings.length} is scoped and mislabels an empty selected journal/none-selected scope when personal history exists elsewhere; replace its wording input with global-history context and explicit archive context. Do not modify active/readings, filtering, scope or search results.

For the explored/populated/sample Map Last reading fallback use No readings in this view. In .empty-recent, existing personal history anywhere or sample selects No readings in this view. Choose View readings to change journals or dates. Otherwise use Your readings will appear here. Archive inspection overrides both of these branches with the archive wording specified below. Existing recent-log CTA becomes Log a reading in contextual emptiness and Log your first reading for true personal emptiness. In History .large-empty contextual title stays No readings in this view.; description becomes Choose View readings to change journals or dates. True personal empty title/body stay A reading history starts with one passage. / Log a chapter, a few verses, or several passages together. Existing log CTA remains Log a reading, primary only for true personal emptiness and secondary for contextual emptiness. In both History .large-empty and Map .empty-recent, archive inspection takes precedence over every generic empty branch. History retains title No readings in this view.; its paragraph and the Map recent-empty paragraph become No readings from this archived journal appear in this view. Return to active journal to view your current readings. This wording covers both an empty archive and archived readings excluded by dates; it does not imply that the archive contains no saved records. The existing archive banner already provides Return to active journal and Manage archived journal. View readings can change dates during archive inspection but cannot switch the inspected journal; this copy uses the existing return action consistently across all three empty surfaces. Disable these existing recent/history log buttons during readOnly inspection to reflect the existing openLog write guard, without adding a new write action. Sample capture availability remains unchanged.

Search-only empty state and Clear search action remain unchanged. Do not mention Reset view in empty copy or introduce a reset handler: the existing control is conditional and does not leave sample/archive mode. Pluralize History session heading. Receipts must cover first use, explore-empty, selected-empty journal with records elsewhere, none selected, excluded period, sample period with zero, empty archive and search mismatch.

## P7 — Data page names tasks and preserves limits

Your data page intro becomes Back up, restore, and manage readings saved in this browser. Banner heading Saved in this browser; body Your history stays in this browser on this device. There’s no account, cloud sync, or tracking of your reading. The intro is phone-hidden today; the banner carries the visible storage boundary at all sizes.

Export h2: Back up all journals. Preserve export-status live region and its initiated-download/unexported-change semantics. Scope paragraph: Download all [n] reading(s) across [n] journal(s), with dates, passages, and notes. Includes empty and archived journals. View filters do not limit the backup. Trash is excluded; restore deleted readings before exporting. CTA remains Export all journals. Visible caveat immediately below: Downloading does not confirm the file was saved. Check your Downloads and keep a copy somewhere safe. Browser storage can be cleared or removed. Pluralize actual readings/journals; no guaranteed-save claim.

Import h2: Import a backup; body Choose a Jot & Tittle JSON backup, then review the journals and readings before adding them. Older backups are imported into Journal. Keep Choose a JSON file, JSON validation, preview/merge and existing destination explanation. Avoid adding an absolute unchanged-data promise beyond existing merge semantics. Technical release link becomes App releases & downloads inside the existing technical section, retaining source-versus-built-app explanations. Align current README references to these renamed destinations only. No broader documentation/landing rewrite.

## P8 — Correct and translate help at the decision

Capture helper: Enter a verse, chapter, or range. Separate passages with semicolons. Preserve placeholder, advanced examples disclosure and syntax, normalized preview, date/destination/notes/validation. No parser change or unverified new grammar example.

Opened Map display dialog adds the compact explanation Combined shows when and how often a verse was recorded. Recency shows when; Frequency shows how often. Flow fits the available width. Fixed keeps 160 columns and may scroll. Preserve existing cell-size/browser-zoom explanation, labels/settings and geometry.

Existing About Three ways to look body becomes Combined uses brown-to-green color for when a verse was last recorded and pale-to-dark intensity for how often. Recency and Frequency show each separately. In Recency and Combined, gray means no qualifying record or date in this view; future recorded dates may be gray despite a nonzero count. In Frequency, gray means no records in this view. Inspect for exact counts and dates. Use Verse list for references, counts, dates, and Inspect actions without relying on color. If P5 has not landed, use current Text view label until its rename; this is an integration label adjustment, not a dependency. Preserve precise existing color key, hover/arrow-key instructions and accessibility.

About Separate journals paragraph becomes Keep different reading contexts in separate journals. View one journal or combine journals with View readings; choose where to save in the reading form. Preserve useful Journal/Sermons/Small Group/Memorization examples. About storage becomes Readings stay in this browser on this device. Export and import backups from Your data. Preserve name origin, version, open-source fact, no-Bible-text note, and philosophy from P1 if already landed. Use Bible order in About's existing order sentence. Keep existing structure; no dispatch-hub redesign.

## Verification and scope remain unchanged

Apply the complete Verification contract and approval ledger in /private/tmp/jot-punchlist-v3.md as approved, with this consensus superseding its historical PENDING markers. Preserve parser, data/counting, journal/filter selections, handlers/navigation, map geometry, import/export and offline behavior. Planned screenshot receipts are not completed evidence. No further ideation or app edits occurred in this consensus step.

## Completed implementation

All eight items implemented in eight separate commits on `codex/information-design`, after every persona explicitly approved v3. See [Review and verification](information-design-review.md) for initial opinions, ADHD scoring, review rounds, commits and observed evidence. This approval record describes the pre-implementation gate; the earlier synthesis statement about no app edits is historical.
