# Jot & Tittle

A verse-by-verse map of your Bible reading. Version 0.2.

Jot & Tittle helps you see where you have been in Scripture: which passages you
have read, how recently you read them, and which ones you return to most often.
Record a passage, its reading date, and any notes, then explore your reading
history as a map of the Bible.

Your readings stay in the browser on your device. There is no account to create,
and no cloud synchronization to set up.

## Try it in your browser

**[Open Jot & Tittle](https://travisseitler.github.io/jot-and-tittle/app/)** — the
hosted app is available now. You do not need to download anything or install
software. Choose **Explore a sample map** to try it without adding sample readings
to your personal history, or choose **Log a reading** to start your own journal.

For an introduction and usage guide, visit
[the project website](https://travisseitler.github.io/jot-and-tittle/).
Your journals stay in your browser on your device, even when you use the hosted
app. Make regular backups using **Your data → Export all journals**.

## What you can do

- Record whole chapters, individual verses, or several passages in one reading.
  For example: `John 3:16-21; Romans 8`.
- Keep separate journals for different purposes, such as personal reading and
  sermon preparation. Each has its own map, notes, and history.
- Explore the whole Bible or focus on a book, chapter, or passage. Map colors show
  how recently and how often you have read each verse.
- Search your history, edit entries, and see statistics for each book.
- Try a sample map without adding sample readings to your own history.
- Download a backup of all your journals and bring it back into the app later.

The map covers the **66-book Protestant canon**, using **KJV verse numbering**
(31,102 verses). It contains book names and verse counts, but **no Bible text**.
You can read in your preferred translation; references that use different verse
numbering may need adjustment to match the map.

## Optional: run your own copy

The hosted app above is ready to use. Follow the setup below only if you want to
run your own copy on your computer.

Running your own copy involves a one-time setup and two commands. You do not need
to know how to write code. You will need an internet connection for the initial
downloads.

### 1. Install Node.js

[Download Node.js](https://nodejs.org/en/download). Choose the version marked
**LTS** (the version intended for long-term support), then choose the installer
for your operating system and follow its prompts. Jot & Tittle requires Node.js
22 or later.

Node.js lets your computer run the tools that start the app. Its installer also
includes **npm**, a package manager: a tool that downloads the software pieces
this app needs. You do not need to install npm separately.

### 2. Download and unpack the app

If you already have the source-code ZIP file, unzip it. Otherwise, visit the
[Jot & Tittle repository](https://github.com/travisseitler/jot-and-tittle), click
**Code**, then **Download ZIP**, and unzip the downloaded file.

Keep the extracted folder somewhere you can find again, such as Documents. Open
it and locate `package.json`. That file identifies the app's main folder. If you
see another folder inside the first one, open that folder to find it.

You do not need Git or a GitHub account for this download.

### 3. Open a terminal in that folder

A **terminal** is a window where you type commands for your computer. The commands
below belong in that window, not in your browser or in a document.

- **Windows:** Open the folder containing `package.json` in File Explorer.
  Right-click an empty area and choose **Open in Terminal**, if available. You
  can also type `cmd` in File Explorer's address bar and press Enter to open a
  Command Prompt in that folder.
- **macOS:** Open **Terminal** from Applications → Utilities. Type `cd` followed
  by a space, drag the folder containing `package.json` from Finder into the
  Terminal window, then press Return. The `cd` command means “change directory”;
  it tells the terminal which folder to work in.
- **Linux:** Open the folder in your file manager and use **Open in Terminal**,
  if available. Alternatively, open your terminal and use `cd` followed by the
  folder's path, enclosing the path in quotation marks if it contains spaces.

If you installed Node.js while a terminal was already open, close that terminal
and open a new one before continuing.

### 4. Download the app's required software

Copy this command into the terminal and press Enter:

```sh
npm install
```

This downloads the app's dependencies (the software pieces it uses) into a folder
called `node_modules`. It may take a few minutes and print several lines of
messages. Wait until the terminal is ready for another command. You normally
only need to do this once per downloaded copy of the app.

### 5. Start the app

In the same terminal, run:

```sh
npm run dev
```

This starts a small web server on your computer so your browser can open the app.
Leave the terminal window open while you use it.

Look for the address next to **Local:** in the terminal output. It will usually
be `http://localhost:5173/`. Copy that address into your browser's address bar.
**localhost** means your own computer. Use the exact address printed by the
terminal, because the number may differ if another app is using that port.

You should now see Jot & Tittle. Choose **Log a reading**, enter a passage and
date, optionally add notes, and choose **Save reading**. Your personal history
starts empty; **Explore a sample map** lets you try the map first.

### Find your way around

**Log a reading** is always available. Its **Recording in** field tells you which
journal will receive the reading; you can choose a different destination without
changing the readings you are viewing.

- **Verse map:** Choose a book, or open **Go to passage** to focus the map.
  **Map display** holds the color mode, layout, and zoom controls. **Inspect a verse**
  gives exact counts and dates without needing to click a square.
- **Reading history:** Search your entries or open a passage/date to see its details
  and edit it. Open **More actions** for Move, Copy, or Delete.
- **Reading patterns:** Explore where you have been reading and the passages you
  revisit. Expand **Explore all 66 books** for the full breakdown.
- **Your data:** Export all journals, import a backup, or open Trash to recover
  deleted readings. Software downloads and technical information are under About.

On Map, History, and Patterns, **View readings** lets you choose dates and journals.
**Apply view** updates the results; **Cancel** leaves them unchanged. Active filters
remain visible, and **Reset view** returns to your current journal and all dates.
These viewing choices never limit your backup: **Export all journals** includes
all journals and their saved readings.

Open **Manage journals** beside the journal name to create, rename, archive,
restore, clear, or delete a journal. Archived journals can be inspected but must
be restored before their readings can be changed.

### Stopping and returning later

To stop the app, click in the terminal and press **Ctrl+C**. Stopping it does not
delete your saved readings.

Next time, open a terminal in the same app folder, run `npm run dev`, and open the
**Local:** address again. You do not need to repeat `npm install` each time.
Use the same browser and the same address to return to your existing history.

### If something goes wrong

- **“npm” is not recognized, or “command not found”:** Install Node.js using its
  installer, then close and reopen your terminal. Run `node --version` and
  `npm --version`; both should print version numbers. The Node.js number should
  begin with `v22` or a higher major version.
- **An error mentions a missing `package.json`:** The terminal is in the wrong
  folder. Return to step 3 and open it in the folder containing that file.
- **PowerShell says scripts are disabled:** Use the Command Prompt method in
  step 3, then run the same commands there.
- **The browser cannot open the app:** Check that `npm run dev` is still running,
  and copy the full **Local:** address from the terminal.
- **Your history appears empty:** Check that you are using the same browser and
  address as before, and that the intended journal is selected. A different
  browser, address, or port has separate storage. If you have a backup, you can
  import it using **Your data**.

If you ask someone for help with setup, share the command you ran and the error
message printed in the terminal.

## Keeping your readings safe

The app saves your readings automatically in your browser's storage. They are
not sent to the website host. There is no telemetry (tracking of your app use),
cloud sync, or connection to a Bible-text service.

**Make regular backups**, especially before clearing browser data, changing
computers, or switching to a different copy of the app:

1. Open **Your data** and choose **Export all journals**.
2. Check your Downloads folder for the saved file and keep a copy somewhere safe.
   The app can tell you that a download started, but cannot confirm that you saved
   the file.
3. To restore or transfer readings, open **Your data** in the destination copy,
   choose **Choose a JSON file**, and select your backup. Review the preview before
   confirming the import.

**JSON** is the file format used for backups. You do not need to open or edit the
file yourself. A backup includes all journals, reading dates, passages, and notes,
including empty journals. Import adds new records and skips readings already
present; it does not overwrite existing readings.

To move from the hosted app to a local copy (or back again), export all journals
in the copy you have been using. Open the other copy, go to **Your data**, choose
**Choose a JSON file**, and import that backup. Check that your journals and
readings appear there. The two copies keep separate histories after the transfer;
later changes do not synchronize automatically.

Each browser and web address keeps its own reading history. Changing from
`localhost` to a hosted website, or even changing the port number in the address,
opens a separate reading space. Browser data can also be cleared or removed by
the browser. Private browsing is unsuitable for keeping a lasting reading history.

**Download source code** opens the
[latest GitHub release](https://github.com/travisseitler/jot-and-tittle/releases/latest),
where you can download the app's program files once the first release is published.
These files do not include your personal readings. Use **Export all journals**
to back up your data.

Deleting a reading or clearing a journal offers **Undo** for 30 seconds. Clearing
a journal affects only the selected journal. Undo works while you move between
views or journals in the same tab, but reloading or closing the tab ends the
recovery window. Export a backup before clearing readings you want to keep.

## Optional: offline use and hosting

For a ready-to-host copy, download **jot-and-tittle-build.zip** from the
[latest release](https://github.com/travisseitler/jot-and-tittle/releases/latest)
once a release is published. Extract it into any folder on your static web host.
Its assets and offline worker use relative URLs; no particular folder name is
required. Use HTTPS, or a local web server for testing.

The release's **Source code (zip)** and **jot-and-tittle-source.zip** contain the
uncompiled program. Their `index.html` cannot run directly on a static server;
follow the setup and build instructions below instead. Neither archive contains
your personal readings.

The `npm run dev` setup above is the simplest way to start using the app locally.
Automatic offline support is available in the production build described below.
A **build** prepares the app's files for use outside the development tools.

Building also requires [Python 3](https://www.python.org/downloads/), used only to
bundle the downloadable source-code ZIP. The build command expects Python to be
available as `python3`; check this with `python3 --version` before building.
Python is not needed for the `npm run dev` setup above.

From the app folder, run these commands one at a time:

```sh
npm run build
```

```sh
npx vite preview --port 4173 --strictPort
```

The first command creates a `dist` folder with the prepared app. The second
starts a local preview; `npx` runs the Vite tool installed with this project. Open
the **Local:** address it prints and let the app load fully. Leave the terminal
open for the preview. To return later, run the preview command again.

The production app can load offline after its first complete load at that
address. Offline support uses a browser feature called a **service worker** and
requires `localhost` or a website served over HTTPS. It is not active in
`npm run dev` mode. A new address still needs its own first complete load.

The preview address is different from the usual development address, so export
and import your journals if you want to move your readings between them.

If you want to put the app on a website, upload the contents of `dist/` to a static
web host (a service that serves these prepared files). Use HTTPS for offline
support. Reading history remains in each visitor's browser; hosting does not add
shared journals or synchronization. Double-clicking `index.html` is not the
supported way to run the app.

## For contributors and programmers

See [CONTRIBUTING.md](CONTRIBUTING.md) for development guidelines, browser testing,
and debugging instructions. After `npm install`, run the unit tests with:

```sh
npm test
```

The unit suite covers passage parsing, statistics, journal isolation, imports,
and browser-storage workflows. The Playwright browser suite covers reading and
journal workflows, migration, export/import/reset, map navigation, touch layouts,
concurrent tabs, and production offline use. Its setup and browser limitations
are documented in the contributing guide.

The app supports keyboard map navigation, accessible summaries, and responsive
layouts. Scrolling and explicit cell-size zoom are available; native pinch zoom
and drag panning are not implemented.

<details>
<summary>Technical reference: architecture, backup format, reading dates, and Undo</summary>

### Architecture

The website source lives in `site/`. The Pages workflow builds the website and
current app together on each push to `main`, publishing the app under `/app/`.
See [the website README](site/README.md) for preview and publishing instructions.

`src/domain.ts` contains Scripture identity, parser, normalized ranges, derived statistics, metric buckets, and interchange validation. Verse indices are zero-based internally; exported identities are OSIS strings. Canon and versification are data identities, not implicit row counts. `src/journals.ts` defines journal ownership, names, backwards-compatible interchange, and merge planning. `src/storage.ts` defines the repository boundary and IndexedDB schema version 3; migration creates Journal and assigns existing readings to it in the upgrade transaction. Journal, reading, and selected-journal changes are committed atomically. `src/Heatmap.tsx` uses a base canvas and separate hover overlay; coordinate hit testing is mathematical. `src/main.tsx` contains the application workflows. Metadata is `src/canon.json`; cell styling is independent of readings.

Each session stores UUID, date, original input, notes, creation/update timestamps, and merged inclusive verse ranges. Statistics are rebuilt from authoritative sessions. Book/chapter boundaries do not add spacing to the heatmap. Fixed-grid scopes retain canonical column positions. The default Combined view independently encodes recency as brown-to-green hue and frequency as pale-to-dark lightness, with an expandable two-dimensional legend. Recency and Frequency remain second and third views. Unrecorded verses stay neutral gray. Recency bins: never, over a year, 3–12 months, 1–3 months, 7–30 days, 1–7 days, today for date-only readings, under 24 hours for known times. Frequency bins: 0, 1, 2–4, 5–9, 10–24, 25–49, 50+.

### Backup format and import behavior

Exports are JSON with `format: "jot-and-tittle"`, `version: 3`, `versification: "protestant-en"`, an export timestamp, a `journals` array, and a `readings` array. Journal records contain UUID, name, creation/update timestamps; the default journal has stable ID `journal-default`. Each reading contains `id`, `journalId`, `startedAt`, `datePrecision`, optional `legacyStartedAt`, `createdAt`, `updatedAt`, `originalInput`, `notes`, and `ranges: [{start: "Rom.8.1", end: "Rom.8.17"}]`. Empty journals are exported too. Export covers every journal; clear/reset applies only to the selected journal.

The Your data backup area records when the most recent personal-data download was initiated and compares current journals and readings with the actual database snapshot used for that export. This metadata persists in IndexedDB and updates across tabs. Changes during or after export remain unexported; failed generation or download initiation does not advance status. Initiating a download cannot confirm that the file was saved. Source-code downloads do not back up personal data. Deleted readings held temporarily for Undo are excluded, matching the export policy described below.

Import validates format/version, supported versification, dates, references, reading and journal ID uniqueness, journal names, journal ownership, and range order. The importer accepts v1 and v2 backups and assigns their readings to the default Journal. Merge preserves existing IDs and adds new IDs; it never overwrites an existing reading or moves it into another journal. New journal IDs with colliding names receive an “imported” suffix rather than combining their histories. A preview describes additions and duplicate readings before committing. Database and export versions are separate contracts. Selection is a local preference and is not exported.

### Reading dates

New logs store `datePrecision: "date"` and `startedAt: "YYYY-MM-DD"`. No time is inferred. Known times in v3 imports use `datePrecision: "instant"` and an ISO timestamp with an explicit UTC or numeric offset; import normalizes these instants to UTC. Display, editing, and ordering of known times use the current browser timezone. Editing notes preserves an unchanged instant; changing its calendar date converts it to date-only.

Date-only recency counts calendar days in the current timezone, using calendar arithmetic so daylight-saving days count once. Today is the freshest bucket, followed by 1–6, 7–29, 30–89, 90–364, and 365+ days. Known times use elapsed 24-hour periods with the same boundaries. Mixed readings sort by current local calendar day, with date-only readings preceding known times on the same day; same-date unknown times have equal order. Verse first/last summaries use this same comparison. Future dates cannot be logged or saved; imported future dates are preserved for correction and use the neutral recency color until they occur. Frequency still counts them.

IndexedDB upgrades and v1/v2 imports migrate unmarked legacy timestamps to their UTC calendar date and retain the exact original value as `legacyStartedAt`. UTC is a deterministic fallback, not a reconstruction of the original local date: old exports did not record the entry timezone, and noon was artificial. Open Edit to see the original timestamp and correct the estimated date. Recovery metadata survives edits and exports. New exports use v3; older app versions cannot read them.

### Undo behavior

Deleting readings or clearing a journal atomically moves their exact stored records into persistent Trash for 30 days (elapsed time from deletion). Normal history, maps, and statistics exclude Trash. Immediate Undo is available for 30 seconds in the deleting tab; Undo and Trash restoration consume the same persistent deletion entry atomically, so neither can duplicate records. Reloading ends Undo but preserves Trash.

Your data lists deleted passages, dates, notes, original journals, deletion time, and expiry. Restore to the original active journal or explicitly choose another active destination. Restoration preserves IDs, creation/update timestamps, dates, content, and encounter identity; recovery is not an edit. Missing or archived original journals require a valid destination or journal restoration. ID conflicts abort the entire restoration. Permanent deletion requires confirmation; overdue retention cleanup runs on the next repository access, including restart, and touches only Trash.

JSON backups exclude Trash. Restore readings before exporting to back them up. Imports containing a Trash field are rejected rather than resetting expiry. Deleting an empty journal retains its Trash; the journal itself is not recoverable, and its readings must be restored elsewhere. Browser storage clearing can remove both active and deleted data.

</details>

## Metadata provenance

Verse counts were extracted from the public-domain KJV dataset in [scrollmapper/bible_databases](https://github.com/scrollmapper/bible_databases), `formats/json/KJV.json`. Only book names and per-chapter verse counts are bundled. Numbered book names are normalized to Arabic numerals. The source contains no translation text.

## License

MIT. See [LICENSE](LICENSE).
