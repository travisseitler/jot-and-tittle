# Original product specification — retrieved excerpt

Source: “Bible Metrics Dashboard Design”, chat `6ac292c0-8168-83ea-98f9-2d9fed57ece8`, turn `e47d6ca6-f113-4c39-ab12-d46ddd372b94`. Retrieved 2026-10-08.

The chat reader limits each message to 20,000 characters. This is a truncated historical reference, not the complete specification. Current shipped behavior and later user decisions supersede early MVP suggestions.

Below is a full product and architecture spec you can treat as the initial project document. I’ve tried to keep it concrete enough to guide implementation, while leaving room where the design still genuinely needs experimentation.

:::writing{variant="document" id="48317" title="Jot & Tittle — Product and Architecture Specification"}

# Jot & Tittle

## Product and Architecture Specification

**Working title:** Jot & Tittle  
**Project type:** Free and open-source web application  
**Primary platform:** Modern web browsers  
**Deployment model:** Local-first, with optional hosted and multi-user deployment  
**Primary stack:** TypeScript, React, Vite  
**Visualization stack:** Canvas and/or SVG depending on scope and interaction requirements  
**Core purpose:** Verse-level visualization and analysis of Bible reading history

---

# 1. Product Summary

Jot & Tittle is a local-first, open-source Bible reading analytics application.

Users record passages of Scripture they have read. The application maps those reading events down to the individual verse level and visualizes the entire Bible as a dense field of small cells, with one cell representing one verse.

The primary visualization is analogous to a GitHub contribution graph in visual language: individual verses appear as small dots or squares whose intensity reflects a selected metric such as reading recency or reading frequency.

The application is intended to help users see patterns that are difficult to notice from memory alone, including:

- passages they revisit frequently,
- passages they have not read recently,
- areas of Scripture they rarely visit,
- concentrations in particular books or sections,
- long-unvisited contiguous passages,
- changes in reading behavior over time.

The application should remain descriptive rather than prescriptive.

Its purpose is to show the user what their reading behavior actually looks like, not to assign a spiritual score, create guilt around unread passages, or convert Bible reading into a streak-maintenance system.

A concise product description is:

> **A verse-level map of your Bible reading.**

---

# 2. Name and Identity

The working product name is:

# Jot & Tittle

The name references Matthew 5:18 and the idea of Scripture being preserved even down to its smallest written elements.

The name also aligns conceptually with the application's visualization model: thousands of individually small marks combine to form a map of the whole Bible.

Repository and package naming should use:

```text
jot-and-tittle
```

Suggested descriptive metadata:

```text
Jot & Tittle — Bible Reading Analytics
```

Potential short product descriptions include:

> A verse-level map of your Bible reading.

or:

> See where you've been in Scripture.

A possible tagline is:

> Every verse leaves a mark.

The project should avoid generic Christian-app visual conventions unless they serve a clear functional purpose. The visual identity should emphasize marks, grids, type, and mapped structure more than common imagery such as open Bibles, flames, or crosses.

---

# 3. Product Principles

Jot & Tittle should be guided by several product-level principles.

## 3.1 Verse-level fidelity

Every verse is independently addressable and independently visualizable.

A reading of:

```text
Romans 8:1–17
```

must be understood internally as interaction with each individual verse in that range.

The application should never treat the entered reference merely as an opaque string.

---

## 3.2 Data before hierarchy

The default whole-Bible view should foreground reading data rather than book and chapter structure.

Book names, chapter numbers, and boundaries should not dominate the visualization.

The user should initially see a field of verse cells.

Biblical structure should appear interactively when needed.

---

## 3.3 Structure on demand

Book and chapter metadata remain important, but they should generally appear through:

- hover,
- selection,
- zoom,
- filtering,
- search,
- navigation controls.

The visualization should follow the principle:

> Structure appears when the user asks for it. Data remains visible by default.

---

## 3.4 Local-first ownership

A user should be able to run and use Jot & Tittle without:

- registering an account,
- connecting to a remote service,
- sending reading history to a server,
- maintaining an internet connection.

The user's reading history belongs to the user.

Import and export should therefore be first-class capabilities rather than emergency backup features.

---

## 3.5 Descriptive rather than normative

The application may report:

```text
You last read Obadiah 713 days ago.
```

It should avoid language such as:

```text
You are neglecting Obadiah.
```

The product should reveal behavior without assigning spiritual merit.

---

## 3.6 Fast capture

Logging a reading should require very little effort.

If recording a reading is cumbersome, the quality of the dataset will deteriorate.

Passage-entry UX is therefore a core feature, not administrative plumbing.

---

## 3.7 Stable data model, flexible visualization

The underlying Scripture model should remain independent from any particular visualization.

The UI should be able to evolve from squares to dots, Canvas to SVG, different grid layouts, new metrics, or alternative views without requiring the reading-history model to change.

---

# 4. Primary User Stories

## 4.1 Logging a reading

As a user, I want to enter:

```text
Romans 8
```

and have Jot & Tittle interpret it as the entire chapter.

I should also be able to enter:

```text
Romans 8:1-17
Rom 8:1-17
Romans 8:28
Romans 8:28-9:5
Matthew 5-7
Genesis 1-3
1 Corinthians 12-14
Psalm 23; John 10:1-18
```

The application should normalize each entry into canonical verse ranges.

---

## 4.2 Seeing my entire reading map

As a user, I want to open the application and see every verse in the Bible represented by one cell.

The cell's visual state should tell me something about my reading history.

No book or chapter labels need to be visible by default.

---

## 4.3 Discovering where a verse belongs

As a user, when I hover over a verse cell, I want to see its exact reference.

I also want all cells belonging to the same book to become visually identifiable, with the book name shown temporarily.

---

## 4.4 Zooming into Scripture

As a user, I want to inspect:

- the whole Bible,
- one book,
- several chapters,
- a single chapter,
- an arbitrary cross-chapter passage,
- one verse.

---

## 4.5 Comparing recency

As a user, I want to see which verses I have read recently and which I have not visited for a long time.

---

## 4.6 Comparing frequency

As a user, I want to see which verses I repeatedly return to.

---

## 4.7 Preserving my data

As a user, I want to export all of my reading history in an understandable format so that the application never becomes the sole owner of my data.

---

# 5. Scripture Model

The Scripture model is the foundation of the project.

It must be designed independently from reading history and presentation.

---

# 5.1 Canonical verse sequence

Every verse should have a monotonically increasing sequence value.

Conceptually:

```text
1       Genesis 1:1
2       Genesis 1:2
3       Genesis 1:3
...
31102   Revelation 22:21
```

Exact counts depend on versification and should not be globally hard-coded into the architecture.

The sequence value should provide a canonical sortable order across the entire supported Bible.

---

# 5.2 Verse identity

Each verse should have both:

- a stable database identifier,
- a stable textual Scripture identifier.

Example:

```ts
interface Verse {
  id: number;
  osisId: string;
  bookId: string;
  chapter: number;
  verse: number;
  sequence: number;
  versificationId: string;
}
```

Example record:

```json
{
  "id": 23146,
  "osisId": "Rom.8.28",
  "bookId": "ROM",
  "chapter": 8,
  "verse": 28,
  "sequence": 23146,
  "versificationId": "protestant-en"
}
```

The specific identifier standard may change, but references should use a recognizable normalized form rather than inventing a proprietary syntax unnecessarily.

---

# 5.3 Passage ranges

A passage is fundamentally an inclusive ordered range of verses.

```ts
interface PassageRange {
  startVerseId: number;
  endVerseId: number;
}
```

or, when using canonical sequence values:

```ts
interface SequenceRange {
  startSequence: number;
  endSequence: number;
}
```

This allows all of the following to use the same underlying abstraction:

```text
Romans
Romans 8
Romans 8:1-17
Romans 8:28-9:5
Matthew 5-7
Genesis 1:1-Revelation 22:21
```

Books and chapters are therefore metadata over ordered verse ranges, not special containers required by the visualization layer.

---

# 5.4 Canon and versification

Version 1 may intentionally support one canon and one versification system.

Recommended MVP scope:

```text
66-book Protestant canon
Common modern English verse numbering
```

However, the database architecture should not assume this is the only possible system.

Future support may include:

- Catholic canon,
- Orthodox canons,
- Hebrew ordering,
- Septuagint-based systems,
- alternate verse numbering.

Conceptually:

```ts
interface Canon {
  id: string;
  name: string;
}

interface Versification {
  id: string;
  name: string;
  canonId: string;
}
```

Scripture identity must always be interpretable within a known versification.

---

# 6. Reading Domain

Reading history should be modeled as events.

---

# 6.1 Reading event

A reading event represents one occasion on which the user read Scripture.

```ts
interface ReadingEvent {
  id: string;
  userId: string;
  startedAt: string;
  endedAt?: string;
  createdAt: string;
  updatedAt: string;
  notes?: string;
}
```

A reading event may contain one or more passage ranges.

Example:

```text
October 4, 2026

Romans 8:1–17
Psalm 23
John 15:1–11
```

These should be treated as one reading session with multiple ranges rather than three unrelated events when the user entered them together.

---

# 6.2 Reading event ranges

```ts
interface ReadingEventRange {
  id: string;
  readingEventId: string;
  startVerseId: number;
  endVerseId: number;
}
```

A range must always resolve to canonical verse IDs.

Original user input may also be preserved for auditability and import/export convenience.

---

# 6.3 Denormalized verse interactions

The application may optionally maintain a derived table mapping each reading event to each individual verse.

Conceptually:

```text
reading_event_verses
--------------------
reading_event_id
verse_id
```

This table may simplify analytics at the cost of additional storage.

Since Bible reading datasets are relatively small, explicit verse-event expansion is likely acceptable.

Example:

```text
Romans 8:1–17
```

becomes seventeen derived verse interaction records.

The application should treat this table as derived data that could be regenerated from reading ranges.

---

# 7. Database Model

A possible schema is:

```text
users
-----
id
name
created_at
updated_at


canons
------
id
name


versifications
--------------
id
canon_id
name


books
-----
id
versification_id
osis_id
name
canonical_order
first_sequence
last_sequence


verses
------
id
versification_id
book_id
chapter
verse
sequence
osis_id


reading_events
--------------
id
user_id
started_at
ended_at
created_at
updated_at
notes
original_input


reading_event_ranges
--------------------
id
reading_event_id
start_verse_id
end_verse_id


reading_event_verses
--------------------
reading_event_id
verse_id
```

Additional derived statistics should not initially be treated as authoritative data.

They may be calculated dynamically or cached.

---

# 8. Derived Verse Statistics

The analytics layer should be able to produce statistics per verse.

```ts
interface VerseStats {
  verseId: number;
  readCount: number;
  firstReadAt: string | null;
  lastReadAt: string | null;
}
```

Future fields may include:

```ts
interface ExtendedVerseStats extends VerseStats {
  readsLast7Days: number;
  readsLast30Days: number;
  readsLast365Days: number;
  daysSinceLastRead: number | null;
  averageGapDays: number | null;
  longestGapDays: number | null;
}
```

These statistics should be derived from reading events rather than manually maintained as primary records.

---

# 9. Visualization Model

The primary visualization is a dense field containing one visual cell per verse.

A cell may be rendered as:

- a square,
- a rounded square,
- a dot,
- another very small repeated mark.

The initial implementation should probably use square cells because GitHub-style stepped intensity is already legible in that form.

---

# 9.1 Primary layout: Continuous Flow

The default layout is a completely continuous canonical sequence.

Verses appear in canonical order and wrap according to the available viewport width.

Conceptually:

```text
Genesis 1:1
Genesis 1:2
...
Genesis 50:26
Exodus 1:1
...
Revelation 22:21
```

becomes:

```text
□□□□□□□□□□□□□□□□□□□□□□□□□□□□□□□□□□□□
□□□□□□□□□□□□□□□□□□□□□□□□□□□□□□□□□□□□
□□□□□□□□□□□□□□□□□□□□□□□□□□□□□□□□□□□□
□□□□□□□□□□□□□□□□□□□□□□□□□□□□□□□□□□□□
```

No automatic line break is introduced for:

- chapter boundaries,
- book boundaries,
- testament boundaries.

The layout should treat the Bible as one continuous sequence.

The number of columns may change responsively.

The spatial coordinate of a given verse is therefore viewport-dependent in this mode.

This is acceptable and intentional.

---

# 9.2 Secondary layout: Fixed Canonical Grid

The secondary layout uses a stable fixed column count.

Example:

```ts
const FIXED_GRID_COLUMNS = 160;
```

The exact value should be determined through UI experimentation.

Verse position is deterministic:

```ts
function getFixedPosition(sequence: number) {
  const index = sequence - 1;

  return {
    column: index % FIXED_GRID_COLUMNS,
    row: Math.floor(index / FIXED_GRID_COLUMNS),
  };
}
```

In this mode, every verse occupies a stable spatial coordinate.

This produces a persistent visual geography.

The user may gradually learn approximate locations for major sections of Scripture without permanent labels.

The fixed grid may later support pan-and-zoom behavior similar to navigating a map.

---

# 9.3 Layout names

Internal names:

```ts
type BibleLayoutMode = "continuous" | "fixed-grid";
```

User-facing names should be tested.

Possible labels:

```text
Flow
Map
```

or:

```text
Responsive
Fixed
```

The implementation should not assume the internal terminology is final UX copy.

---

# 10. Metric Rendering

Each verse cell's appearance should be determined independently from its position.

A metric converts a verse statistic into a visual intensity bucket.

---

# 10.1 Recency metric

Example conceptual buckets:

```text
never read
more than one year ago
three to twelve months ago
one to three months ago
within the last month
within the last week
today
```

The exact number of buckets should be tuned for readability.

---

# 10.2 Frequency metric

Example conceptual buckets:

```text
0 readings
1 reading
2–4 readings
5–9 readings
10–24 readings
25+ readings
```

Thresholds should eventually be configurable or data-adaptive.

---

# 10.3 Combined metrics

Future metrics may include:

- recent and frequent,
- historically frequent but currently dormant,
- recently visited but historically rare,
- concentration over a selected time window.

Combined metrics should not be introduced into the MVP unless they remain immediately legible.

The product should prefer understandable views over dense multidimensional encoding.

---

# 10.4 Palette

The visual language may begin with a GitHub-like gray-to-green stepped scale.

However, metric semantics should not depend on green specifically.

Future support may include:

- alternate palettes,
- high-contrast palettes,
- colorblind-accessible palettes,
- dark mode variants.

The metric system should produce abstract intensity levels.

The renderer should map intensity levels to actual display colors.

---

# 11. Hover and Focus Behavior

The whole-Bible view contains no permanent book or chapter labels.

Metadata is revealed interactively.

---

# 11.1 Verse hover

Hovering a cell should identify the verse.

Minimum tooltip:

```text
Romans 8:28
```

Expanded tooltip may include:

```text
Romans 8:28

Times read: 17
Last read: Sep 22, 2026
First logged: Jan 14, 2025
```

Potential additional context:

```text
Romans 8 coverage: 94%
Romans coverage: 81%
```

These aggregated values should only be included if they remain useful rather than cluttered.

---

# 11.2 Book hover highlight

When a verse is hovered, all cells belonging to the same book should receive a temporary visual treatment.

The book name should also appear.

The treatment must preserve the active heatmap metric.

Therefore the interaction should not simply recolor every book cell to one identical highlight color.

Possible treatments include:

- decreasing opacity of cells outside the hovered book,
- adding an outline or glow to cells in the hovered book,
- applying a translucent overlay,
- emphasizing book cells while muting the rest of the grid.

The user should still be able to perceive the underlying recency or frequency values.

---

# 11.3 Chapter highlighting

Chapter-level highlighting may be offered as a secondary interaction.

Possible triggers include:

- keyboard modifier,
- dwell,
- tooltip interaction,
- alternate hover mode,
- selection state.

It should not make the default hover interaction visually noisy.

---

# 12. Selection and Navigation

The visualization must support arbitrary verse scopes.

Selections should fundamentally be modeled as canonical ranges.

```ts
interface ScriptureSelection {
  startSequence: number;
  endSequence: number;
}
```

Examples:

```text
Genesis
Romans
Romans 5–8
Romans 8
Romans 8:28–9:5
Romans 8:28
```

All of these can resolve to a start and end sequence.

---

# 12.1 Navigation levels

The application should support navigating among:

- whole Bible,
- book,
- chapter range,
- chapter,
- verse range,
- verse.

These do not need separate internal models.

They are different ways of constructing a Scripture selection.

---

# 12.2 Range selection

Future interaction may support direct range creation using:

- click and drag,
- Shift-click,
- keyboard navigation,
- text reference entry.

The application should not commit to a specific mouse gesture until usability testing.

Touch behavior must be considered separately.

---

# 12.3 Zoom

In fixed-grid mode, zoom may eventually behave spatially.

Rather than rendering an unrelated page for Romans, the application may pan and zoom toward the region containing Romans.

Continuous mode may instead reflow the selected range within the available viewport.

The exact visual behavior may differ between layout modes while using the same underlying selection state.

---

# 13. Passage Parsing

Passage parsing is a core domain capability.

The parser should accept common forms of English Bible references and resolve them into canonical verse ranges.

Examples:

```text
Romans 8
Rom 8
Romans 8:1-17
Rom. 8:1–17
Romans 8:28
Romans 8:28-9:5
Matthew 5-7
Genesis 1-3
1 Cor 12-14
Psalm 23; John 10:1-18
```

The parser must handle:

- abbreviated book names,
- optional punctuation,
- en dash or hyphen,
- chapter-only references,
- verse-only ranges within a chapter,
- cross-chapter ranges,
- multiple passages in one entry.

The parser should return explicit normalized ranges.

Example:

```ts
interface ParsedReference {
  original: string;
  ranges: PassageRange[];
}
```

Parsing errors should identify the ambiguous or invalid portion rather than rejecting the entire input without explanation.

---

# 14. Logging UX

The minimum capture flow should look roughly like:

```text
Add reading

[ Romans 8:1-17                     ]

Recognized:
Romans 8:1–17

[ Log reading ]
```

Multiple passages:

```text
[ Psalm 23;

[Retrieved text ends here; original response continues.]

```
