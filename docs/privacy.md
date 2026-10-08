---
title: Your reading. Your record.
eyebrow: Privacy & data
intro: A personal journal should feel personal. Here is where yours lives, and how to keep it.
permalink: /privacy/
---

## Your history stays in your browser

Jot & Tittle stores journals, reading dates, passages, and notes in your browser using IndexedDB. The app does not send your reading history to the host. There is no account system, telemetry, or cloud synchronization.

The website and app use system fonts rather than requesting fonts from third-party services. Your hosting provider still receives ordinary requests for site files; this is separate from your locally stored reading history.

## Make backups a habit

Use **Your data** to export a JSON backup containing every journal and its readings, including notes. Empty journals are included too. Store that file somewhere outside your browser.

The app records when a personal-data download was initiated and shows whether your current data has changed since that export. It cannot confirm whether the downloaded file was actually saved. Downloading the application source does not back up personal history.

## A browser is a place, not a permanent vault

Different browsers, devices, and site addresses have independent storage. Switching to another one will not automatically bring your history with you. Export from the old location and import at the new one.

Clearing website data, using a temporary browsing session, or browser storage eviction can remove your history. Keep regular exports if the record matters to you.

## Import with a preview

Imports are validated before saving. The merge preview explains what will be added and which readings are already present. An existing reading is never overwritten by a matching imported ID.

## You control what you keep

You can edit or delete readings and clear an individual journal. Deleted readings and cleared journals offer a 30-second Undo window in the same tab. Reloading or closing that tab ends the recovery window. Temporary Undo records are not part of exported backups.

## Open to inspection

The project is [open source under the MIT license]({{ site.repository_url }}/blob/main/LICENSE). You can inspect the code, run it locally, and host your own copy.
