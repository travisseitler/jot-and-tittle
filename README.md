# Jot & Tittle

A local-first, verse-level map of your Bible reading. Version 0.2.

## Run locally

Requires Node.js 22 or later, npm, and Python 3 (used only to bundle the downloadable source).

```sh
npm install
npm run dev
```

Open the localhost URL printed by Vite. No account, database server, API keys, or Bible-text service is needed.

```sh
npm test
npm run build
npx vite preview
```

Host the contents of `dist/` on any static web host, or serve that directory locally. Use HTTPS or localhost for service-worker offline support. After the first full load, the app shell works offline. Offline support is active in production builds, not Vite development mode.

## Included

- Full 66-book Protestant canon, 31,102 KJV-numbered verses; metadata only, no Bible text.
- Validated book/chapter/verse ranges, abbreviations, cross-chapter and cross-book ranges, multiple semicolon-separated ranges. Overlaps count once per session.
- Independent journals for one local user: Journal by default, with create, rename, switch, and last-selected-journal persistence. Each journal has its own map, statistics, history, and journal-local reset.
- Date-stamped readings with notes; IndexedDB persistence and atomic edits/deletions. Existing v1 readings migrate into Journal.
- Canvas continuous flow and a stable 160-column canonical grid; scroll and cell-size zoom; exact hover/tap details and book highlighting.
- Book, chapter, and arbitrary continuous passage scope; combined, recency, and frequency metrics.
- Keyboard map navigation, semantic summaries, dialog focus trapping, and responsive layouts.
- Reading history, search, book statistics, most frequently revisited verses.
- Explicitly separated read-only sample dataset; personal history starts empty.
- Validated, merge-preview JSON import, JSON export, local reset, source download.

## Architecture

`src/domain.ts` contains Scripture identity, parser, normalized ranges, derived statistics, metric buckets, and interchange validation. Verse indices are zero-based internally; exported identities are OSIS strings. Canon and versification are data identities, not implicit row counts. `src/journals.ts` defines journal ownership, names, backwards-compatible interchange, and merge planning. `src/storage.ts` defines the repository boundary and IndexedDB schema version 2; migration creates Journal and assigns existing readings to it in the upgrade transaction. Journal, reading, and selected-journal changes are committed atomically. `src/Heatmap.tsx` uses a base canvas and separate hover overlay; coordinate hit testing is mathematical. `src/main.tsx` contains the application workflows. Metadata is `src/canon.json`; cell styling is independent of readings.

Each session stores UUID, date, original input, notes, creation/update timestamps, and merged inclusive verse ranges. Statistics are rebuilt from authoritative sessions. Book/chapter boundaries do not add spacing to the heatmap. Fixed-grid scopes retain canonical column positions. The default Combined view independently encodes recency as brown-to-green hue and frequency as pale-to-dark lightness, with an expandable two-dimensional legend. Recency and Frequency remain second and third views. Unrecorded verses stay neutral gray. Recency bins: never, over a year, 3–12 months, 1–3 months, 7–30 days, 1–7 days, today for date-only readings, under 24 hours for known times. Frequency bins: 0, 1, 2–4, 5–9, 10–24, 25–49, 50+.

## Data portability

Exports are JSON with `format: "jot-and-tittle"`, `version: 3`, `versification: "protestant-en"`, an export timestamp, a `journals` array, and a `readings` array. Journal records contain UUID, name, creation/update timestamps; the default journal has stable ID `journal-default`. Each reading contains `id`, `journalId`, `startedAt`, `datePrecision`, optional `legacyStartedAt`, `createdAt`, `updatedAt`, `originalInput`, `notes`, and `ranges: [{start: "Rom.8.1", end: "Rom.8.17"}]`. Empty journals are exported too. Export covers every journal; clear/reset applies only to the selected journal.

The Your data backup area records when the most recent personal-data download was initiated and compares current journals and readings with the actual database snapshot used for that export. This metadata persists in IndexedDB and updates across tabs. Changes during or after export remain unexported; failed generation or download initiation does not advance status. Initiating a download cannot confirm that the file was saved. Source-code downloads do not back up personal data. Deleted readings held temporarily for Undo are excluded, matching the export policy described below.

Import validates format/version, supported versification, dates, references, reading and journal ID uniqueness, journal names, journal ownership, and range order. The importer accepts v1 and v2 backups and assigns their readings to the default Journal. Merge preserves existing IDs and adds new IDs; it never overwrites an existing reading or moves it into another journal. New journal IDs with colliding names receive an “imported” suffix rather than combining their histories. A preview describes additions and duplicate readings before committing. Database and export versions are separate contracts. Selection is a local preference and is not exported.

## Privacy and limits

Reading history stays in the browser and is never sent to the host. No telemetry, fonts from third-party services, account system, cloud sync, or licensed text is included. The hosted app itself can be private while the downloadable source runs without sign-in. Each browser/origin has independent data. Browser storage may be evicted or cleared; export backups. Hosted multi-user data and synchronization are intentionally outside this MVP. Native pinch zoom and drag panning are not implemented; scrolling and explicit cell zoom are available.

Automated unit tests validate canonical order, range parsing, overlap semantics, analytics after edits/deletion, combined colors, journal isolation, journal names, v1/v2 JSON round trips, import collisions, and IndexedDB repository workflows using fake-indexeddb. The Playwright browser suite covers real storage migration, reading and journal workflows, export/import/reset, canvas metrics and navigation, mobile touch layouts, concurrent tabs, and production offline use. Run `npx playwright install --with-deps chromium firefox webkit` followed by `npm run test:e2e`. See [CONTRIBUTING.md](CONTRIBUTING.md) for the browser matrix, limitations, and debugging instructions.

## Metadata provenance

Verse counts were extracted from the public-domain KJV dataset in [scrollmapper/bible_databases](https://github.com/scrollmapper/bible_databases), `formats/json/KJV.json`. Only book names and per-chapter verse counts are bundled. Numbered book names are normalized to Arabic numerals. The source contains no translation text.

## License

MIT, chosen for this implementation. See LICENSE. A future change to a copyleft license requires a separate project decision.

Deleting a reading or clearing a journal commits immediately and offers a separate
30-second Undo action for each operation. Undo remains available when navigating
between app views or journals in the same tab. Reloading, closing the tab, or
restarting the browser ends these temporary recovery windows. The interface shows
the remaining seconds and explicitly marks expired opportunities.

Undo restores the exact records actually removed, including IDs, original journal
ownership, reading dates, input, passages, notes, provenance, and both creation and
update timestamps. Recovery does not count as an edit, so timestamps are unchanged.
Readings added afterward are preserved. Restoration is atomic: if an original
journal is gone or any ID has been reused, nothing is restored or overwritten and
the interface explains the problem. Temporary recovery exists only in the deleting
tab; it is not persistent Trash or part of exported backups. A future Trash feature
should use a single shared deletion record for Undo and Trash restoration, consuming
it atomically on either restoration.

### Reading dates

New logs store `datePrecision: "date"` and `startedAt: "YYYY-MM-DD"`. No time is inferred. Known times in v3 imports use `datePrecision: "instant"` and an ISO timestamp with an explicit UTC or numeric offset; import normalizes these instants to UTC. Display, editing, and ordering of known times use the current browser timezone. Editing notes preserves an unchanged instant; changing its calendar date converts it to date-only.

Date-only recency counts calendar days in the current timezone, using calendar arithmetic so daylight-saving days count once. Today is the freshest bucket, followed by 1–6, 7–29, 30–89, 90–364, and 365+ days. Known times use elapsed 24-hour periods with the same boundaries. Mixed readings sort by current local calendar day, with date-only readings preceding known times on the same day; same-date unknown times have equal order. Verse first/last summaries use this same comparison. Future dates cannot be logged or saved; imported future dates are preserved for correction and use the neutral recency color until they occur. Frequency still counts them.

IndexedDB upgrades and v1/v2 imports migrate unmarked legacy timestamps to their UTC calendar date and retain the exact original value as `legacyStartedAt`. UTC is a deterministic fallback, not a reconstruction of the original local date: old exports did not record the entry timezone, and noon was artificial. Open Edit to see the original timestamp and correct the estimated date. Recovery metadata survives edits and exports. New exports use v3; older app versions cannot read them.

Readings can be moved from History to another journal. Same-journal moves are disabled. Moves preserve record identity and content and detect concurrent edits or destination removal.

History offers Copy to another journal. Each copy gets a new record ID and timestamps but preserves its date, passages, input, notes, and durable encounter ID (the original record ID for older readings). Copying a copy preserves that identity. Notes edits and moves preserve it; changing date or passages creates a new encounter. Same-journal copying is disabled. Individual journals count each record; aggregate views count each encounter once per verse.

Manage journals in Your data to archive or restore non-default journals. Archives keep their identity, names, history, and export status. Inspect opens read-only history; restore before logging, editing, deleting, moving, copying, or merging new readings into an existing archive. Archiving the current destination switches to Journal. Older journals are active by default; JSON preserves archive status.
