import {
  deriveStats,
  mergeRanges,
  serialize,
  deserialize,
  migrateReadingDate,
  VERSIFICATION,
  type Reading,
} from "./domain";
export const DEFAULT_JOURNAL_ID = "journal-default";
export interface Journal {
  archived?: boolean;
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}
export interface JournalReading extends Reading {
  journalId: string;
}
export interface TrashEntry {
  id: string;
  deletedAt: string;
  expiresAt: string;
  readings: JournalReading[];
}
export interface JournalState {
  trash?: TrashEntry[];
  journals: Journal[];
  readings: JournalReading[];
  activeJournalId: string;
  backup?: { initiatedAt: string; fingerprint: string };
  hasUnexportedChanges?: boolean;
}
export interface JournalImport {
  journals: Journal[];
  readings: JournalReading[];
  legacy: boolean;
}
export function defaultJournal(now = new Date().toISOString()): Journal {
  return {
    id: DEFAULT_JOURNAL_ID,
    name: "Journal",
    createdAt: now,
    updatedAt: now,
  };
}
export function migrateLegacyReadings(readings: Reading[]): JournalReading[] {
  return readings.map((r) => ({
    ...migrateReadingDate(r),
    journalId: DEFAULT_JOURNAL_ID,
  }));
}
export function journalReadings(readings: JournalReading[], id: string) {
  return readings.filter((r) => r.journalId === id);
}
export function validateJournalName(
  name: string,
  journals: Journal[],
  excludingId?: string,
) {
  if (typeof name !== "string") throw new Error("A journal name must be text.");
  const trimmed = name.trim();
  if (!trimmed || trimmed.length > 60)
    throw new Error("Give your journal a name between 1 and 60 characters.");
  if (
    journals.some(
      (j) =>
        j.id !== excludingId &&
        j.name.toLocaleLowerCase() === trimmed.toLocaleLowerCase(),
    )
  )
    throw new Error(
      "A journal with that name already exists. Choose another name.",
    );
  return trimmed;
}
export function serializeJournals(
  journals: Journal[],
  readings: JournalReading[],
) {
  return {
    ...serialize(readings.map(migrateReadingDate)),
    version: 3,
    journals: journals.map((j) => ({ ...j })),
    readings: serialize(readings.map(migrateReadingDate)).readings.map(
      (r, i) => ({
        ...r,
        journalId: readings[i].journalId,
      }),
    ),
  };
}
export function deserializeJournals(input: unknown): JournalImport {
  if (input && typeof input === "object" && "trash" in input)
    throw new Error(
      "Backups do not support Trash. Restore deleted readings before exporting them.",
    );
  const x = input as ReturnType<typeof serializeJournals>;
  if (x?.version === 1)
    return {
      journals: [defaultJournal()],
      readings: migrateLegacyReadings(
        deserialize(input).map((r, i) => ({
          ...r,
          startedAt: x.readings[i].startedAt,
        })),
      ),
      legacy: true,
    };
  if (
    !x ||
    x.format !== "jot-and-tittle" ||
    (x.version !== 2 && x.version !== 3) ||
    x.versification !== VERSIFICATION ||
    !Array.isArray(x.journals) ||
    !x.journals.length
  )
    throw new Error(
      "Expected a Jot & Tittle v1, v2 or v3 export using protestant-en versification.",
    );
  const journals: Journal[] = [];
  for (const j of x.journals) {
    if (
      !j ||
      typeof j.id !== "string" ||
      !j.id.trim() ||
      journals.some((q) => q.id === j.id)
    )
      throw new Error("The file contains a missing or duplicate journal ID.");
    const name = validateJournalName(j.name, journals);
    for (const d of [j.createdAt, j.updatedAt])
      if (typeof d !== "string" || !Number.isFinite(Date.parse(d)))
        throw new Error("A journal contains an invalid date.");
    if (j.archived !== undefined && typeof j.archived !== "boolean")
      throw new Error("Invalid archive status.");
    if (j.id === DEFAULT_JOURNAL_ID && j.archived)
      throw new Error("The default Journal cannot be archived.");
    journals.push({
      ...(j.archived !== undefined ? { archived: j.archived } : {}),
      id: j.id,
      name,
      createdAt: new Date(j.createdAt).toISOString(),
      updatedAt: new Date(j.updatedAt).toISOString(),
    });
  }
  const readings = deserialize({ ...x, version: 1 }).map((r, i) => {
    const journalId = x.readings[i].journalId;
    if (!journals.some((j) => j.id === journalId))
      throw new Error("A reading refers to a journal missing from this file.");
    if (x.version === 3 && !r.datePrecision)
      throw new Error("Missing date precision.");
    return {
      ...(x.version === 2
        ? migrateReadingDate({ ...r, startedAt: x.readings[i].startedAt })
        : r),
      journalId,
    };
  });
  return { journals, readings, legacy: false };
}
export function mergeJournalImport(
  current: JournalState,
  incoming: JournalImport,
) {
  const journals = current.journals.map((j) => ({ ...j }));
  let addedJournals = 0;
  const renamedJournals: string[] = [];
  for (const j of incoming.journals) {
    if (journals.some((q) => q.id === j.id)) continue;
    let name = j.name;
    let suffix = 1;
    while (
      journals.some(
        (q) => q.name.toLocaleLowerCase() === name.toLocaleLowerCase(),
      )
    ) {
      name = `${j.name.slice(0, 40)} (imported${suffix === 1 ? "" : ` ${suffix}`})`;
      suffix++;
    }
    if (name !== j.name) renamedJournals.push(`${j.name} → ${name}`);
    journals.push({ ...j, name });
    addedJournals++;
  }
  const existing = new Set(current.readings.map((r) => r.id));
  const additions = incoming.readings.filter((r) => !existing.has(r.id));
  return {
    state: {
      ...current,
      journals,
      readings: [...current.readings, ...additions],
    },
    addedReadings: additions.length,
    addedJournals,
    duplicates: incoming.readings.length - additions.length,
    renamedJournals,
  };
}
export function readingChanged(
  a: JournalReading | null | undefined,
  b: JournalReading | null | undefined,
) {
  if (!a || !b) return a !== b;
  return (
    a.updatedAt !== b.updatedAt ||
    a.journalId !== b.journalId ||
    a.originalInput !== b.originalInput ||
    a.notes !== b.notes ||
    a.startedAt !== b.startedAt ||
    a.datePrecision !== b.datePrecision ||
    a.legacyStartedAt !== b.legacyStartedAt
  );
}
export function describeConflict(kind: string) {
  switch (kind) {
    case "reading-updated":
      return "This reading was updated in another tab.";
    case "reading-deleted":
      return "This reading was deleted in another tab.";
    case "reading-exists":
      return "A reading with this ID already exists.";
    case "journal-updated":
      return "This journal was updated in another tab.";
    case "journal-deleted":
      return "This journal was deleted in another tab.";
    case "journal-exists":
      return "A journal with this ID already exists.";
    case "journal-missing":
      return "The destination journal no longer exists.";
    default:
      return "Another tab changed this record before it could be saved.";
  }
}

export function aggregateStats(readings: JournalReading[]) {
  const encounters = new Map<string, JournalReading>();
  for (const reading of readings) {
    const key = reading.encounterId || reading.id;
    const existing = encounters.get(key);
    if (existing)
      existing.ranges = mergeRanges([...existing.ranges, ...reading.ranges]);
    else encounters.set(key, { ...reading, ranges: [...reading.ranges] });
  }
  return deriveStats([...encounters.values()]);
}
export function journalScopeIds(
  journals: Journal[],
  mode: string,
  destination: string,
  selected: string[],
) {
  return mode === "all"
    ? journals.filter((j) => !j.archived).map((j) => j.id)
    : mode === "selected"
      ? selected.filter((id) => journals.some((j) => j.id === id))
      : [destination];
}
