---
title: A place to begin.
eyebrow: Getting started
intro: Bring the Bible you already read. Jot & Tittle keeps the record, one passage at a time.
permalink: /guide/
---

## Run your own journal

Jot & Tittle is a browser app. To run it locally, install Node.js 22 or later, npm, and Python 3, then clone [the project]({{ site.repository_url }}) and run:

```sh
git clone {{ site.repository_url }}.git
cd jot-and-tittle
npm install
npm run dev
```

Open the local address printed in your terminal. No account, API key, or Bible-text service is required. Development mode needs the local server running; offline support is available in production builds.

{% if site.app_url != empty %}
[Open the hosted app]({{ site.app_url }}) to get started without a local installation.
{% endif %}

## Record what you read

Start in **Journal**, or create a journal for a particular study or season. Log a passage such as `John 1:1–18` or `Psalm 23`. You can combine passages with semicolons and enter ranges that cross chapters or books. Add your reading date and optional notes.

The map gives each verse its own square. Overlapping passages in one reading count once. Use **Combined**, **Recency**, or **Frequency** to explore when you read a passage and how often you return.

## Explore at your own pace

Look across the full Bible, focus on a book or chapter, or enter a passage. Reading history lets you search, edit, and delete entries. The sample dataset is a separate, read-only example; your own history starts empty.

Jot & Tittle includes metadata for the 66-book Protestant canon with KJV verse numbering. It does not include Bible text, so keep using your preferred Bible alongside it.

## Keep a copy

Export your journals and readings from **Your data**. Store the JSON file somewhere you can find it again. Import provides a preview before merging a backup into your journal.

Browser storage can be cleared or removed. Each browser and site address has its own history. A source-code download is a copy of the software; it does not back up your readings.

[Read more about privacy and backups]({{ '/privacy/' | relative_url }}).

## Build for offline use

```sh
npm run build
npx vite preview
```

For your own hosting, serve the contents of `dist/` over HTTPS. After the first full load, the production app shell works offline. See the [project README]({{ site.repository_url }}#readme) for the complete technical details.
