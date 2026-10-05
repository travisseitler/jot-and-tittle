import React, { useEffect, useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  Grid2X2,
  BookOpen,
  ChartNoAxesColumnIncreasing,
  HardDrive,
  Plus,
  ArrowUpRight,
  ArrowRight,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  X,
  Check,
  Download,
  Upload,
  Search,
  Minus,
  Expand,
  ShieldCheck,
  MoreHorizontal,
  Pencil,
  Trash2,
  Info,
  CalendarDays,
  Leaf,
  Layers,
  Clock3,
} from "lucide-react";
import {
  localDate,
  readingDate,
  formatReadingDate,
  validCalendarDate,
  compareReadingDates,
  books,
  verses,
  parsePassage,
  rangeLabel,
  rangeCount,
  deriveStats,
  sampleReadings,
  reference,
  type Range,
} from "./domain";
import {
  DEFAULT_JOURNAL_ID,
  defaultJournal,
  aggregateStats,
  journalScopeIds,
  journalReadings,
  validateJournalName,
  deserializeJournals,
  mergeJournalImport,
  describeConflict,
  type TrashEntry,
  type Journal,
  type JournalReading as Reading,
  type JournalImport,
  type JournalState,
} from "./journals";
import { periodBounds, inPeriod, nextCalendarRefresh } from "./periods";
import {
  recencyRefreshDelay,
  clockContext,
  recencySignature,
} from "./recencyClock";
import { MetricLegend } from "./MetricLegend";
import {
  ConflictError,
  repository,
  storageChannel,
  storageClientId,
  type UndoOpportunity,
} from "./storage";
import { Heatmap } from "./Heatmap";
import "./styles.css";
const dateLocal = localDate;
const formatDate = formatReadingDate;
const pretty = (n: number) => n.toLocaleString();
type ReadingConflict = {
  kind: string;
  stored?: Reading;
  attempted?: Reading;
  forDelete?: boolean;
};
function App() {
  const [allReadings, setReadings] = useState<Reading[]>([]),
    [ready, setReady] = useState(false),
    [storageReady, setStorageReady] = useState(false),
    [page, setPage] = useState("map"),
    [metric, setMetric] = useState("combined"),
    [layout, setLayout] = useState("continuous"),
    [zoom, setZoom] = useState(4),
    [book, setBook] = useState("all"),
    [chapter, setChapter] = useState("all"),
    [scopeText, setScopeText] = useState(""),
    [scopeRange, setScopeRange] = useState<Range | null>(null),
    [scopeError, setScopeError] = useState(""),
    [sample, setSample] = useState(false),
    [toast, setToast] = useState(""),
    [error, setError] = useState(""),
    [modal, setModal] = useState(false),
    [editing, setEditing] = useState<Reading | null>(null),
    [editingUpdatedAt, setEditingUpdatedAt] = useState<string | null>(null),
    [input, setInput] = useState(""),
    [date, setDate] = useState(dateLocal()),
    [notes, setNotes] = useState(""),
    [formError, setFormError] = useState(""),
    [saving, setSaving] = useState(false),
    [selected, setSelected] = useState<number | null>(null),
    [historyQuery, setHistoryQuery] = useState(""),
    [importPreview, setImportPreview] = useState<JournalImport | null>(null),
    [confirmDelete, setConfirmDelete] = useState<Reading | null>(null),
    [confirmReset, setConfirmReset] = useState(false),
    [resetReadingIds, setResetReadingIds] = useState<string[]>([]),
    [resetJournal, setResetJournal] = useState<Journal | null>(null),
    [about, setAbout] = useState(false),
    [conflict, setConflict] = useState<ReadingConflict | null>(null);
  const [undos, setUndos] = useState<
    (UndoOpportunity & { label: string; error?: string })[]
  >([]);
  const [transfer, setTransfer] = useState<Reading | null>(null);
  const [transferMode, setTransferMode] = useState("move");
  const [copyId, setCopyId] = useState("");
  const [destination, setDestination] = useState("");
  const [transferError, setTransferError] = useState("");
  const [trash, setTrash] = useState<TrashEntry[]>([]);
  const [trashDestination, setTrashDestination] = useState<
    Record<string, string>
  >({});
  const [purgeEntry, setPurgeEntry] = useState<TrashEntry | null>(null);
  const [trashError, setTrashError] = useState("");
  const [inspectText, setInspectText] = useState("");
  const [inspectError, setInspectError] = useState("");
  const [inspectedVerse, setInspectedVerse] = useState(0);
  const [backup, setBackup] = useState<JournalState["backup"]>();
  const [hasUnexportedChanges, setHasUnexportedChanges] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [undoNow, setUndoNow] = useState(Date.now());
  useEffect(() => {
    if (!undos.length) return;
    const timer = setInterval(() => setUndoNow(Date.now()), 250);
    return () => clearInterval(timer);
  }, [undos.length]);
  function offerUndo(undo: UndoOpportunity, label: string) {
    setUndoNow(Date.now());
    setUndos((entries) => [
      ...entries.filter((entry) => entry.expiresAt > Date.now()),
      { ...undo, label },
    ]);
  }
  async function undoDeletion(id: string) {
    if (saving) return;
    setSaving(true);
    try {
      applyState(await repository.undo(id));
      setUndos((entries) => entries.filter((entry) => entry.id !== id));
      setToast("Readings restored.");
    } catch (e) {
      setUndos((entries) =>
        entries.map((entry) =>
          entry.id === id ? { ...entry, error: (e as Error).message } : entry,
        ),
      );
    } finally {
      setSaving(false);
    }
  }
  const [journals, setJournals] = useState<Journal[]>([defaultJournal()]),
    [activeJournalId, setActiveJournalId] = useState(DEFAULT_JOURNAL_ID),
    [journalDialog, setJournalDialog] = useState(false),
    [journalEditing, setJournalEditing] = useState<Journal | null>(null),
    [journalName, setJournalName] = useState(""),
    [journalError, setJournalError] = useState("");
  const [deleteJournal, setDeleteJournal] = useState<Journal | null>(null);
  const [deleteJournalError, setDeleteJournalError] = useState("");
  const [manageJournals, setManageJournals] = useState(false);
  const [archivedViewId, setArchivedViewId] = useState<string | null>(null);
  const readOnly = !!archivedViewId;
  const viewJournalId = archivedViewId || activeJournalId;
  const [journalScopeMode, setJournalScopeMode] = useState("single");
  const [selectedJournalIds, setSelectedJournalIds] = useState<string[]>([
    DEFAULT_JOURNAL_ID,
  ]);
  const scopeJournalIds = journalScopeIds(
    journals,
    archivedViewId ? "single" : journalScopeMode,
    viewJournalId,
    selectedJournalIds,
  );
  const destinationJournal =
    journals.find((j) => j.id === activeJournalId) || journals[0];
  const destinationReadings = journalReadings(allReadings, activeJournalId);
  const currentJournal =
    journals.find((j) => j.id === viewJournalId) || journals[0];
  const readings = useMemo(
    () => allReadings.filter((r) => scopeJournalIds.includes(r.journalId)),
    [allReadings, scopeJournalIds.join("|")],
  );
  const currentState: JournalState = {
    journals,
    readings: allReadings,
    activeJournalId,
  };
  const importPlan = importPreview
    ? mergeJournalImport(currentState, importPreview)
    : null;
  const fileRef = useRef<HTMLInputElement>(null);
  function applyState(state: JournalState) {
    setTrash(state.trash || []);
    setBackup(state.backup);
    setHasUnexportedChanges(state.hasUnexportedChanges ?? true);
    setArchivedViewId((id) =>
      state.journals.some((j) => j.id === id && j.archived) ? id : null,
    );
    setReadings(state.readings);
    setJournals(state.journals);
    setActiveJournalId(state.activeJournalId);
    setSample(false);
  }
  function handleConflict(e: unknown, forDelete = false): boolean {
    if (!(e instanceof ConflictError)) return false;
    const stored =
      e.stored && "ranges" in e.stored ? (e.stored as Reading) : undefined;
    const attempted =
      e.attempted && "ranges" in e.attempted
        ? (e.attempted as Reading)
        : undefined;
    setConflict({ kind: e.kind, stored, attempted, forDelete });
    return true;
  }
  async function runWrite<T>(
    work: () => Promise<T>,
    onOk: (result: T) => void,
    forDelete = false,
  ) {
    if (saving || !storageReady) return false;
    setSaving(true);
    try {
      const result = await work();
      onOk(result);
      return true;
    } catch (e) {
      if (handleConflict(e, forDelete)) {
        setError("");
        return false;
      }
      setError(
        `Your change could not be saved. Your existing journals and readings have been kept. ${e instanceof Error ? e.message : "Check browser storage permissions."}`,
      );
      return false;
    } finally {
      setSaving(false);
    }
  }
  useEffect(() => {
    repository
      .load()
      .then((x) => {
        applyState(x);
        setStorageReady(true);
        setReady(true);
      })
      .catch((e) => {
        setError(
          e instanceof Error && e.message.startsWith("Close other")
            ? e.message
            : "Browser storage could not be opened. Enable IndexedDB to save readings.",
        );
        setReady(true);
      });
    if ("serviceWorker" in navigator)
      navigator.serviceWorker.register("/sw.js").catch(() => {});
  }, []);
  useEffect(() => {
    const channel = storageChannel();
    if (!channel) return;
    channel.onmessage = (event) => {
      if (event.data?.source === storageClientId) return;
      repository
        .load()
        .then((state) => {
          applyState(state);
          if (modal && editing) {
            const remote = state.readings.find((r) => r.id === editing.id);
            if (!remote)
              setConflict(
                (c) => c || { kind: "reading-deleted", attempted: editing },
              );
            else if (editingUpdatedAt && remote.updatedAt !== editingUpdatedAt)
              setConflict(
                (c) =>
                  c || {
                    kind: "reading-updated",
                    stored: remote,
                    attempted: editing,
                  },
              );
          }
          if (journalDialog && journalEditing) {
            const remote = state.journals.find(
              (j) => j.id === journalEditing.id,
            );
            if (!remote)
              setJournalError("This journal was deleted in another tab.");
            else if (remote.updatedAt !== journalEditing.updatedAt)
              setJournalError(describeConflict("journal-updated"));
          }
        })
        .catch(() => {});
    };
    return () => channel.close();
  }, [modal, editing, editingUpdatedAt, journalDialog, journalEditing]);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 4500);
    return () => clearTimeout(t);
  }, [toast]);
  const [timeNow, setTimeNow] = useState(Date.now());
  const today = dateLocal(new Date(timeNow));
  const timeContext = clockContext(timeNow);
  const [periodMode, setPeriodMode] = useState("all");
  const [periodFrom, setPeriodFrom] = useState(dateLocal());
  const [periodTo, setPeriodTo] = useState(dateLocal());
  const [appliedPeriod, setAppliedPeriod] = useState({
    from: dateLocal(),
    to: dateLocal(),
  });
  const [periodError, setPeriodError] = useState("");
  const period = periodBounds(
    periodMode,
    today,
    appliedPeriod.from,
    appliedPeriod.to,
  );
  const unfilteredStats = useMemo(
    () => deriveStats(sample ? [] : readings),
    [readings, sample, timeContext],
  );
  const demo = useMemo(
      () =>
        sampleReadings().map((r) => ({ ...r, journalId: DEFAULT_JOURNAL_ID })),
      [],
    ),
    active = useMemo(
      () => (sample ? demo : readings).filter((r) => inPeriod(r, period)),
      [sample, demo, readings, period.from, period.to, today, timeContext],
    ),
    stats = useMemo(
      () =>
        !archivedViewId && journalScopeMode !== "single" && !sample
          ? aggregateStats(active)
          : deriveStats(active),
      [active, journalScopeMode, archivedViewId, sample, timeContext],
    ),
    sorted = useMemo(
      () =>
        [...active].sort((a, b) =>
          compareReadingDates(b.startedAt, a.startedAt),
        ),
      [active, timeContext],
    );
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    let signature = recencySignature(stats, timeNow, metric),
      context = clockContext(timeNow);
    const refresh = () => {
      const now = Date.now(),
        nextSignature = recencySignature(stats, now, metric),
        nextContext = clockContext(now);
      if (nextSignature !== signature || nextContext !== context)
        setTimeNow(now);
      signature = nextSignature;
      context = nextContext;
      clearTimeout(timer);
      timer = setTimeout(refresh, recencyRefreshDelay(stats, now, metric));
    };
    const foreground = () => {
      if (document.visibilityState === "visible") refresh();
    };
    refresh();
    document.addEventListener("visibilitychange", foreground);
    window.addEventListener("focus", refresh);
    return () => {
      clearTimeout(timer);
      document.removeEventListener("visibilitychange", foreground);
      window.removeEventListener("focus", refresh);
    };
  }, [stats, metric, timeNow]);
  const scope: Range =
    scopeRange ||
    (book === "all"
      ? { start: 0, end: verses.length - 1 }
      : chapter === "all"
        ? books[+book]
        : books[+book].chapters[+chapter - 1]);
  useEffect(
    () =>
      setInspectedVerse((id) => Math.max(scope.start, Math.min(scope.end, id))),
    [scope.start, scope.end],
  );
  const viewed = stats.slice(scope.start, scope.end + 1),
    covered = viewed.filter((s) => s.count).length,
    total = viewed.length,
    interactions = viewed.reduce((sum, s) => sum + s.count, 0),
    bookStats = useMemo(
      () =>
        books.map((b) => ({
          ...b,
          read: stats.slice(b.start, b.end + 1).filter((s) => s.count).length,
          visits: stats
            .slice(b.start, b.end + 1)
            .reduce((a, s) => a + s.count, 0),
        })),
      [stats],
    );
  const parsed = useMemo(() => {
    try {
      return { ranges: parsePassage(input), error: "" };
    } catch (e) {
      return { ranges: [] as Range[], error: (e as Error).message };
    }
  }, [input]);
  function buildDraft(id?: string): Reading | null {
    if (!parsed.ranges.length) return null;

    if (!date || !validCalendarDate(date) || date > dateLocal()) return null;
    const now = new Date().toISOString();
    return {
      id: id || editing?.id || crypto.randomUUID(),
      journalId: editing?.journalId || activeJournalId,
      startedAt:
        editing && readingDate(editing.startedAt) === date
          ? editing.startedAt
          : date,
      datePrecision:
        editing && readingDate(editing.startedAt) === date
          ? editing.datePrecision
          : "date",
      ...(editing?.legacyStartedAt
        ? { legacyStartedAt: editing.legacyStartedAt }
        : {}),
      createdAt: editing?.createdAt || now,
      updatedAt: now,
      originalInput: input.trim(),
      notes: notes.trim(),
      ranges: parsed.ranges,
    };
  }
  async function switchJournal(id: string) {
    setArchivedViewId(null);
    if (saving || !storageReady || id === activeJournalId) return;
    setSaving(true);
    try {
      await repository.selectJournal(id);
      setActiveJournalId(id);
      setSample(false);
      setHistoryQuery("");
      setSelected(null);
      resetScope();
    } catch {
      setError("Could not switch journals. Check browser storage permissions.");
    } finally {
      setSaving(false);
    }
  }
  function openJournalEditor(journal: Journal | null = null) {
    if (!storageReady) return;
    setJournalEditing(journal);
    setJournalName(journal?.name || "");
    setJournalError("");
    setJournalDialog(true);
  }
  async function saveJournal(e: React.FormEvent) {
    e.preventDefault();
    let name: string;
    try {
      name = validateJournalName(journalName, journals, journalEditing?.id);
    } catch (e) {
      setJournalError((e as Error).message);
      return;
    }
    const now = new Date().toISOString();
    const journal: Journal = {
      id: journalEditing?.id || crypto.randomUUID(),
      name,
      createdAt: journalEditing?.createdAt || now,
      updatedAt: now,
    };
    if (
      await runWrite(
        () =>
          repository.putJournal(
            journal,
            journalEditing ? journalEditing.updatedAt : null,
          ),
        (state) => {
          applyState(state);
          setToast(
            journalEditing ? "Journal renamed." : `“${name}” journal created.`,
          );
        },
      )
    ) {
      setJournalDialog(false);
      setHistoryQuery("");
      resetScope();
    }
  }
  function openLog(r: Reading | null = null, prefill = "") {
    if (
      !storageReady ||
      readOnly ||
      (r && journals.find((j) => j.id === r.journalId)?.archived)
    )
      return;
    setSample(false);
    setEditing(r);
    setEditingUpdatedAt(r?.updatedAt || null);
    setConflict(null);
    setInput(r?.originalInput || prefill);
    setDate(r ? readingDate(r.startedAt) : dateLocal());
    setNotes(r?.notes || "");
    setFormError("");
    setModal(true);
  }
  async function saveReading(e: React.FormEvent) {
    e.preventDefault();
    if (!parsed.ranges.length) {
      setFormError(parsed.error);
      return;
    }

    if (!date || !validCalendarDate(date) || date > dateLocal()) {
      setFormError("Choose a valid reading date, today or earlier.");
      return;
    }
    const r = buildDraft()!;
    if (
      await runWrite(
        () => repository.putReading(r, editing ? editingUpdatedAt : null),
        (state) => {
          applyState(state);
          setToast(
            editing
              ? "Reading updated."
              : `Reading saved in “${currentJournal.name}”.`,
          );
          setConflict(null);
        },
      )
    )
      setModal(false);
  }
  async function overwriteReading() {
    const base = conflict?.attempted || buildDraft();
    if (!base || !conflict?.stored) return;
    const r = {
      ...base,
      id: conflict.stored.id,
      createdAt: conflict.stored.createdAt,
      journalId: conflict.stored.journalId,
      updatedAt: new Date().toISOString(),
    };
    if (
      await runWrite(
        () => repository.putReading(r, conflict.stored!.updatedAt),
        (state) => {
          applyState(state);
          setToast("Reading updated.");
          setConflict(null);
        },
      )
    )
      setModal(false);
  }
  async function saveReadingAsNew() {
    const r = buildDraft(crypto.randomUUID());
    if (!r) {
      setFormError(
        parsed.error || "Choose a valid reading date, today or earlier.",
      );
      return;
    }
    if (
      await runWrite(
        () => repository.putReading(r, null),
        (state) => {
          applyState(state);
          setToast(`Reading saved in “${currentJournal.name}”.`);
          setConflict(null);
          setEditing(null);
          setEditingUpdatedAt(null);
        },
      )
    )
      setModal(false);
  }
  function discardConflict() {
    if (conflict?.stored) {
      setEditing(conflict.stored);
      setEditingUpdatedAt(conflict.stored.updatedAt);
      setInput(conflict.stored.originalInput);
      setDate(readingDate(conflict.stored.startedAt));
      setNotes(conflict.stored.notes);
    } else {
      setModal(false);
      setEditing(null);
      setEditingUpdatedAt(null);
    }
    setConflict(null);
  }
  async function exportData() {
    if (!storageReady || exporting) return;
    setExporting(true);
    try {
      applyState(
        await repository.exportAll((json) => {
          const url = URL.createObjectURL(
            new Blob([json], { type: "application/json" }),
          );
          try {
            const a = document.createElement("a");
            a.href = url;
            a.download = `jot-and-tittle-${dateLocal()}.json`;
            a.click();
          } finally {
            setTimeout(() => URL.revokeObjectURL(url), 1000);
          }
        }),
      );
      setToast("Backup download initiated. Check that the file was saved.");
    } catch {
      setError(
        "Could not complete the backup or record its status. Please try exporting again.",
      );
    } finally {
      setExporting(false);
    }
  }
  async function importFile(file?: File) {
    if (!file) return;
    try {
      setImportPreview(deserializeJournals(JSON.parse(await file.text())));
    } catch (e) {
      setError((e as Error).message);
    }
    if (fileRef.current) fileRef.current.value = "";
  }
  async function applyImport() {
    if (!importPreview) return;
    await runWrite(
      () => repository.mergeImport(importPreview),
      (result) => {
        applyState(result.state);
        setToast(
          `${result.addedReadings} readings and ${result.addedJournals} journals imported.`,
        );
        setImportPreview(null);
      },
    );
  }
  async function confirmDeleteReading() {
    if (!confirmDelete) return;
    if (
      await runWrite(
        () =>
          repository.deleteReading(confirmDelete.id, confirmDelete.updatedAt),
        (state) => {
          applyState(state);
          offerUndo(state.undo, "Reading deleted.");
          setConflict(null);
          setConfirmDelete(null);
        },
        true,
      )
    ) {
      setConfirmDelete(null);
    }
  }
  async function deleteDespiteConflict() {
    if (!conflict?.stored || !conflict.forDelete) return;
    if (
      await runWrite(
        () =>
          repository.deleteReading(
            conflict.stored!.id,
            conflict.stored!.updatedAt,
          ),
        (state) => {
          applyState(state);
          offerUndo(state.undo, "Reading deleted.");
          setConflict(null);
          setConfirmDelete(null);
        },
        true,
      )
    )
      setConfirmDelete(null);
  }
  async function confirmResetJournal() {
    if (
      await runWrite(
        () =>
          repository.resetJournal(
            resetJournal?.id || activeJournalId,
            resetReadingIds,
          ),
        (state) => {
          applyState(state);
          offerUndo(
            state.undo,
            `“${currentJournal.name}” readings cleared (${state.undo.count}).`,
          );
        },
      )
    ) {
      setConfirmReset(false);
      setResetReadingIds([]);
    }
  }
  function applyScope() {
    try {
      const rs = parsePassage(scopeText);
      if (rs.length !== 1)
        throw new Error("Focus on one continuous passage at a time.");
      setScopeRange(rs[0]);
      setScopeError("");
      setSelected(null);
    } catch (e) {
      setScopeError((e as Error).message);
    }
  }
  function resetScope() {
    setBook("all");
    setChapter("all");
    setScopeRange(null);
    setScopeText("");
    setScopeError("");
  }
  const scopeName = scopeRange
    ? rangeLabel(scopeRange)
    : book === "all"
      ? "The whole Bible"
      : books[+book].name + (chapter === "all" ? "" : ` ${chapter}`);
  const coverage = total ? (covered / total) * 100 : 0;
  return (
    <div className="app">
      <aside className="sidebar">
        <a
          className="brand"
          href="#"
          onClick={(e) => {
            e.preventDefault();
            setPage("map");
          }}
        >
          <span className="brand-mark">
            <i />
            <i />
            <i />
            <i />
            <i />
            <i />
            <i />
            <i />
            <i />
          </span>
          <span>
            jot <em>&</em> tittle
            <span className="brand-caption">A MAP OF YOUR READING</span>
          </span>
        </a>
        <div className="workspace journal-workspace">
          <span className="workspace-avatar">
            <BookOpen size={15} />
          </span>
          <label className="journal-picker">
            <span>YOUR JOURNAL</span>
            <select
              aria-label="Current journal"
              title={currentJournal.name}
              value={activeJournalId}
              disabled={!storageReady || saving}
              onChange={(e) => switchJournal(e.target.value)}
            >
              {journals
                .filter((j) => !j.archived)
                .map((j) => (
                  <option key={j.id} value={j.id}>
                    {j.name}
                  </option>
                ))}
            </select>
          </label>
          <button
            className="icon-btn"
            aria-label="Create a journal"
            title="Create a journal"
            disabled={!storageReady || saving}
            onClick={() => openJournalEditor()}
          >
            <Plus size={16} />
          </button>
        </div>
        <div className="nav-label">YOUR SCRIPTURE, MAPPED</div>
        <nav>
          {[
            { id: "map", icon: Grid2X2, label: "Verse map" },
            { id: "history", icon: BookOpen, label: "Reading history" },
            {
              id: "insights",
              icon: ChartNoAxesColumnIncreasing,
              label: "Reading patterns",
            },
            { id: "data", icon: HardDrive, label: "Your data" },
          ].map(({ id, icon: Icon, label }) => (
            <button
              key={id}
              aria-current={page === id ? "page" : undefined}
              className={`nav-item ${page === id ? "active" : ""}`}
              onClick={() => setPage(id)}
            >
              <Icon size={18} />
              {label}
              {id === "map" && <span className="nav-dot" />}
            </button>
          ))}
        </nav>
        <div className="sidebar-note">
          <div className="tiny-grid">
            {Array.from({ length: 35 }, (_, i) => (
              <i
                key={i}
                style={{
                  background: ["#d9e3ca", "#b0c88b", "#779954", "#e8eadf"][
                    i % 4
                  ],
                }}
              />
            ))}
          </div>
          <p>
            Every verse.
            <br />A little more visible.
          </p>
          <span>
            A record of where you’ve been,
            <br />
            and room to see what’s next.
          </span>
        </div>
        <div className="sidebar-bottom">
          <div className="local-status">
            <span /> Local-first, always yours
          </div>
          <button onClick={() => setAbout(true)}>
            About Jot & Tittle <ArrowUpRight size={13} />
          </button>
          <small>Made for attention, not achievement.</small>
        </div>
      </aside>
      <main>
        <header className="topbar">
          <div>
            <span className="breadcrumb" title={currentJournal.name}>
              {currentJournal.name}
            </span>
            <ChevronRight size={12} />
            <span>
              {page === "map"
                ? "Verse map"
                : page === "history"
                  ? "Reading history"
                  : page === "insights"
                    ? "Reading patterns"
                    : "Your data"}
            </span>
          </div>
          <div className="top-actions">
            <span>
              <ShieldCheck size={14} /> Stored on your device
            </span>
            <button
              className="primary small"
              onClick={() => openLog()}
              disabled={!storageReady}
            >
              <Plus size={16} /> Log a reading
            </button>
          </div>
        </header>
        {undos.length > 0 && (
          <aside className="undo-notices" aria-label="Reading recovery">
            {undos.map((entry) => (
              <div className="undo-notice" key={entry.id}>
                <span role="status">
                  {entry.label}{" "}
                  {entry.expiresAt > undoNow
                    ? `Undo available for ${Math.ceil((entry.expiresAt - undoNow) / 1000)}s.`
                    : "Undo expired."}
                </span>
                {entry.expiresAt > undoNow && (
                  <button
                    disabled={saving}
                    onClick={() => undoDeletion(entry.id)}
                  >
                    Undo
                  </button>
                )}
                <button
                  aria-label={`Dismiss: ${entry.label}`}
                  onClick={() =>
                    setUndos((entries) =>
                      entries.filter((item) => item.id !== entry.id),
                    )
                  }
                >
                  Dismiss
                </button>
                {entry.error && <p role="alert">{entry.error}</p>}
              </div>
            ))}
            <p>
              30-second recovery, in this tab only. Navigation keeps Undo;
              reload or closing this tab ends it.
            </p>
          </aside>
        )}

        <div className="content">
          <section className="panel" aria-label="Calendar filters">
            <label>
              Reading period
              <select
                aria-label="Reading period"
                value={periodMode}
                onChange={(e) => {
                  setPeriodMode(e.target.value);
                  setPeriodError("");
                }}
              >
                <option value="all">All time</option>
                <option value="month">This month</option>
                <option value="year">This year</option>
                <option value="custom">Custom dates</option>
              </select>
            </label>
            {periodMode === "custom" && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  try {
                    periodBounds("custom", today, periodFrom, periodTo);
                    setAppliedPeriod({ from: periodFrom, to: periodTo });
                    setPeriodError("");
                  } catch (e) {
                    setPeriodError((e as Error).message);
                  }
                }}
              >
                <label>
                  Start date
                  <input
                    type="date"
                    value={periodFrom}
                    onChange={(e) => setPeriodFrom(e.target.value)}
                  />
                </label>
                <label>
                  End date
                  <input
                    type="date"
                    value={periodTo}
                    onChange={(e) => setPeriodTo(e.target.value)}
                  />
                </label>
                <button>Apply dates</button>
              </form>
            )}
            {periodError && <p role="alert">{periodError}</p>}
            <p>
              Applied period:{" "}
              {period.from
                ? `${period.from} through ${period.to} (inclusive)`
                : "All time"}
              . Recency is measured relative to today, {today}, in this
              browser’s timezone. Known times use their local calendar date.
            </p>
            {periodMode !== "all" && !active.length && (
              <p role="status">No readings in this period.</p>
            )}
          </section>
          <section className="panel" aria-label="Journal view scope">
            <label>
              View journals
              <select
                aria-label="View journals"
                value={journalScopeMode}
                onChange={(e) => setJournalScopeMode(e.target.value)}
              >
                <option value="single">Current journal</option>
                <option value="all">All active journals</option>
                <option value="selected">Selected journals</option>
              </select>
            </label>
            {journalScopeMode === "selected" && (
              <fieldset>
                <legend>Journals to include (archives are read-only)</legend>
                {journals.map((j) => (
                  <label key={j.id}>
                    <input
                      type="checkbox"
                      checked={selectedJournalIds.includes(j.id)}
                      onChange={(e) =>
                        setSelectedJournalIds((ids) =>
                          e.target.checked
                            ? [...ids, j.id]
                            : ids.filter((id) => id !== j.id),
                        )
                      }
                    />
                    {j.name}
                    {j.archived ? " (archived)" : ""}
                  </label>
                ))}
              </fieldset>
            )}
            <p>
              Viewing:{" "}
              {scopeJournalIds
                .map((id) => journals.find((j) => j.id === id)?.name)
                .join(", ") || "No journals selected"}
              . New readings go to{" "}
              {journals.find((j) => j.id === activeJournalId)?.name}. Aggregate
              metrics count each encounter once per verse; history shows each
              journal record.
            </p>
            {!scopeJournalIds.length && (
              <p role="status">Select at least one journal to see readings.</p>
            )}
          </section>
          {readOnly && (
            <p role="status">
              Archived journal · read-only.{" "}
              <button onClick={() => setManageJournals(true)}>
                Manage journals
              </button>
              <button onClick={() => setArchivedViewId(null)}>
                Return to active journal
              </button>
            </p>
          )}
          <div className="journal-context">
            <span>
              <BookOpen size={13} />
              {currentJournal.name}
              <small>{readings.length} readings</small>
            </span>
            <div>
              <button
                disabled={!storageReady || saving}
                onClick={() => openJournalEditor(currentJournal)}
              >
                <Pencil size={12} /> Rename
              </button>
              <button
                disabled={!storageReady || saving}
                onClick={() => openJournalEditor()}
              >
                <Plus size={13} /> New journal
              </button>
            </div>
          </div>
          <div className="page-heading">
            <div>
              <div className="eyebrow">
                {page === "map"
                  ? "THE BIG PICTURE"
                  : page === "history"
                    ? "A RECORD OF YOUR READING"
                    : page === "insights"
                      ? "LOOK A LITTLE CLOSER"
                      : "LOCAL-FIRST BY DESIGN"}
              </div>
              <h1>
                {page === "map"
                  ? "See where you’ve been."
                  : page === "history"
                    ? "Your reading history."
                    : page === "insights"
                      ? "Patterns, made visible."
                      : "Your reading. Your data."}
              </h1>
              <p>
                {page === "map"
                  ? "Every square is a verse. Together, they tell the story of your reading."
                  : page === "history"
                    ? "The passages you’ve read, one reading at a time."
                    : page === "insights"
                      ? "Explore the places you return to and the parts you’ve yet to record."
                      : "Private by default. Portable whenever you need it."}
              </p>
            </div>
            <button className="quiet" onClick={() => setAbout(true)}>
              <Info size={16} /> How it works
            </button>
          </div>
          {error && (
            <div className="error-banner" role="alert">
              {error}
              <button aria-label="Dismiss error" onClick={() => setError("")}>
                <X size={16} />
              </button>
            </div>
          )}
          {sample && (
            <div className="sample-banner">
              <span>
                <Leaf size={16} /> You’re exploring sample readings. Your
                personal history is separate.
              </span>
              <button onClick={() => setSample(false)}>
                Return to my readings <X size={14} />
              </button>
            </div>
          )}
          {page === "map" && (
            <>
              <section className="stats-row">
                <div className="stat">
                  <div>
                    VERSES RECORDED <Grid2X2 size={15} />
                  </div>
                  <strong>
                    {pretty(covered)} <small>/ {pretty(total)}</small>
                  </strong>
                  <span>
                    {covered
                      ? `${coverage.toFixed(1)}% of ${book === "all" && !scopeRange ? "the Bible" : "this passage"} in your history`
                      : "Your map begins with your first reading"}
                  </span>
                </div>
                <div className="stat">
                  <div>
                    READING SESSIONS <BookOpen size={15} />
                  </div>
                  <strong>{pretty(active.length)}</strong>
                  <span>
                    {active.length
                      ? `Since ${formatDate([...active].sort((a, b) => compareReadingDates(a.startedAt, b.startedAt))[0].startedAt)}`
                      : "A place for each time you read"}
                  </span>
                </div>
                <div className="stat">
                  <div>
                    LAST READING <Clock3 size={15} />
                  </div>
                  <strong className="date-stat">
                    {sorted[0]
                      ? formatDate(sorted[0].startedAt)
                      : "A fresh page"}
                  </strong>
                  <span>
                    {sorted[0]
                      ? sorted[0].ranges.map(rangeLabel).join("; ")
                      : "Record a passage whenever you’re ready"}
                  </span>
                </div>
              </section>
              <section className="map-card">
                <div className="map-heading">
                  <div>
                    <h2>
                      Your verse map <span>{pretty(total)} verses</span>
                    </h2>
                    <p>Small marks. A view of the whole.</p>
                  </div>
                  <div
                    className="segmented metric-tabs"
                    role="group"
                    aria-label="Map metric"
                  >
                    <button
                      aria-pressed={metric === "combined"}
                      className={metric === "combined" ? "chosen" : ""}
                      onClick={() => setMetric("combined")}
                    >
                      <Leaf size={14} /> Combined
                    </button>
                    <button
                      aria-pressed={metric === "recency"}
                      className={metric === "recency" ? "chosen" : ""}
                      onClick={() => setMetric("recency")}
                    >
                      <Clock3 size={14} /> Recency
                    </button>
                    <button
                      aria-pressed={metric === "frequency"}
                      className={metric === "frequency" ? "chosen" : ""}
                      onClick={() => setMetric("frequency")}
                    >
                      <ChartNoAxesColumnIncreasing size={14} /> Frequency
                    </button>
                  </div>
                </div>
                <div className="map-toolbar">
                  <div className="scope-controls">
                    <label>
                      <BookOpen size={14} />
                      <select
                        aria-label="Book scope"
                        value={book}
                        onChange={(e) => {
                          setBook(e.target.value);
                          setChapter("all");
                          setScopeRange(null);
                          setScopeText("");
                        }}
                      >
                        <option value="all">Whole Bible</option>
                        {books.map((b) => (
                          <option key={b.index} value={b.index}>
                            {b.name}
                          </option>
                        ))}
                      </select>
                      <ChevronDown size={12} />
                    </label>
                    {book !== "all" && (
                      <label>
                        <select
                          aria-label="Chapter scope"
                          value={chapter}
                          onChange={(e) => {
                            setChapter(e.target.value);
                            setScopeRange(null);
                          }}
                        >
                          <option value="all">All chapters</option>
                          {books[+book].chapters.map((_, i) => (
                            <option key={i} value={i + 1}>
                              Chapter {i + 1}
                            </option>
                          ))}
                        </select>
                      </label>
                    )}
                    <form
                      className="scope-search"
                      onSubmit={(e) => {
                        e.preventDefault();
                        applyScope();
                      }}
                    >
                      <Search size={14} />
                      <input
                        aria-label="Focus on a passage"
                        placeholder="Focus on a passage…"
                        value={scopeText}
                        onChange={(e) => setScopeText(e.target.value)}
                      />
                      {scopeText && (
                        <button aria-label="Focus passage">
                          <ArrowRight size={14} />
                        </button>
                      )}
                    </form>
                  </div>
                  <div className="layout-controls">
                    <div className="segmented compact">
                      <button
                        aria-pressed={layout === "continuous"}
                        className={layout === "continuous" ? "chosen" : ""}
                        onClick={() => setLayout("continuous")}
                        title="Responsive, continuous flow"
                      >
                        <Grid2X2 size={13} /> Flow
                      </button>
                      <button
                        aria-pressed={layout === "fixed-grid"}
                        className={layout === "fixed-grid" ? "chosen" : ""}
                        onClick={() => setLayout("fixed-grid")}
                        title="Stable, 160-column canonical grid"
                      >
                        <Layers size={13} /> Fixed
                      </button>
                    </div>
                    <span className="tool-divider" />
                    <button
                      className="icon-btn"
                      aria-label="Zoom out"
                      disabled={zoom <= 4}
                      onClick={() => setZoom((x) => x - 2)}
                    >
                      <Minus size={15} />
                    </button>
                    <button
                      className="icon-btn"
                      aria-label="Zoom in"
                      disabled={zoom >= 14}
                      onClick={() => setZoom((x) => x + 2)}
                    >
                      <Plus size={15} />
                    </button>
                    <button
                      className="icon-btn"
                      aria-label="Reset zoom"
                      onClick={() => setZoom(4)}
                    >
                      <Expand size={14} />
                    </button>
                  </div>
                </div>
                {scopeError && <div className="inline-error">{scopeError}</div>}
                {(book !== "all" || scopeRange) && (
                  <div className="scope-tag">
                    Viewing {scopeName}
                    <button onClick={resetScope}>
                      <X size={12} /> Whole Bible
                    </button>
                  </div>
                )}
                <div className="map-area">
                  {!ready ? (
                    <div className="loading">Opening your reading space…</div>
                  ) : (
                    <Heatmap
                      scope={scope}
                      stats={stats}
                      everStats={unfilteredStats}
                      now={timeNow}
                      metric={metric}
                      layout={layout}
                      zoom={zoom}
                      onInspect={setInspectedVerse}
                      onSelect={(id) => {
                        setInspectedVerse(id);
                        setSelected(id);
                      }}
                    />
                  )}
                </div>
                <div className="map-footer">
                  <span>
                    <span className="dot-square" /> One square, one verse{" "}
                    <span className="footer-separator">·</span> Hover to find
                    your place
                  </span>
                  <section
                    className="text-inspector"
                    aria-label="Textual verse inspection"
                  >
                    <h3>Inspect a verse</h3>
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        try {
                          const ranges = parsePassage(inspectText);
                          if (rangeCount(ranges) !== 1)
                            throw new Error(
                              "Enter one verse, such as John 3:16.",
                            );
                          setInspectedVerse(ranges[0].start);
                          setSelected(ranges[0].start);
                          setInspectError("");
                        } catch (e) {
                          setInspectError((e as Error).message);
                        }
                      }}
                    >
                      <label>
                        Verse reference
                        <input
                          value={inspectText}
                          onChange={(e) => setInspectText(e.target.value)}
                          placeholder="John 3:16"
                        />
                      </label>
                      <button>Inspect verse</button>
                    </form>
                    {inspectError && <p role="alert">{inspectError}</p>}
                    <p role="status" aria-live="polite">
                      {reference(inspectedVerse)} ·{" "}
                      {stats[inspectedVerse].count} recorded readings ·{" "}
                      {stats[inspectedVerse].last
                        ? `Last read ${formatDate(stats[inspectedVerse].last!)}`
                        : unfilteredStats[inspectedVerse].count
                          ? "No readings in this period"
                          : "Never recorded"}
                    </p>
                    <button
                      disabled={inspectedVerse <= scope.start}
                      onClick={() =>
                        setInspectedVerse((id) => Math.max(scope.start, id - 1))
                      }
                    >
                      Previous verse
                    </button>
                    <button
                      disabled={inspectedVerse >= scope.end}
                      onClick={() =>
                        setInspectedVerse((id) => Math.min(scope.end, id + 1))
                      }
                    >
                      Next verse
                    </button>
                    <button onClick={() => setSelected(inspectedVerse)}>
                      Open inspected verse details
                    </button>
                    <p>
                      Arrow keys on the map inspect verses; Home and End jump to
                      the scope boundaries. Enter or tap opens details. Text
                      inspection provides the same counts and dates without
                      using the map.
                    </p>
                  </section>
                  <MetricLegend metric={metric} />
                </div>
              </section>
              <div className="below-map">
                <section className="recent-section">
                  <div className="section-title">
                    <h2>Recent readings</h2>
                    <button onClick={() => setPage("history")}>
                      View history <ArrowRight size={14} />
                    </button>
                  </div>
                  {sorted.length ? (
                    sorted.slice(0, 3).map((r) => (
                      <button
                        className="recent-reading"
                        key={r.id}
                        onClick={() =>
                          sample
                            ? setToast(
                                "Sample readings are read-only. Return to your history to log or edit.",
                              )
                            : openLog(r)
                        }
                      >
                        <span className="reading-icon">
                          <BookOpen size={16} />
                        </span>
                        <div>
                          <strong>{r.ranges.map(rangeLabel).join("; ")}</strong>
                          <span>
                            {journals.find((j) => j.id === r.journalId)?.name}
                          </span>
                          <small>
                            {formatDate(r.startedAt)} <span>·</span>{" "}
                            {pretty(rangeCount(r.ranges))} verses
                          </small>
                        </div>
                        <ChevronRight size={16} />
                      </button>
                    ))
                  ) : (
                    <div className="empty-recent">
                      <BookOpen size={22} />
                      <p>Your readings will appear here.</p>
                      <button onClick={() => openLog()}>
                        Record your first passage <ArrowRight size={14} />
                      </button>
                    </div>
                  )}
                </section>
                <section className="reflection-card">
                  <span className="eyebrow">A LITTLE PERSPECTIVE</span>
                  <h3>A map, not a measure.</h3>
                  <p>
                    These marks describe where you’ve read. They don’t measure
                    your faith, your effort, or your worth.
                  </p>
                  {!active.length ? (
                    <button onClick={() => setSample(true)}>
                      Explore a sample map <ArrowUpRight size={14} />
                    </button>
                  ) : (
                    <button onClick={() => setPage("insights")}>
                      Explore your reading patterns <ArrowUpRight size={14} />
                    </button>
                  )}
                </section>
              </div>
            </>
          )}
          {page === "history" && (
            <section className="panel">
              <div className="section-title">
                <h2>{active.length} reading sessions</h2>
                <div className="history-search">
                  <Search size={15} />
                  <input
                    aria-label="Search reading history"
                    value={historyQuery}
                    onChange={(e) => setHistoryQuery(e.target.value)}
                    placeholder="Search dates, passages or notes"
                  />
                </div>
              </div>
              {sorted
                .filter((r) =>
                  (
                    r.originalInput +
                    " " +
                    r.notes +
                    " " +
                    r.ranges.map(rangeLabel).join(" ") +
                    " " +
                    readingDate(r.startedAt) +
                    " " +
                    formatDate(r.startedAt)
                  )
                    .toLowerCase()
                    .includes(historyQuery.toLowerCase()),
                )
                .map((r) => (
                  <div className="history-row" key={r.id}>
                    <div className="history-date">
                      <CalendarDays size={16} />
                      {formatDate(r.startedAt)}
                    </div>
                    <div className="history-passage">
                      <span>
                        {journals.find((j) => j.id === r.journalId)?.name}
                      </span>
                      <strong>{r.ranges.map(rangeLabel).join("; ")}</strong>
                      <small>
                        {pretty(rangeCount(r.ranges))} unique verses
                        {r.notes && ` · ${r.notes}`}
                      </small>
                    </div>
                    <button
                      className="icon-btn"
                      disabled={
                        sample ||
                        readOnly ||
                        !!journals.find((j) => j.id === r.journalId)?.archived
                      }
                      aria-label={`Move ${r.originalInput}`}
                      onClick={() => {
                        setTransferMode("move");
                        setTransfer(r);
                        setDestination("");
                        setTransferError("");
                      }}
                    >
                      <ArrowRight size={16} />
                    </button>
                    <button
                      className="icon-btn"
                      disabled={
                        sample ||
                        readOnly ||
                        !!journals.find((j) => j.id === r.journalId)?.archived
                      }
                      aria-label={`Copy ${r.originalInput}`}
                      onClick={() => {
                        setTransferMode("copy");
                        setCopyId(crypto.randomUUID());
                        setTransfer(r);
                        setDestination("");
                        setTransferError("");
                      }}
                    >
                      <Layers size={16} />
                    </button>
                    <button
                      className="icon-btn"
                      disabled={
                        sample ||
                        readOnly ||
                        !!journals.find((j) => j.id === r.journalId)?.archived
                      }
                      aria-label={`Edit ${r.originalInput}`}
                      onClick={() => openLog(r)}
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      className="icon-btn"
                      disabled={
                        sample ||
                        readOnly ||
                        !!journals.find((j) => j.id === r.journalId)?.archived
                      }
                      aria-label={`Delete ${r.originalInput}`}
                      onClick={() => setConfirmDelete(r)}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              {!sorted.length && (
                <div className="large-empty">
                  <BookOpen size={32} />
                  <h3>A reading history starts with one passage.</h3>
                  <p>
                    Log a chapter, a few verses, or several passages together.
                  </p>
                  <button className="primary" onClick={() => openLog()}>
                    <Plus size={16} /> Log a reading
                  </button>
                </div>
              )}
              {sorted.length > 0 &&
                !sorted.some((r) =>
                  (
                    r.originalInput +
                    " " +
                    r.notes +
                    " " +
                    r.ranges.map(rangeLabel).join(" ") +
                    " " +
                    readingDate(r.startedAt) +
                    " " +
                    formatDate(r.startedAt)
                  )
                    .toLowerCase()
                    .includes(historyQuery.toLowerCase()),
                ) && <p className="muted">No readings match your search.</p>}
            </section>
          )}
          {page === "insights" && (
            <>
              <section className="stats-row">
                <div className="stat">
                  <div>UNIQUE VERSES</div>
                  <strong>{pretty(stats.filter((s) => s.count).length)}</strong>
                  <span>Verses with at least one recorded reading</span>
                </div>
                <div className="stat">
                  <div>REVISITED VERSES</div>
                  <strong>
                    {pretty(stats.filter((s) => s.count > 1).length)}
                  </strong>
                  <span>Verses recorded in multiple sessions</span>
                </div>
                <div className="stat">
                  <div>VERSE READINGS</div>
                  <strong>
                    {pretty(stats.reduce((a, s) => a + s.count, 0))}
                  </strong>
                  <span>All verse interactions across your sessions</span>
                </div>
              </section>
              <section className="panel">
                <div className="section-title">
                  <h2>Across the books</h2>
                  <span className="muted">
                    Unique verses recorded · canonical order
                  </span>
                </div>
                <div className="book-grid">
                  {bookStats.map((b) => (
                    <button
                      className="book-stat"
                      key={b.index}
                      onClick={() => {
                        setBook(String(b.index));
                        setChapter("all");
                        setScopeRange(null);
                        setPage("map");
                      }}
                    >
                      <div>
                        <strong>{b.name}</strong>
                        <span>
                          {b.read
                            ? `${((b.read / (b.end - b.start + 1)) * 100).toFixed(1)}%`
                            : "—"}
                        </span>
                      </div>
                      <div className="progress">
                        <i
                          style={{
                            width: `${(b.read / (b.end - b.start + 1)) * 100}%`,
                          }}
                        />
                      </div>
                      <small>
                        {pretty(b.read)} of {pretty(b.end - b.start + 1)} verses
                      </small>
                    </button>
                  ))}
                </div>
              </section>
              <section className="panel return-panel">
                <h2>Places you return to</h2>
                <p className="muted">
                  The ten most frequently recorded verses. Ties follow canonical
                  order.
                </p>
                {stats
                  .map((s, i) => ({ ...s, i }))
                  .filter((s) => s.count > 1)
                  .sort((a, b) => b.count - a.count || a.i - b.i)
                  .slice(0, 10)
                  .map((s) => (
                    <button
                      className="return-row"
                      key={s.i}
                      onClick={() => setSelected(s.i)}
                    >
                      <span>{reference(s.i)}</span>
                      <span>
                        {s.count} readings <ChevronRight size={14} />
                      </span>
                    </button>
                  ))}
                {!stats.some((s) => s.count > 1) && (
                  <p className="muted">
                    Repeated readings will appear here as your history grows.
                  </p>
                )}
              </section>
            </>
          )}
          {page === "data" && (
            <>
              <div className="data-banner">
                <ShieldCheck size={24} />
                <div>
                  <h2>At home on your device.</h2>
                  <p>
                    Your history stays in this browser’s IndexedDB storage.
                    There’s no account, cloud sync, or reading telemetry.
                  </p>
                </div>
              </div>
              <div className="data-grid">
                <section className="panel data-card">
                  <Download size={25} />
                  <h2>Personal-data backup</h2>
                  <p role="status" aria-label="Backup status">
                    {backup
                      ? `Most recent export initiated: ${new Date(backup.initiatedAt).toLocaleString()}.`
                      : "No personal-data export initiated yet."}{" "}
                    {hasUnexportedChanges
                      ? "You have unexported changes."
                      : "All current journals and readings match that export."}
                  </p>
                  <p>
                    Download all {allReadings.length} reading sessions across{" "}
                    {journals.length} journals as a readable JSON file,
                    including journal names, dates, passages, and notes.
                  </p>
                  <button
                    className="primary"
                    onClick={exportData}
                    disabled={!storageReady || exporting}
                  >
                    Export all journals <Download size={15} />
                  </button>
                  <p>
                    Initiating a download does not confirm the file was
                    successfully saved. Check your downloads and keep a copy
                    somewhere safe. Browser-local storage can be cleared or
                    evicted.
                  </p>
                </section>
                <section className="panel data-card">
                  <Upload size={25} />
                  <h2>Bring your readings back</h2>
                  <p>
                    Import a Jot & Tittle export. You’ll review the journals and
                    readings before merging them. Older backups are imported
                    into Journal.
                  </p>
                  <button
                    className="secondary"
                    onClick={() => fileRef.current?.click()}
                  >
                    Choose a JSON file <Upload size={15} />
                  </button>
                </section>
              </div>
              <section className="panel">
                <h2>Trash</h2>
                <p>
                  Readings are recoverable for 30 days after deletion, including
                  journal clearing. Trash is excluded from maps, history,
                  statistics, and exports. Restore before exporting a backup.
                  Journal deletion keeps Trash; choose another destination if
                  needed.
                </p>
                {trashError && <p role="alert">{trashError}</p>}
                {!trash.length && <p>Trash is empty.</p>}
                {trash.map((entry) => (
                  <article key={entry.id}>
                    <h3>{entry.readings.length} deleted readings</h3>
                    <p>
                      Deleted {formatDate(entry.deletedAt)} · Expires{" "}
                      {formatDate(entry.expiresAt)}
                    </p>
                    {entry.readings.map((r) => (
                      <p key={r.id}>
                        {r.ranges.map(rangeLabel).join("; ")} ·{" "}
                        {formatDate(r.startedAt)} · {r.notes} · Original
                        journal:{" "}
                        {journals.find((j) => j.id === r.journalId)?.name ||
                          "Removed journal"}
                      </p>
                    ))}
                    <label>
                      Restoration destination
                      <select
                        aria-label={`Restore destination ${entry.id}`}
                        value={trashDestination[entry.id] || ""}
                        onChange={(e) =>
                          setTrashDestination((x) => ({
                            ...x,
                            [entry.id]: e.target.value,
                          }))
                        }
                      >
                        <option value="">
                          Original journal (must be active)
                        </option>
                        {journals
                          .filter((j) => !j.archived)
                          .map((j) => (
                            <option key={j.id} value={j.id}>
                              {j.name}
                            </option>
                          ))}
                      </select>
                    </label>
                    <button
                      disabled={saving}
                      onClick={async () => {
                        if (saving) return;
                        setSaving(true);
                        try {
                          applyState(
                            await repository.restoreTrash(
                              entry.id,
                              trashDestination[entry.id] || undefined,
                            ),
                          );
                          setTrashError("");
                          setUndos((x) => x.filter((u) => u.id !== entry.id));
                        } catch (e) {
                          setTrashError((e as Error).message);
                        } finally {
                          setSaving(false);
                        }
                      }}
                    >
                      Restore deleted readings
                    </button>
                    <button
                      disabled={saving}
                      onClick={() => setPurgeEntry(entry)}
                    >
                      Permanently delete from Trash
                    </button>
                  </article>
                ))}
              </section>
              <section className="panel">
                <h2>Journals</h2>
                <button
                  className="secondary"
                  onClick={() => setManageJournals(true)}
                >
                  Manage journals
                </button>
              </section>
              <section className="panel">
                <h2>About this reading space</h2>
                <dl className="data-details">
                  <div>
                    <dt>Canon</dt>
                    <dd>66-book Protestant canon</dd>
                  </div>
                  <div>
                    <dt>Versification</dt>
                    <dd>protestant-en · KJV verse numbering</dd>
                  </div>
                  <div>
                    <dt>Scripture metadata</dt>
                    <dd>
                      {pretty(verses.length)} verses · {books.length} books ·{" "}
                      {books.reduce((s, b) => s + b.chapters.length, 0)}{" "}
                      chapters
                    </dd>
                  </div>
                  <div>
                    <dt>Data format / database schema</dt>
                    <dd>Version 2 / Version 2</dd>
                  </div>
                  <div>
                    <dt>Offline use</dt>
                    <dd>Available after the first complete online load</dd>
                  </div>
                </dl>
                <p className="data-footnote">
                  Browser data can be cleared by your browser or device. Export
                  a copy whenever you want a durable backup. Each browser and
                  origin has a separate reading space.
                </p>
              </section>
              <section className="panel">
                <h2>Run Jot &amp; Tittle yourself</h2>
                <p className="muted" style={{ margin: "12px 0 18px" }}>
                  This source-code download does not back up your personal data.
                  Download the complete React + TypeScript source, tests, and
                  setup instructions. Run it locally or host the static build on
                  your own website.
                </p>
                <a
                  className="secondary source-link"
                  href="/jot-and-tittle-source.zip"
                  download
                >
                  Download source code <Download size={15} />
                </a>
              </section>
              <section className="panel reset-panel">
                <div>
                  <h2>Clear this journal</h2>
                  <p>
                    Remove all {destinationReadings.length} readings from “
                    {destinationJournal.name}”. Your other journals stay intact.
                    Export a backup first if you want to keep these readings.
                  </p>
                </div>
                <button
                  className="danger-outline"
                  disabled={readOnly || sample || saving}
                  onClick={() => {
                    setResetJournal(destinationJournal);
                    setResetReadingIds(destinationReadings.map((r) => r.id));
                    setConfirmReset(true);
                  }}
                >
                  Clear journal readings
                </button>
              </section>
            </>
          )}
          <footer className="page-footer">
            <span>JOT & TITTLE</span>
            <span>Every verse leaves a mark.</span>
            <button onClick={() => setPage("data")}>
              <ShieldCheck size={12} /> Private. Local. Yours.
            </button>
          </footer>
        </div>
      </main>
      <input
        hidden
        ref={fileRef}
        type="file"
        accept=".json,application/json"
        onChange={(e) => importFile(e.target.files?.[0])}
      />
      {toast && (
        <div className="toast" role="status">
          <Check size={17} />
          {toast}
        </div>
      )}
      {modal && (
        <Dialog
          title={editing ? "Edit your reading" : "Log a reading"}
          onClose={() => setModal(false)}
        >
          <p className="dialog-intro">
            Recording in{" "}
            <strong>
              {
                journals.find(
                  (j) => j.id === (editing?.journalId || activeJournalId),
                )?.name
              }
            </strong>
            . A chapter, a verse, or a few passages.
          </p>
          <form onSubmit={saveReading}>
            <label className="field-label">
              Passage or passages
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="e.g. Romans 8:1–17; Psalm 23"
              />
            </label>
            <small className="field-help">
              Book names or abbreviations. Commas inherit verse context (John
              3:16, 18–21) or chapter context (John 3, 5). Repeat the book or
              use a semicolon to start chapters after verses.
            </small>
            {input && (
              <div
                role={parsed.error ? "alert" : "status"}
                className={
                  parsed.error ? "parse-preview invalid" : "parse-preview"
                }
              >
                {parsed.error ? (
                  <>
                    <Info size={16} />
                    <span>{parsed.error}</span>
                  </>
                ) : (
                  <>
                    <Check size={17} />
                    <div>
                      <strong>
                        {parsed.ranges.map(rangeLabel).join("; ")}
                      </strong>
                      <small>
                        {rangeCount(parsed.ranges)} unique verses recognized
                      </small>
                    </div>
                  </>
                )}
              </div>
            )}
            {editing?.legacyStartedAt && (
              <small>
                Legacy date estimated from UTC. Original timestamp:{" "}
                {editing.legacyStartedAt}. Correct the date below if needed.
              </small>
            )}
            <label className="field-label">
              Reading date
              <input
                type="date"
                value={date}
                max={dateLocal()}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </label>
            <label className="field-label">
              Notes <span>optional</span>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Anything you’d like to remember…"
                rows={3}
              />
            </label>
            {formError && (
              <p className="inline-error" role="alert">
                {formError}
              </p>
            )}
            <div className="dialog-actions">
              <button
                type="button"
                className="secondary"
                onClick={() => setModal(false)}
              >
                Cancel
              </button>
              <button
                className="primary"
                disabled={saving || !parsed.ranges.length}
              >
                {saving ? "Saving…" : editing ? "Save changes" : "Save reading"}
                <Check size={16} />
              </button>
            </div>
            <div className="dialog-private">
              <ShieldCheck size={12} /> Saved only on this device
            </div>
          </form>
        </Dialog>
      )}
      {selected !== null && (
        <Dialog title={reference(selected)} onClose={() => setSelected(null)}>
          <div className="verse-detail">
            <span className="eyebrow">VERSE READING HISTORY</span>
            <strong>
              {stats[selected].count} <small>recorded readings</small>
            </strong>
            <p>
              {stats[selected].last
                ? `Last read ${formatDate(stats[selected].last!)}`
                : unfilteredStats[selected].count
                  ? "No readings in this period."
                  : "Never recorded in these journals."}
            </p>
            {stats[selected].first && (
              <p className="muted">
                First recorded {formatDate(stats[selected].first!)}
              </p>
            )}
          </div>
          <div className="verse-events">
            {sorted
              .filter((r) =>
                r.ranges.some((q) => selected >= q.start && selected <= q.end),
              )
              .map((r) => (
                <div key={r.id}>
                  <span>{formatDate(r.startedAt)}</span>
                  <small>
                    {journals.find((j) => j.id === r.journalId)?.name} ·{" "}
                    {r.ranges.map(rangeLabel).join("; ")}
                  </small>
                </div>
              ))}
          </div>
          <div className="dialog-actions">
            <button
              className="secondary"
              onClick={() => {
                const v = verses[selected];
                setBook(String(v.book));
                setChapter(String(v.chapter));
                setScopeRange(null);
                setSelected(null);
                setPage("map");
              }}
            >
              View chapter
            </button>
            <button
              className="primary"
              onClick={() => {
                const text = reference(selected);
                setSelected(null);
                openLog(null, text);
              }}
            >
              Log this verse <Plus size={15} />
            </button>
          </div>
        </Dialog>
      )}
      {importPreview && importPlan && (
        <Dialog
          title="Review your import"
          onClose={() => setImportPreview(null)}
        >
          <p className="dialog-intro">
            This file contains {importPreview.readings.length} readings across{" "}
            {importPreview.journals.length} journals. {importPlan.duplicates}{" "}
            readings already have matching IDs and will be kept as they are.
          </p>
          <div className="parse-preview">
            <Check size={18} />
            <div>
              <strong>File validated</strong>
              <small>
                Jot & Tittle v{importPreview.legacy ? "1" : "2"} · protestant-en
              </small>
            </div>
          </div>
          {importPreview.legacy && (
            <p className="muted">
              This older backup has no journal information. Its readings will go
              into your default journal, “
              {journals.find((j) => j.id === DEFAULT_JOURNAL_ID)?.name ||
                "Journal"}
              ”.
            </p>
          )}
          <div className="import-journals">
            {importPreview.journals.map((j) => (
              <div key={j.id}>
                <BookOpen size={14} />
                <span>
                  {importPlan.state.journals.find((q) => q.id === j.id)?.name}
                  <small>
                    {
                      importPreview.readings.filter((r) => r.journalId === j.id)
                        .length
                    }{" "}
                    readings ·{" "}
                    {journals.some((q) => q.id === j.id)
                      ? "Existing journal"
                      : "New journal"}
                  </small>
                </span>
              </div>
            ))}
          </div>
          {importPlan.renamedJournals.length > 0 && (
            <p className="muted">
              Separate journals with matching names receive an “imported” suffix
              to keep their tracking separate.
            </p>
          )}
          <p className="muted">
            Add {importPlan.addedReadings} readings and{" "}
            {importPlan.addedJournals} journals. Your existing readings and
            journal names are preserved. Concurrent changes made since this
            preview opened are kept when you merge.
          </p>
          <div className="dialog-actions">
            <button
              className="secondary"
              onClick={() => setImportPreview(null)}
            >
              Cancel
            </button>
            <button className="primary" disabled={saving} onClick={applyImport}>
              Merge journals &amp; readings <Upload size={15} />
            </button>
          </div>
        </Dialog>
      )}

      {conflict && (
        <Dialog
          title="This reading changed elsewhere"
          onClose={() => setConflict(null)}
        >
          <p className="dialog-intro">
            {describeConflict(conflict.kind)}
            {conflict.forDelete
              ? " The delete was not applied."
              : " Your draft is still here and has not been saved."}
          </p>
          {conflict.stored && (
            <div className="conflict-remote">
              <span className="eyebrow">SAVED IN ANOTHER TAB</span>
              <strong>
                {conflict.stored.ranges.map(rangeLabel).join("; ")}
              </strong>
              <small>
                {formatDate(conflict.stored.startedAt)}
                {conflict.stored.notes ? ` · ${conflict.stored.notes}` : ""}
              </small>
            </div>
          )}
          {conflict.kind === "reading-deleted" && !conflict.forDelete && (
            <p className="muted">
              Saving will not recreate the deleted record. Choose “Save as new
              reading” to keep your draft under a new ID.
            </p>
          )}
          {conflict.kind === "reading-deleted" && conflict.forDelete && (
            <p className="muted">
              This reading is already gone. You can dismiss this message.
            </p>
          )}
          <div className="dialog-actions conflict-actions">
            {conflict.forDelete && conflict.stored && (
              <button
                className="danger"
                disabled={saving}
                onClick={deleteDespiteConflict}
              >
                Delete current version
              </button>
            )}
            {!conflict.forDelete && conflict.stored && (
              <button
                className="primary"
                disabled={saving}
                onClick={overwriteReading}
              >
                Keep mine
              </button>
            )}
            {!conflict.forDelete && conflict.kind === "reading-deleted" && (
              <button
                className="primary"
                disabled={saving}
                onClick={saveReadingAsNew}
              >
                Save as new reading
              </button>
            )}
            {!conflict.forDelete && (
              <button
                className="secondary"
                disabled={saving}
                onClick={discardConflict}
              >
                {conflict.stored ? "Use theirs" : "Discard my edit"}
              </button>
            )}
            {conflict.forDelete && conflict.kind === "reading-deleted" && (
              <button
                className="secondary"
                disabled={saving}
                onClick={() => {
                  setConflict(null);
                  setConfirmDelete(null);
                }}
              >
                OK
              </button>
            )}
            <button
              className="secondary"
              disabled={saving}
              onClick={() => setConflict(null)}
            >
              Cancel
            </button>
          </div>
        </Dialog>
      )}

      {(confirmDelete || confirmReset) && (
        <Dialog
          title={
            confirmDelete
              ? "Delete this reading?"
              : `Clear “${resetJournal?.name || destinationJournal.name}”?`
          }
          onClose={() => {
            setConfirmDelete(null);
            setConfirmReset(false);
            setResetReadingIds([]);
          }}
        >
          <p className="dialog-intro">
            {confirmDelete
              ? `${confirmDelete.ranges.map(rangeLabel).join("; ")} · ${formatDate(confirmDelete.startedAt)}`
              : `The ${resetReadingIds.length} readings present when you opened this confirmation will be removed. Readings added afterward in another tab are preserved. Other journals stay intact. Recover these readings from Trash for 30 days.`}
          </p>
          {confirmReset && (
            <button className="secondary" onClick={exportData}>
              <Download size={15} /> Export a backup
            </button>
          )}
          <div className="dialog-actions">
            <button
              className="secondary"
              onClick={() => {
                setConfirmDelete(null);
                setConfirmReset(false);
                setResetReadingIds([]);
              }}
            >
              Cancel
            </button>
            <button
              className="danger"
              disabled={saving}
              onClick={() =>
                confirmDelete ? confirmDeleteReading() : confirmResetJournal()
              }
            >
              {confirmDelete ? "Delete reading" : "Clear journal readings"}
            </button>
          </div>
        </Dialog>
      )}
      {transfer && (
        <Dialog
          title={transferMode === "copy" ? "Copy reading" : "Move reading"}
          onClose={() => setTransfer(null)}
        >
          <p>
            {transferMode === "copy" ? "Copy" : "Move"} {transfer.originalInput}{" "}
            to another journal. The reading keeps its identity, date, passages,
            and notes.
          </p>
          <p>
            Copies share one encounter across journals. Changing a copy’s date
            or passages starts a new encounter. Same-journal copies are
            disabled.
          </p>
          <label>
            Destination journal
            <select
              aria-label="Destination journal"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
            >
              <option value="">Choose a journal</option>
              {journals
                .filter((j) => j.id !== transfer.journalId)
                .map((j) => (
                  <option key={j.id} value={j.id}>
                    {j.name}
                  </option>
                ))}
            </select>
          </label>
          {transferError && <p role="alert">{transferError}</p>}
          <button
            className="primary"
            disabled={!destination || saving}
            onClick={async () => {
              if (saving) return;
              setSaving(true);
              try {
                applyState(
                  await (transferMode === "copy"
                    ? repository.copyReading(
                        transfer.id,
                        transfer.updatedAt,
                        destination,
                        copyId,
                      )
                    : repository.moveReading(
                        transfer.id,
                        transfer.updatedAt,
                        destination,
                      )),
                );
                setTransfer(null);
                setToast(
                  transferMode === "copy"
                    ? "Reading copied."
                    : "Reading moved.",
                );
              } catch (e) {
                setTransferError(
                  e instanceof ConflictError
                    ? describeConflict(e.kind)
                    : (e as Error).message,
                );
              } finally {
                setSaving(false);
              }
            }}
          >
            {transferMode === "copy" ? "Copy reading" : "Move reading"}
          </button>
        </Dialog>
      )}
      {purgeEntry && (
        <Dialog
          title="Permanently delete readings"
          onClose={() => setPurgeEntry(null)}
        >
          <p>
            Permanently remove {purgeEntry.readings.length} readings from Trash.
            This cannot be undone.
          </p>
          <button
            className="danger"
            disabled={saving}
            onClick={async () => {
              if (saving) return;
              setSaving(true);
              try {
                applyState(await repository.purgeTrash(purgeEntry.id));
                setUndos((x) => x.filter((u) => u.id !== purgeEntry.id));
                setPurgeEntry(null);
              } catch (e) {
                setTrashError((e as Error).message);
              } finally {
                setSaving(false);
              }
            }}
          >
            Confirm permanent deletion
          </button>
        </Dialog>
      )}
      {deleteJournal && (
        <Dialog
          title={`Delete journal “${deleteJournal.name}”`}
          onClose={() => setDeleteJournal(null)}
        >
          <p>
            {allReadings.filter((r) => r.journalId === deleteJournal.id).length}{" "}
            active readings are associated with this journal. Journals must be
            empty before deletion. Move readings to another journal, or restore
            an archive and clear its readings first. Archive instead to keep
            this journal.
          </p>
          <p>
            Journal deletion is permanent. Export all journals before
            proceeding. Deleted readings in Trash will require another
            destination if this journal is removed.
          </p>
          <button
            className="secondary"
            onClick={exportData}
            disabled={exporting}
          >
            Export all journals
          </button>
          {deleteJournalError && <p role="alert">{deleteJournalError}</p>}
          <button
            className="danger"
            disabled={
              saving ||
              allReadings.some((r) => r.journalId === deleteJournal.id)
            }
            onClick={async () => {
              if (saving) return;
              setSaving(true);
              try {
                applyState(
                  await repository.deleteJournal(
                    deleteJournal.id,
                    deleteJournal.updatedAt,
                  ),
                );
                setDeleteJournal(null);
                setToast("Empty journal deleted.");
              } catch (e) {
                setDeleteJournalError(
                  e instanceof ConflictError
                    ? describeConflict(e.kind)
                    : (e as Error).message,
                );
              } finally {
                setSaving(false);
              }
            }}
          >
            Permanently delete empty journal
          </button>
        </Dialog>
      )}
      {manageJournals && (
        <Dialog
          title="Manage journals"
          onClose={() => setManageJournals(false)}
        >
          <p>
            Archived journals keep their history and exports. Restore them
            before changing readings.
          </p>
          {journals.map((j) => (
            <div key={j.id}>
              <strong>
                {j.name} {j.archived ? "(archived)" : "(active)"}
              </strong>
              {j.archived && (
                <button
                  onClick={() => {
                    setArchivedViewId(j.id);
                    setManageJournals(false);
                    setPage("history");
                  }}
                >
                  Inspect {j.name}
                </button>
              )}
              {j.id !== DEFAULT_JOURNAL_ID && (
                <button
                  disabled={saving}
                  onClick={async () => {
                    await runWrite(
                      () =>
                        repository.archiveJournal(
                          j.id,
                          j.updatedAt,
                          !j.archived,
                        ),
                      applyState,
                    );
                  }}
                >
                  {j.archived ? "Restore" : "Archive"} {j.name}
                </button>
              )}
            </div>
          ))}
        </Dialog>
      )}
      {journalDialog && (
        <Dialog
          title={journalEditing ? "Rename journal" : "Create a journal"}
          onClose={() => setJournalDialog(false)}
        >
          <p className="dialog-intro">
            {journalEditing
              ? "Change the name while keeping every reading and its history."
              : "Give a different kind of reading its own space. Each journal tracks verses independently."}
          </p>
          <form onSubmit={saveJournal}>
            <label className="field-label">
              Journal name
              <input
                value={journalName}
                onChange={(e) => {
                  setJournalName(e.target.value);
                  setJournalError("");
                }}
                placeholder="e.g. Sermons"
                maxLength={60}
                required
              />
            </label>
            {!journalEditing && (
              <div className="journal-suggestions">
                {["Sermons", "Small Group", "Memorization"].map((name) => (
                  <button
                    type="button"
                    key={name}
                    onClick={() => {
                      setJournalName(name);
                      setJournalError("");
                    }}
                  >
                    {name}
                  </button>
                ))}
              </div>
            )}
            {journalError && (
              <p className="inline-error" role="alert">
                {journalError}
              </p>
            )}
            <div className="dialog-actions">
              <button
                type="button"
                className="secondary"
                onClick={() => setJournalDialog(false)}
              >
                Cancel
              </button>
              <button
                className="primary"
                disabled={!journalName.trim() || saving}
              >
                {saving
                  ? "Saving…"
                  : journalEditing
                    ? "Save name"
                    : "Create journal"}
                <Check size={16} />
              </button>
            </div>
          </form>
        </Dialog>
      )}
      {about && (
        <Dialog
          title="A verse-level map of your reading."
          onClose={() => setAbout(false)}
        >
          <p className="dialog-intro">
            Jot & Tittle makes your reading history visible, down to its
            smallest marks.
          </p>
          <div className="about-items">
            <p>
              <strong>One square for every verse.</strong> The map follows
              canonical order, from Genesis to Revelation, without breaks
              between books.
            </p>
            <p>
              <strong>Three ways to look.</strong> Combined uses brown-to-green
              color for recency and pale-to-dark intensity for frequency, like
              leaves changing over time. Recency and Frequency show each on its
              own. Gray means no recorded readings. Hover or use arrow keys to
              reveal a reference and its book.
            </p>
            <p>
              <strong>Separate journals.</strong> Use Journal for your general
              reading, or create Sermons, Small Group, Memorization, or any
              journal you need. Each journal has its own map, history, and
              patterns.
            </p>
            <p>
              <strong>Go closer.</strong> Choose a book or chapter, or enter a
              passage to focus your map. Click a square to inspect its reading
              history.
            </p>
            <p>
              <strong>Yours to keep.</strong> Readings stay on your device.
              Export and import them from Your data. There are no streaks or
              spiritual scores.
            </p>
            <p className="muted">
              The name comes from Matthew 5:18. Version 0.2 · Open-source
              local-first application. Scripture text is not bundled.
            </p>
          </div>
          <button className="primary" onClick={() => setAbout(false)}>
            Back to my reading space <ArrowRight size={16} />
          </button>
        </Dialog>
      )}
    </div>
  );
}
const dialogStack: HTMLElement[] = [];
const originalInert = new Map<HTMLElement, boolean>();
let originalOverflow = "";
function syncDialogs() {
  const top = dialogStack.at(-1);
  const host = top?.parentElement;
  if (top)
    for (const child of Array.from(host?.children || [])) {
      if (!(child instanceof HTMLElement)) continue;
      if (!originalInert.has(child)) originalInert.set(child, child.inert);
      child.inert = child !== top;
    }
  else {
    for (const [child, value] of originalInert) child.inert = value;
    originalInert.clear();
    document.body.style.overflow = originalOverflow;
  }
}
function Dialog({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const titleId = React.useId();
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement;
    const backdrop = root.current!.parentElement!;
    if (!dialogStack.length) originalOverflow = document.body.style.overflow;
    dialogStack.push(backdrop);
    document.body.style.overflow = "hidden";
    syncDialogs();
    const focus =
      root.current?.querySelector<HTMLElement>(
        'input:not(:disabled):not([type="hidden"]),textarea:not(:disabled),select:not(:disabled)',
      ) ||
      root.current?.querySelector<HTMLElement>("button:not(:disabled)") ||
      root.current;
    focus?.focus();
    return () => {
      const index = dialogStack.indexOf(backdrop);
      if (index >= 0) dialogStack.splice(index, 1);
      syncDialogs();
      if (previous?.isConnected && !previous.closest("[inert]"))
        previous.focus();
      else
        (
          dialogStack
            .at(-1)
            ?.querySelector<HTMLElement>("button:not(:disabled)") ||
          document.querySelector<HTMLElement>("header button:not(:disabled)")
        )?.focus();
    };
  }, []);
  return (
    <div
      className="modal-backdrop"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="dialog"
        ref={root}
        role="dialog"
        tabIndex={-1}
        aria-modal="true"
        aria-labelledby={titleId}
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            e.preventDefault();
            e.stopPropagation();
            onClose();
            return;
          }
          if (e.key === "Tab") {
            const elements = Array.from(
              root.current?.querySelectorAll<HTMLElement>(
                'button:not(:disabled),input:not(:disabled):not([type="hidden"]),textarea:not(:disabled),select:not(:disabled),[tabindex="0"]',
              ) || [],
            );
            const first = elements[0],
              last = elements.at(-1);
            if (e.shiftKey && document.activeElement === first) {
              e.preventDefault();
              last?.focus();
            } else if (!e.shiftKey && document.activeElement === last) {
              e.preventDefault();
              first?.focus();
            }
          }
        }}
      >
        <div className="dialog-heading">
          <h2 id={titleId}>{title}</h2>
          <button
            className="icon-btn"
            aria-label="Close dialog"
            onClick={onClose}
          >
            <X size={19} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
createRoot(document.getElementById("root")!).render(<App />);
