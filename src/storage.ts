import { migrateReadingDate } from "./domain";
import { exportFingerprint, type BackupRecord } from "./backup";
import {
  DEFAULT_JOURNAL_ID,
  defaultJournal,
  serializeJournals,
  mergeJournalImport,
  migrateLegacyReadings,
  type Journal,
  type JournalImport,
  type JournalReading,
  type JournalState,
} from "./journals";

export type ConflictKind =
  | "reading-updated"
  | "reading-deleted"
  | "reading-exists"
  | "journal-updated"
  | "journal-deleted"
  | "journal-exists"
  | "journal-missing";
export class ConflictError extends Error {
  readonly kind: ConflictKind;
  readonly id: string;
  readonly stored?: JournalReading | Journal;
  readonly attempted?: JournalReading | Journal;
  constructor(
    kind: ConflictKind,
    id: string,
    stored?: JournalReading | Journal,
    attempted?: JournalReading | Journal,
  ) {
    super(kind);
    this.name = "ConflictError";
    this.kind = kind;
    this.id = id;
    this.stored = stored;
    this.attempted = attempted;
  }
}

export const UNDO_DURATION_MS = 30_000;
export interface UndoOpportunity {
  id: string;
  expiresAt: number;
  count: number;
}
type UndoState = JournalState & { undo: UndoOpportunity };
const recovery = new Map<
  string,
  { opportunity: UndoOpportunity; readings: JournalReading[] }
>();
function remember(readings: JournalReading[]): UndoOpportunity {
  for (const [id, entry] of recovery)
    if (entry.opportunity.expiresAt <= Date.now()) recovery.delete(id);
  const opportunity = {
    id: crypto.randomUUID(),
    expiresAt: Date.now() + UNDO_DURATION_MS,
    count: readings.length,
  };
  recovery.set(opportunity.id, { opportunity, readings });
  const timer = setTimeout(
    () => recovery.delete(opportunity.id),
    UNDO_DURATION_MS,
  );
  // Node tests should not remain running solely for a recovery cleanup timer.
  (timer as unknown as { unref?: () => void }).unref?.();
  return opportunity;
}

export interface ReadingRepository {
  load(): Promise<JournalState>;
  exportAll(initiate: (json: string) => void): Promise<JournalState>;
  selectJournal(id: string): Promise<void>;
  putReading(
    reading: JournalReading,
    expectedUpdatedAt: string | null,
  ): Promise<JournalState>;
  deleteReading(id: string, expectedUpdatedAt: string): Promise<UndoState>;
  undo(id: string): Promise<JournalState>;
  putJournal(
    journal: Journal,
    expectedUpdatedAt: string | null,
  ): Promise<JournalState>;
  deleteJournal(id: string): Promise<JournalState>;
  resetJournal(journalId: string, readingIds: string[]): Promise<UndoState>;
  mergeImport(incoming: JournalImport): Promise<{
    state: JournalState;
    addedReadings: number;
    addedJournals: number;
    duplicates: number;
    renamedJournals: string[];
  }>;
}

const CHANNEL = "jot-and-tittle";
export const storageClientId = crypto.randomUUID();
const notify = () => {
  try {
    const channel = new BroadcastChannel(CHANNEL);
    channel.postMessage({ type: "change", source: storageClientId });
    channel.close();
  } catch {
    /* BroadcastChannel unavailable */
  }
};
export const storageChannel = () =>
  typeof BroadcastChannel === "undefined"
    ? null
    : new BroadcastChannel(CHANNEL);

const connect = () =>
  new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open("jot-and-tittle", 3);
    request.onupgradeneeded = (event) => {
      const db = request.result;
      const tx = request.transaction!;
      if (event.oldVersion < 1)
        db.createObjectStore("readings", { keyPath: "id" });
      if (event.oldVersion < 2) {
        const journals = db.createObjectStore("journals", { keyPath: "id" });
        journals.put(defaultJournal());
        const settings = db.createObjectStore("settings", { keyPath: "id" });
        settings.put({ id: "activeJournalId", value: DEFAULT_JOURNAL_ID });
        const cursor = tx.objectStore("readings").openCursor();
        cursor.onsuccess = () => {
          const entry = cursor.result;
          if (entry) {
            entry.update(migrateLegacyReadings([entry.value])[0]);
            entry.continue();
          }
        };
      }
      if (event.oldVersion === 2) {
        const cursor = tx.objectStore("readings").openCursor();
        cursor.onsuccess = () => {
          const entry = cursor.result;
          if (entry) {
            entry.update(migrateReadingDate(entry.value));
            entry.continue();
          }
        };
      }
    };
    request.onsuccess = () => {
      const db = request.result;
      db.onversionchange = () => db.close();
      resolve(db);
    };
    request.onerror = () => reject(request.error);
    request.onblocked = () =>
      reject(
        new Error(
          "Close other Jot & Tittle tabs to upgrade your local journals.",
        ),
      );
  });

const sortJournals = (rows: Journal[]) => {
  rows.sort((a, b) =>
    a.id === DEFAULT_JOURNAL_ID
      ? -1
      : b.id === DEFAULT_JOURNAL_ID
        ? 1
        : a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id),
  );
  return rows;
};

const readState = (db: IDBDatabase) =>
  new Promise<JournalState>((resolve, reject) => {
    const tx = db.transaction(["readings", "journals", "settings"], "readonly");
    const readings = tx.objectStore("readings").getAll(),
      journals = tx.objectStore("journals").getAll(),
      setting = tx.objectStore("settings").get("activeJournalId"),
      backup = tx.objectStore("settings").get("backup");
    tx.oncomplete = () => {
      const rows = sortJournals(journals.result as Journal[]);
      const state: JournalState = {
        readings: readings.result as JournalReading[],
        journals: rows,
        activeJournalId: rows.some((j) => j.id === setting.result?.value)
          ? setting.result.value
          : rows[0]?.id || DEFAULT_JOURNAL_ID,
        backup: backup.result?.value,
      };
      exportFingerprint(state).then(
        (fingerprint) =>
          resolve({
            ...state,
            hasUnexportedChanges: fingerprint !== state.backup?.fingerprint,
          }),
        reject,
      );
    };
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });

const withDb = <T>(work: (db: IDBDatabase) => Promise<T>, broadcast = false) =>
  connect().then(async (db) => {
    try {
      const result = await work(db);
      if (broadcast) notify();
      return result;
    } finally {
      db.close();
    }
  });

const req = <T>(request: IDBRequest<T>) =>
  new Promise<T>((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

const commit = (tx: IDBTransaction) =>
  new Promise<void>((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () =>
      reject(tx.error || new Error("Storage operation aborted."));
  });

export const repository: ReadingRepository = {
  async load() {
    return withDb(readState);
  },

  async exportAll(initiate) {
    return withDb(async (db) => {
      const snapshot = await readState(db);
      const json = JSON.stringify(
        serializeJournals(snapshot.journals, snapshot.readings),
        null,
        2,
      );
      const fingerprint = await exportFingerprint(snapshot);
      const initiatedAt = new Date().toISOString();
      // Generation and download initiation must succeed before recording status.
      initiate(json);
      const tx = db.transaction("settings", "readwrite");
      const settings = tx.objectStore("settings");
      const previous = (await req(settings.get("backup")))?.value as
        BackupRecord | undefined;
      if (!previous || previous.initiatedAt <= initiatedAt)
        settings.put({ id: "backup", value: { initiatedAt, fingerprint } });
      await commit(tx);
      return readState(db);
    }, true);
  },

  async selectJournal(id) {
    return withDb(async (db) => {
      const tx = db.transaction(["settings", "journals"], "readwrite");
      const found = await req(tx.objectStore("journals").get(id));
      if (!found) {
        tx.abort();
        throw new Error("Journal not found.");
      }
      tx.objectStore("settings").put({ id: "activeJournalId", value: id });
      await commit(tx);
    }, true);
  },

  async putReading(reading, expectedUpdatedAt) {
    if (!reading.id)
      throw new Error("Journal and reading IDs must be present and unique.");
    return withDb(async (db) => {
      const tx = db.transaction(
        ["readings", "journals", "settings"],
        "readwrite",
      );
      const readings = tx.objectStore("readings"),
        journals = tx.objectStore("journals");
      const journal = await req(journals.get(reading.journalId));
      if (!journal) {
        tx.abort();
        throw new ConflictError(
          "journal-missing",
          reading.journalId,
          undefined,
          reading,
        );
      }
      const stored = (await req(readings.get(reading.id))) as
        JournalReading | undefined;
      if (expectedUpdatedAt === null) {
        if (stored) {
          tx.abort();
          throw new ConflictError(
            "reading-exists",
            reading.id,
            stored,
            reading,
          );
        }
        readings.put(reading);
      } else {
        if (!stored) {
          tx.abort();
          throw new ConflictError(
            "reading-deleted",
            reading.id,
            undefined,
            reading,
          );
        }
        if (stored.updatedAt !== expectedUpdatedAt) {
          tx.abort();
          throw new ConflictError(
            "reading-updated",
            reading.id,
            stored,
            reading,
          );
        }
        readings.put(reading);
      }
      await commit(tx);
      return readState(db);
    }, true);
  },

  async deleteReading(id, expectedUpdatedAt) {
    return withDb(async (db) => {
      const tx = db.transaction(
        ["readings", "journals", "settings"],
        "readwrite",
      );
      const stored = (await req(tx.objectStore("readings").get(id))) as
        JournalReading | undefined;
      if (!stored) {
        tx.abort();
        throw new ConflictError("reading-deleted", id);
      }
      if (stored.updatedAt !== expectedUpdatedAt) {
        tx.abort();
        throw new ConflictError("reading-updated", id, stored);
      }
      tx.objectStore("readings").delete(id);
      await commit(tx);
      return { ...(await readState(db)), undo: remember([stored]) };
    }, true);
  },

  async undo(id) {
    return withDb(async (db) => {
      const entry = recovery.get(id);
      if (!entry || entry.opportunity.expiresAt <= Date.now()) {
        recovery.delete(id);
        throw new Error(
          "Undo expired. The 30-second recovery window has ended.",
        );
      }
      const tx = db.transaction(
        ["readings", "journals", "settings"],
        "readwrite",
      );
      const readings = tx.objectStore("readings");
      const journals = tx.objectStore("journals");
      for (const reading of entry.readings) {
        if (!(await req(journals.get(reading.journalId)))) {
          tx.abort();
          throw new Error(
            "Undo cannot restore these readings because their original journal no longer exists.",
          );
        }
        if (await req(readings.get(reading.id))) {
          tx.abort();
          throw new Error(
            "Undo cannot restore these readings because a reading with the same ID now exists. No records were overwritten.",
          );
        }
      }
      // Recheck after waiting for the transaction's lock and validation.
      if (entry.opportunity.expiresAt <= Date.now() || !recovery.has(id)) {
        tx.abort();
        throw new Error(
          "Undo expired. The 30-second recovery window has ended.",
        );
      }
      for (const reading of entry.readings) readings.add(reading);
      await commit(tx);
      recovery.delete(id);
      return readState(db);
    }, true);
  },

  async putJournal(journal, expectedUpdatedAt) {
    if (!journal.id)
      throw new Error("Journal and reading IDs must be present and unique.");
    return withDb(async (db) => {
      const tx = db.transaction(
        ["readings", "journals", "settings"],
        "readwrite",
      );
      const journals = tx.objectStore("journals");
      const stored = (await req(journals.get(journal.id))) as
        Journal | undefined;
      if (expectedUpdatedAt === null) {
        if (stored) {
          tx.abort();
          throw new ConflictError(
            "journal-exists",
            journal.id,
            stored,
            journal,
          );
        }
        journals.put(journal);
        tx.objectStore("settings").put({
          id: "activeJournalId",
          value: journal.id,
        });
      } else {
        if (!stored) {
          tx.abort();
          throw new ConflictError(
            "journal-deleted",
            journal.id,
            undefined,
            journal,
          );
        }
        if (stored.updatedAt !== expectedUpdatedAt) {
          tx.abort();
          throw new ConflictError(
            "journal-updated",
            journal.id,
            stored,
            journal,
          );
        }
        journals.put(journal);
      }
      await commit(tx);
      return readState(db);
    }, true);
  },

  async deleteJournal(id) {
    return withDb(async (db) => {
      const tx = db.transaction(
        ["readings", "journals", "settings"],
        "readwrite",
      );
      const journals = tx.objectStore("journals"),
        readings = tx.objectStore("readings"),
        settings = tx.objectStore("settings");
      const stored = await req(journals.get(id));
      if (!stored) {
        tx.abort();
        throw new ConflictError("journal-deleted", id);
      }
      const all = (await req(readings.getAll())) as JournalReading[];
      for (const r of all) if (r.journalId === id) readings.delete(r.id);
      journals.delete(id);
      const setting = await req(settings.get("activeJournalId"));
      if (setting?.value === id) {
        const remaining = (await req(journals.getAll())) as Journal[];
        const next =
          remaining.find((j) => j.id === DEFAULT_JOURNAL_ID) || remaining[0];
        if (next) settings.put({ id: "activeJournalId", value: next.id });
      }
      await commit(tx);
      return readState(db);
    }, true);
  },

  async resetJournal(journalId, readingIds) {
    return withDb(async (db) => {
      const tx = db.transaction(
        ["readings", "journals", "settings"],
        "readwrite",
      );
      const journals = tx.objectStore("journals"),
        readings = tx.objectStore("readings");
      if (!(await req(journals.get(journalId)))) {
        tx.abort();
        throw new ConflictError("journal-missing", journalId);
      }
      const deleted: JournalReading[] = [];
      for (const id of readingIds) {
        const stored = (await req(readings.get(id))) as
          JournalReading | undefined;
        if (stored && stored.journalId === journalId) {
          deleted.push(stored);
          readings.delete(id);
        }
      }
      await commit(tx);
      return { ...(await readState(db)), undo: remember(deleted) };
    }, true);
  },

  async mergeImport(incoming) {
    return withDb(async (db) => {
      const current = await readState(db);
      const merged = mergeJournalImport(current, incoming);
      const tx = db.transaction(
        ["readings", "journals", "settings"],
        "readwrite",
      );
      const readings = tx.objectStore("readings"),
        journals = tx.objectStore("journals");
      const existingJournalIds = new Set(current.journals.map((j) => j.id));
      const existingReadingIds = new Set(current.readings.map((r) => r.id));
      for (const j of merged.state.journals)
        if (!existingJournalIds.has(j.id)) journals.put(j);
      for (const r of merged.state.readings)
        if (!existingReadingIds.has(r.id)) readings.put(r);
      await commit(tx);
      const state = await readState(db);
      return {
        state,
        addedReadings: merged.addedReadings,
        addedJournals: merged.addedJournals,
        duplicates: merged.duplicates,
        renamedJournals: merged.renamedJournals,
      };
    }, true);
  },
};
