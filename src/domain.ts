import canon from "./canon.json";
export const VERSIFICATION = "protestant-en";
const osis =
  "Gen Exod Lev Num Deut Josh Judg Ruth 1Sam 2Sam 1Kgs 2Kgs 1Chr 2Chr Ezra Neh Esth Job Ps Prov Eccl Song Isa Jer Lam Ezek Dan Hos Joel Amos Obad Jonah Mic Nah Hab Zeph Hag Zech Mal Matt Mark Luke John Acts Rom 1Cor 2Cor Gal Eph Phil Col 1Thess 2Thess 1Tim 2Tim Titus Phlm Heb Jas 1Pet 2Pet 1John 2John 3John Jude Rev".split(
    " ",
  );
export interface Verse {
  id: number;
  osisId: string;
  book: number;
  chapter: number;
  verse: number;
}
export interface Range {
  start: number;
  end: number;
}
export interface Reading {
  encounterId?: string;
  id: string;
  startedAt: string;
  datePrecision?: "date" | "instant";
  legacyStartedAt?: string;
  createdAt: string;
  updatedAt: string;
  originalInput: string;
  notes: string;
  ranges: Range[];
}
// Date-only values never pass through the browser's timezone.
export const localDate = (date = new Date()) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
export function validCalendarDate(value: string) {
  return (
    /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    Number.isFinite(Date.parse(value)) &&
    new Date(value).toISOString().slice(0, 10) === value
  );
}
export function readingDate(value: string) {
  return validCalendarDate(value) ? value : localDate(new Date(value));
}
export function formatReadingDate(value: string) {
  return new Date(
    validCalendarDate(value) ? `${value}T00:00:00Z` : value,
  ).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    ...(validCalendarDate(value)
      ? { timeZone: "UTC" }
      : { hour: "numeric", minute: "2-digit", timeZoneName: "short" }),
  });
}
// Compare by current local calendar day; unknown times precede known times on that day.
export function compareReadingDates(a: string, b: string) {
  return (
    readingDate(a).localeCompare(readingDate(b)) ||
    (validCalendarDate(a)
      ? validCalendarDate(b)
        ? 0
        : -1
      : validCalendarDate(b)
        ? 1
        : Date.parse(a) - Date.parse(b))
  );
}
export function migrateReadingDate<T extends Reading>(r: T): T {
  if (r.datePrecision) return r;
  return {
    ...r,
    startedAt: new Date(r.startedAt).toISOString().slice(0, 10),
    datePrecision: "date",
    legacyStartedAt: r.startedAt,
  };
}
export interface Stats {
  count: number;
  first: string | null;
  last: string | null;
}
export const verses: Verse[] = [];
export const books = canon.map((b, i) => {
  const start = verses.length;
  const chapters = b.chapters.map((count, c) => {
    const first = verses.length;
    for (let v = 1; v <= count; v++)
      verses.push({
        id: verses.length,
        osisId: `${osis[i]}.${c + 1}.${v}`,
        book: i,
        chapter: c + 1,
        verse: v,
      });
    return { start: first, end: verses.length - 1, count };
  });
  return {
    ...b,
    chapters,
    index: i,
    osis: osis[i],
    start,
    end: verses.length - 1,
  };
});
const extra: Record<string, string[]> = {
  Ps: ["Psalm", "Psa", "Psm"],
  Song: ["Song of Songs", "Song of Solomon", "Canticles", "SOS"],
  Phlm: ["Philemon", "Phm"],
  Jas: ["James", "Jam"],
  "1Kgs": ["1 Kings", "1 Ki"],
  "2Kgs": ["2 Kings", "2 Ki"],
  "1Chr": ["1 Chronicles", "1 Ch"],
  "2Chr": ["2 Chronicles", "2 Ch"],
};
const normalize = (s: string) =>
  s
    .toLowerCase()
    .replace(/^iii\s+/, "3 ")
    .replace(/^ii\s+/, "2 ")
    .replace(/^i\s+/, "1 ")
    .replace(/[.\s]/g, "");
const aliases = books
  .flatMap((b) =>
    [
      b.name,
      b.osis,
      /^\d/.test(b.name) ? b.osis : b.name.slice(0, 3),
      ...(extra[b.osis] || []),
    ].map((a) => ({ key: normalize(a), book: b.index })),
  )
  .sort((a, b) => b.key.length - a.key.length);
function bookMatch(name: string) {
  const key = normalize(name);
  const exact = aliases.find((a) => a.key === key);
  if (exact) return exact.book;
  const candidates = books.filter((b) => normalize(b.name).startsWith(key));
  if (key.length >= 3 && candidates.length === 1) return candidates[0].index;
  throw new Error(
    `Unknown book “${name}”. Try a full book name, such as Romans.`,
  );
}
function endpoint(
  s: string,
  fallback: number | null,
  end: boolean,
  verseFallback: number | null = null,
): { index: number; book: number; chapter: number | null; hasVerse: boolean } {
  const match = s.trim().match(/^(.*?)(\d+)(?::(\d+))?$/);
  if (!match) {
    const b = bookMatch(s);
    return {
      index: end ? books[b].end : books[b].start,
      book: b,
      chapter: null,
      hasVerse: false,
    };
  }
  let name = match[1].trim();
  let b = name ? bookMatch(name) : fallback;
  if (b === null) throw new Error("Include a book name before the chapter.");
  let chapter = Number(match[2]),
    v = match[3] ? Number(match[3]) : null;
  if (verseFallback && !name && !match[3]) {
    v = chapter;
    chapter = verseFallback;
  }
  const ch = books[b].chapters[chapter - 1];
  if (!ch)
    throw new Error(
      `${books[b].name} has ${books[b].chapters.length} chapters.`,
    );
  if (v !== null && (v < 1 || v > ch.count))
    throw new Error(`${books[b].name} ${chapter} has ${ch.count} verses.`);
  return {
    index: v !== null ? ch.start + v - 1 : end ? ch.end : ch.start,
    book: b,
    chapter,
    hasVerse: v !== null,
  };
}
export function mergeRanges(ranges: Range[]): Range[] {
  const sorted = ranges
    .map((r) => ({ ...r }))
    .sort((a, b) => a.start - b.start);
  const result: Range[] = [];
  for (const r of sorted) {
    const last = result.at(-1);
    if (last && r.start <= last.end + 1) last.end = Math.max(last.end, r.end);
    else result.push(r);
  }
  return result;
}
export function parsePassage(input: string): Range[] {
  if (!input.trim()) throw new Error("Enter a passage to continue.");
  const groups = input
    .replace(/[‐‑‒–—−]/g, "-")
    .replace(/\s*:\s*/g, ":")
    .split(";");
  let previousBook: number | null = null;
  const ranges: Range[] = [];
  for (const group of groups) {
    if (!group.trim()) throw new Error("Add a passage after the semicolon.");
    let context: ReturnType<typeof endpoint> | null = null;
    for (const part of group.split(",")) {
      if (!part.trim())
        throw new Error(
          "Add a reference after the comma; trailing or empty items are not allowed.",
        );
      const ends = part.trim().split("-");
      if (ends.length > 2)
        throw new Error(
          "Use one dash per range and commas or semicolons between references.",
        );
      if (ends.some((end) => !end.trim()))
        throw new Error("A range needs a reference on both sides of the dash.");
      if (context && context.chapter === null && /^\d+$/.test(ends[0].trim()))
        throw new Error(
          "Shorthand after a whole book is ambiguous. Include the book and chapter, such as John 3.",
        );
      const inheritedChapter: number | null = context?.hasVerse
        ? context.chapter
        : null;
      const fallbackBook: number | null = context?.book ?? previousBook;
      const a = endpoint(ends[0], fallbackBook, false, inheritedChapter);
      const z: ReturnType<typeof endpoint> =
        ends.length === 2
          ? endpoint(ends[1], a.book, true, a.hasVerse ? a.chapter : null)
          : endpoint(ends[0], fallbackBook, true, inheritedChapter);
      if (z.index < a.index)
        throw new Error(
          "The end of a passage must follow its beginning. Bare numbers after a verse mean verses; write chapter:verse or repeat the book for a chapter.",
        );
      ranges.push({ start: a.index, end: z.index });
      context = z;
      previousBook = a.book;
    }
  }
  return mergeRanges(ranges);
}
export function reference(id: number) {
  const v = verses[id];
  return `${books[v.book].name} ${v.chapter}:${v.verse}`;
}
export function rangeLabel(r: Range) {
  const a = verses[r.start],
    b = verses[r.end],
    book = books[a.book];
  if (a.book === b.book) {
    if (r.start === book.start && r.end === book.end) return book.name;
    if (a.verse === 1 && b.verse === book.chapters[b.chapter - 1].count)
      return `${book.name} ${a.chapter}${a.chapter === b.chapter ? "" : `–${b.chapter}`}`;
    if (r.start === r.end) return reference(r.start);
    return `${reference(r.start)}–${a.chapter === b.chapter ? b.verse : `${b.chapter}:${b.verse}`}`;
  }
  return `${reference(r.start)}–${reference(r.end)}`;
}
export const rangeCount = (rs: Range[]) =>
  mergeRanges(rs).reduce((sum, r) => sum + r.end - r.start + 1, 0);
export function deriveStats(readings: Reading[]): Stats[] {
  const result = verses.map(
    () => ({ count: 0, first: null, last: null }) as Stats,
  );
  for (const r of readings)
    for (const range of mergeRanges(r.ranges))
      for (let i = range.start; i <= range.end; i++) {
        const s = result[i];
        s.count++;
        if (!s.first || compareReadingDates(r.startedAt, s.first) < 0)
          s.first = r.startedAt;
        if (!s.last || compareReadingDates(r.startedAt, s.last) > 0)
          s.last = r.startedAt;
      }
  return result;
}
export const palette = [
  "#e5e8e0",
  "#d1ddbb",
  "#b5cc8f",
  "#91b669",
  "#69964d",
  "#467338",
  "#294e29",
];
export function bucket(s: Stats, metric: string, now = Date.now()) {
  if (!s.count) return 0;
  if (metric === "frequency")
    return s.count === 1
      ? 1
      : s.count < 5
        ? 2
        : s.count < 10
          ? 3
          : s.count < 25
            ? 4
            : s.count < 50
              ? 5
              : 6;
  const last = s.last!;
  const days = validCalendarDate(last)
    ? (Date.parse(localDate(new Date(now))) - Date.parse(last)) / 86400000
    : (now - Date.parse(last)) / 86400000;
  if (days < 0) return 0;
  return days < 1
    ? 6
    : days < 7
      ? 5
      : days < 30
        ? 4
        : days < 90
          ? 3
          : days < 365
            ? 2
            : 1;
}
export function serialize(readings: Reading[]) {
  return {
    format: "jot-and-tittle",
    version: 1,
    exportedAt: new Date().toISOString(),
    versification: VERSIFICATION,
    readings: readings.map((r) => ({
      ...r,
      ranges: r.ranges.map((x) => ({
        start: verses[x.start].osisId,
        end: verses[x.end].osisId,
      })),
    })),
  };
}
export function deserialize(input: unknown): Reading[] {
  const x = input as ReturnType<typeof serialize>;
  if (
    !x ||
    x.format !== "jot-and-tittle" ||
    x.version !== 1 ||
    x.versification !== VERSIFICATION ||
    !Array.isArray(x.readings)
  )
    throw new Error(
      "Expected a Jot & Tittle v1 export using protestant-en versification.",
    );
  const lookup = new Map(verses.map((v) => [v.osisId, v.id]));
  const seen = new Set<string>();
  return x.readings.map((r) => {
    if (typeof r.id !== "string" || !r.id || seen.has(r.id))
      throw new Error("Missing or duplicate reading ID.");
    seen.add(r.id);
    if (
      r.datePrecision !== undefined &&
      r.datePrecision !== "date" &&
      r.datePrecision !== "instant"
    )
      throw new Error("Invalid date precision.");
    if (r.datePrecision === "date" && !validCalendarDate(r.startedAt))
      throw new Error("Invalid calendar date.");
    if (
      r.datePrecision !== "date" &&
      !/T.*(?:Z|[+-]\d{2}:\d{2})$/.test(r.startedAt)
    )
      throw new Error("Known times require an offset.");
    if (
      r.legacyStartedAt !== undefined &&
      (typeof r.legacyStartedAt !== "string" ||
        !Number.isFinite(Date.parse(r.legacyStartedAt)))
    )
      throw new Error("Invalid legacy date.");
    for (const d of [r.startedAt, r.createdAt, r.updatedAt])
      if (typeof d !== "string" || !Number.isFinite(Date.parse(d)))
        throw new Error("A reading contains an invalid date.");
    if (
      typeof r.originalInput !== "string" ||
      typeof r.notes !== "string" ||
      !Array.isArray(r.ranges) ||
      !r.ranges.length
    )
      throw new Error("A reading is missing its passage or notes.");
    if (
      r.encounterId !== undefined &&
      (typeof r.encounterId !== "string" || !r.encounterId.trim())
    )
      throw new Error("Invalid encounter identity.");
    return {
      ...(r.encounterId ? { encounterId: r.encounterId } : {}),
      id: r.id,
      originalInput: r.originalInput,
      notes: r.notes,
      startedAt:
        r.datePrecision === "date"
          ? r.startedAt
          : new Date(r.startedAt).toISOString(),
      ...(r.datePrecision ? { datePrecision: r.datePrecision } : {}),
      ...(r.legacyStartedAt ? { legacyStartedAt: r.legacyStartedAt } : {}),
      createdAt: new Date(r.createdAt).toISOString(),
      updatedAt: new Date(r.updatedAt).toISOString(),
      ranges: mergeRanges(
        r.ranges.map((q) => {
          const start = lookup.get(q.start),
            end = lookup.get(q.end);
          if (start === undefined || end === undefined || start > end)
            throw new Error("A reading contains an invalid verse range.");
          return { start, end };
        }),
      ),
    };
  });
}
export function sampleReadings(): Reading[] {
  const passages = [
    "Genesis 1-3",
    "Psalm 23",
    "Romans 8",
    "John 15:1-17",
    "Matthew 5-7",
    "Philippians 2",
    "Psalm 139",
    "Ephesians 4-6",
    "1 Corinthians 12-14",
    "Jonah",
    "John 1",
    "Isaiah 40",
    "Psalm 46",
    "Luke 15",
    "Revelation 21-22",
    "Proverbs 3",
    "James 1-3",
    "Hebrews 11",
    "Colossians 3",
    "Mark 4",
    "Genesis 12-15",
    "Exodus 1-4",
    "Deuteronomy 6",
    "Acts 1-4",
  ];
  return Array.from({ length: 80 }, (_, i) => {
    const date = new Date(
      Date.now() - ((i * 37) % 390) * 86400000,
    ).toISOString();
    const passage = passages[i % passages.length];
    return {
      id: `sample-${i}`,
      originalInput: passage,
      datePrecision: "instant",
      startedAt: date,
      createdAt: date,
      updatedAt: date,
      notes: "Sample reading",
      ranges: parsePassage(passage),
    };
  });
}

// Recency changes hue (dry brown to fresh green); frequency changes lightness.
// Keep the two channels independent, with neutral gray reserved for unrecorded verses.
export const recencyLabels = [
  "365+ days",
  "90–364 days",
  "30–89 days",
  "7–29 days",
  "1–6 days",
  "Today / within 24 hours",
];
export const frequencyLabels = [
  "1 reading",
  "2–4 readings",
  "5–9 readings",
  "10–24 readings",
  "25–49 readings",
  "50+ readings",
];
const leafHues = [28, 45, 63, 85, 110, 145];
const leafLightness = [70, 60, 50, 41, 32, 24];
export const combinedPalette = leafLightness.map((lightness, frequency) =>
  leafHues.map(
    (hue, recency) =>
      `hsl(${hue} ${46 + recency * 3 + frequency * 2}% ${lightness}%)`,
  ),
);
export function metricColor(
  s: Stats,
  metric: string,
  now = Date.now(),
): string {
  if (!s.count) return palette[0];
  if (metric !== "frequency" && bucket(s, "recency", now) === 0)
    return palette[0];
  if (metric === "combined")
    return combinedPalette[bucket(s, "frequency", now) - 1][
      bucket(s, "recency", now) - 1
    ];
  return palette[bucket(s, metric, now)];
}
