import { HistoryView } from "./HistoryView";
import { PatternsView } from "./PatternsView";
import { CaptureSurface, DetailSurface } from "./DetailSurface";
import { TextView } from "./TextView";
import { ReadingDetail } from "./ReadingDetail";
import { MapDisplayControls } from "./MapDisplayControls";
import { Dialog } from "./Dialog";
import { ReadingViewControls } from "./ReadingViewControls";
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
  ShieldCheck,
  MoreHorizontal,
  Pencil,
  Trash2,
  Info,
  Leaf,
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
import { EmptyMapDemo } from "./EmptyMapDemo";
import "./styles.css";
import "./design.css";
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
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [page, sample]);
  const [trashOpen, setTrashOpen] = useState(false);
  const [exploreEmpty, setExploreEmpty] = useState(false);
  const [mapDisplay, setMapDisplay] = useState(false);
  const [adjacent, setAdjacent] = useState(() => window.innerWidth >= 1248);
  useEffect(() => {
    const media = window.matchMedia("(min-width:1248px)");
    const update = () => setAdjacent(media.matches);
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);
  useEffect(() => {
    const v = window.visualViewport;
    if (!v) return;
    const update = () => {
      document.documentElement.classList.toggle(
        "keyboard-open",
        window.innerWidth < 768 && v.height < window.innerHeight * 0.75,
      );
    };
    v.addEventListener("resize", update);
    return () => {
      v.removeEventListener("resize", update);
      document.documentElement.classList.remove("keyboard-open");
    };
  }, []);
  const origin = useRef<HTMLElement | null>(null);
  const captureOrigin = useRef<HTMLElement | null>(null);
  const draft = useRef<{
    editing: Reading | null;
    input: string;
    date: string;
    notes: string;
    journalId: string;
  } | null>(null);
  const [presentation, setPresentation] = useState(() => {
    try {
      return localStorage.getItem("jot-presentation") === "text"
        ? "text"
        : "map";
    } catch {
      return "map";
    }
  });
  useEffect(() => {
    try {
      localStorage.setItem("jot-presentation", presentation);
    } catch {}
  }, [presentation]);
  function inspectVerse(id: number) {
    origin.current = document.activeElement as HTMLElement;
    setReadingDetail(null);
    setInspectedVerse(id);
    setSelected(id);
  }
  function inspectReading(r: Reading) {
    origin.current = document.activeElement as HTMLElement;
    setSelected(null);
    setReadingDetail(r);
  }
  const [passageSearch, setPassageSearch] = useState(false);
  const [readingDetail, setReadingDetail] = useState<Reading | null>(null);
  const [savedReading, setSavedReading] = useState<Reading | null>(null);
  const [recordJournalId, setRecordJournalId] = useState(DEFAULT_JOURNAL_ID);
  const [archivedViewId, setArchivedViewId] = useState<string | null>(null);
  const readOnly = !!archivedViewId;
  const viewJournalId = archivedViewId || activeJournalId;
  const [journalConflict, setJournalConflict] = useState<Journal | null>(null);
  const [journalMissing, setJournalMissing] = useState(false);
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
  const [importName, setImportName] = useState("");
  const [importVersion, setImportVersion] = useState(3);
  const [importing, setImporting] = useState(false);
  const [importChecking, setImportChecking] = useState(false);
  const [importMessage, setImportMessage] = useState("");
  let importPlan: ReturnType<typeof mergeJournalImport> | null = null;
  let importPlanError = "";
  try {
    if (importPreview)
      importPlan = mergeJournalImport(currentState, importPreview);
  } catch (e) {
    importPlanError = (e as Error).message;
  }

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
    if (
      e.kind === "journal-missing" &&
      e.attempted &&
      "ranges" in e.attempted
    ) {
      setConflict({ kind: e.kind, attempted: e.attempted as Reading });
      repository
        .load()
        .then(applyState)
        .catch((error) => setError((error as Error).message));
      return true;
    }
    if (
      e.kind.startsWith("journal-") ||
      (e.stored && !("ranges" in e.stored))
    ) {
      setJournalError(describeConflict(e.kind));
      setJournalConflict(
        e.stored && !("ranges" in e.stored) ? (e.stored as Journal) : null,
      );
      setJournalMissing(e.kind === "journal-deleted");
      return true;
    }
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
    setError("");
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
      navigator.serviceWorker
        .register(`${import.meta.env.BASE_URL}sw.js`)
        .catch(() => {});
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
            if (!remote) setConflict((c) => c || { kind: "reading-deleted" });
            else if (editingUpdatedAt && remote.updatedAt !== editingUpdatedAt)
              setConflict(
                (c) =>
                  c || {
                    kind: "reading-updated",
                    stored: remote,
                  },
              );
          }
          if (journalDialog && journalEditing) {
            const remote = state.journals.find(
              (j) => j.id === journalEditing.id,
            );
            if (!remote) {
              setJournalMissing(true);
              setJournalConflict(null);
              setJournalError("This journal was deleted in another tab.");
            } else if (remote.updatedAt !== journalEditing.updatedAt) {
              setJournalConflict(remote);
              setJournalError(describeConflict("journal-updated"));
            }
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
  const [appliedPeriod, setAppliedPeriod] = useState({
    from: dateLocal(),
    to: dateLocal(),
  });
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
    total = viewed.length;
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
      journalId: editing?.journalId || recordJournalId,
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
    setError("");
    setJournalEditing(journal);
    setJournalName(journal?.name || "");
    setJournalError("");
    setJournalConflict(null);
    setJournalMissing(false);
    setJournalDialog(true);
  }
  async function saveJournal(e: React.FormEvent) {
    e.preventDefault();
    let name: string;
    try {
      name = validateJournalName(journalName, journals, journalEditing?.id);
    } catch (e) {
      setJournalError((e as Error).message);
      document.getElementById("journal-name")?.focus();
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
    setError("");
    captureOrigin.current = document.activeElement as HTMLElement;
    const retained =
      draft.current && draft.current.editing?.id === r?.id && !prefill
        ? draft.current
        : null;
    setSample(false);
    setEditing(retained?.editing ?? r);
    setRecordJournalId(retained?.journalId || r?.journalId || activeJournalId);
    setEditingUpdatedAt(retained?.editing?.updatedAt || r?.updatedAt || null);
    setConflict(null);
    setInput(retained?.input ?? r?.originalInput ?? prefill);
    setDate(retained?.date ?? (r ? readingDate(r.startedAt) : dateLocal()));
    setNotes(retained?.notes ?? r?.notes ?? "");
    setFormError("");
    setSavedReading(null);
    setModal(true);
  }
  function closeCapture() {
    if (saving) return;
    draft.current = { editing, input, date, notes, journalId: recordJournalId };
    setModal(false);
  }
  async function saveReading(e: React.FormEvent) {
    e.preventDefault();
    if (!parsed.ranges.length) {
      setFormError(parsed.error || "Enter a passage to record.");
      document
        .querySelector<HTMLInputElement>(".capture-card [data-initial-focus]")
        ?.focus();
      return;
    }

    if (!date || !validCalendarDate(date) || date > dateLocal()) {
      setFormError("Choose a valid reading date, today or earlier.");
      document
        .querySelector<HTMLInputElement>(".capture-card input[type=date]")
        ?.focus();
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
              ? `Reading updated: ${r.ranges.map(rangeLabel).join("; ")} · ${formatDate(r.startedAt)}.`
              : `Reading saved: ${r.ranges.map(rangeLabel).join("; ")} · ${formatDate(r.startedAt)} in “${journals.find((j) => j.id === r.journalId)?.name}”.${!scopeJournalIds.includes(r.journalId) || !inPeriod(r, period) ? " Hidden by your current view. Choose Show this reading to find it." : ""}`,
          );
          setSavedReading(r);
          setConflict(null);
        },
      )
    ) {
      draft.current = null;
      setModal(false);
    }
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
    ) {
      draft.current = null;
      setModal(false);
    }
  }
  async function saveReadingAsNew() {
    const base = buildDraft(crypto.randomUUID());
    if (!base) {
      const message =
        parsed.error || "Choose a valid reading date, today or earlier.";
      setFormError(message);
      setError(
        `${message} Cancel this comparison to correct your retained draft.`,
      );
      return;
    }
    if (!journals.some((j) => j.id === recordJournalId && !j.archived)) return;
    const r = { ...base, journalId: recordJournalId };
    if (
      await runWrite(
        () => repository.putReading(r, null),
        (state) => {
          applyState(state);
          setToast(
            `Reading saved in “${journals.find((j) => j.id === r.journalId)?.name}”.`,
          );
          setConflict(null);
          setEditing(null);
          setEditingUpdatedAt(null);
        },
      )
    ) {
      draft.current = null;
      setModal(false);
    }
  }
  async function discardConflict() {
    if (conflict?.stored) {
      try {
        const state = await repository.load();
        applyState(state);
        const latest = state.readings.find((r) => r.id === conflict.stored?.id);
        if (!latest || latest.updatedAt !== conflict.stored.updatedAt) {
          setConflict({
            kind: latest ? "reading-updated" : "reading-deleted",
            stored: latest,
          });
          return;
        }
      } catch (e) {
        setError((e as Error).message);
        return;
      }
    }

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
    if (!file || importing || saving) return;
    setImporting(true);
    setImportName(file.name);
    setImportMessage("");
    setError("");
    try {
      const raw = JSON.parse(await file.text());
      setImportVersion(raw.version || 1);
      setImportPreview(deserializeJournals(raw));
    } catch (e) {
      setError((e as Error).message);
    }
    if (fileRef.current) fileRef.current.value = "";
    setImporting(false);
  }
  async function applyImport() {
    if (!importPreview || !importPlan || saving || importChecking) return;
    setImportChecking(true);
    const previewSummary = JSON.stringify([
      importPlan.addedReadings,
      importPlan.addedJournals,
      importPlan.duplicates,
      importPlan.renamedJournals,
    ]);
    try {
      const fresh = await repository.load();
      const plan = mergeJournalImport(fresh, importPreview);
      applyState(fresh);
      if (
        previewSummary !==
        JSON.stringify([
          plan.addedReadings,
          plan.addedJournals,
          plan.duplicates,
          plan.renamedJournals,
        ])
      ) {
        setImportMessage(
          "Your stored data changed. Review the refreshed counts and journal names before merging.",
        );
        return;
      }
    } catch (e) {
      setError((e as Error).message);
      return;
    } finally {
      setImportChecking(false);
    }
    await runWrite(
      () => repository.mergeImport(importPreview),
      (result) => {
        applyState(result.state);
        setToast(
          `${result.addedReadings} readings and ${result.addedJournals} journals imported.${result.renamedJournals.length ? " " + result.renamedJournals.join("; ") : ""}`,
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
            `“${resetJournal?.name || destinationJournal.name}” readings cleared (${state.undo.count}).`,
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
  return (
    <div
      className={`app ${modal ? "capture-open" : ""}`}
      onClickCapture={(e) => {
        const target = (e.target as HTMLElement).closest<HTMLElement>(
          "button,summary,a[href]",
        );
        if (target && !target.matches(":disabled,[aria-disabled=true]"))
          target.focus({ preventScroll: true });
      }}
    >
      <a
        className="skip-link"
        href={modal ? "#capture-content" : "#main-content"}
        onClick={(e) => {
          e.preventDefault();
          document
            .getElementById(modal ? "capture-content" : "main-content")
            ?.focus();
        }}
      >
        Skip to content
      </a>
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
            aria-label="Manage journals"
            title="Manage journals"
            disabled={!storageReady || saving}
            onClick={() => setManageJournals(true)}
          >
            <MoreHorizontal size={16} />
          </button>
        </div>
        <nav aria-label="Main navigation">
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
              aria-label={label}
              aria-current={page === id ? "page" : undefined}
              className={`nav-item ${page === id ? "active" : ""}`}
              onClick={() => {
                if (saving) return;
                if (modal) closeCapture();
                setPage(id);
                setSelected(null);
                setReadingDetail(null);
                requestAnimationFrame(() =>
                  document
                    .querySelector<HTMLElement>(
                      "main:not([hidden]) .page-heading h1",
                    )
                    ?.focus(),
                );
              }}
            >
              <Icon size={18} />
              <span className="nav-title">
                {id === "map"
                  ? "Map"
                  : id === "history"
                    ? "History"
                    : id === "insights"
                      ? "Patterns"
                      : "Your data"}
              </span>
              <span className="nav-short-title">
                {id === "map"
                  ? "Map"
                  : id === "history"
                    ? "History"
                    : id === "insights"
                      ? "Patterns"
                      : "Your data"}
              </span>
              {id === "map" && <span className="nav-dot" />}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="local-status">
            <span /> This browser on this device
          </div>
          <button onClick={() => setAbout(true)}>
            About Jot & Tittle <ArrowUpRight size={13} />
          </button>
        </div>
      </aside>
      <main id="main-content" tabIndex={-1} hidden={modal}>
        <header className="topbar">
          <div>
            <span
              className="breadcrumb"
              title={sample ? "Example data" : currentJournal.name}
            >
              {sample ? "Example data" : currentJournal.name}
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
              <ShieldCheck size={14} />{" "}
              {storageReady ? "Saved in this browser" : "Storage unavailable"}
            </span>
            <button
              className={
                page === "map" &&
                !allReadings.length &&
                !sample &&
                !exploreEmpty
                  ? "secondary small"
                  : "primary small"
              }
              onClick={() => openLog()}
              disabled={!storageReady || readOnly}
            >
              <Plus size={16} /> Log a reading
            </button>
          </div>
        </header>
        {undos.length > 0 && (
          <aside className="undo-notices" aria-label="Reading recovery">
            {undos.map((entry) => (
              <div className="undo-notice" key={entry.id}>
                <span>
                  <span role="status">
                    {entry.label} Undo is available for 30 seconds.
                  </span>{" "}
                  {entry.expiresAt > undoNow
                    ? `Undo available for ${Math.ceil((entry.expiresAt - undoNow) / 1000)}s.`
                    : "Undo expired."}
                </span>
                {entry.expiresAt <= undoNow && (
                  <button
                    onClick={() => {
                      setPage("data");
                      setTrashOpen(true);
                    }}
                  >
                    Open Trash
                  </button>
                )}
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

        <div className={`content ${page === "map" ? "map-content" : ""}`}>
          {!ready && (
            <p className="storage-notice" role="status">
              Loading your readings…
            </p>
          )}
          {readOnly && (
            <p role="status">
              Archived journal · read-only.{" "}
              <button onClick={() => setManageJournals(true)}>
                Manage archived journal
              </button>
              <button onClick={() => setArchivedViewId(null)}>
                Return to active journal
              </button>
            </p>
          )}
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
              <h1 tabIndex={-1}>
                {page === "map"
                  ? !allReadings.length && !sample && !exploreEmpty && !readOnly
                    ? "Your verse map"
                    : "Your reading, at a glance"
                  : page === "history"
                    ? "Reading history"
                    : page === "insights"
                      ? "Reading patterns"
                      : "Your data"}
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
          {page !== "data" &&
            (allReadings.length > 0 || sample || exploreEmpty) && (
              <ReadingViewControls
                journals={journals}
                currentJournalId={viewJournalId}
                destinationName={destinationJournal.name}
                archived={readOnly}
                sample={sample}
                mode={periodMode}
                from={appliedPeriod.from}
                to={appliedPeriod.to}
                journalMode={journalScopeMode}
                ids={selectedJournalIds}
                today={today}
                period={period}
                scopeIds={scopeJournalIds}
                onApply={(v) => {
                  setPeriodMode(v.mode);
                  setAppliedPeriod({ from: v.from, to: v.to });
                  setJournalScopeMode(v.journalMode);
                  setSelectedJournalIds(v.ids);
                }}
              />
            )}
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
                <Leaf size={16} /> Sample readings · your personal history stays
                separate.
              </span>
              <button onClick={() => setSample(false)}>
                Return to my readings <X size={14} />
              </button>
            </div>
          )}
          {page === "map" &&
            !sample &&
            !readOnly &&
            !allReadings.length &&
            !exploreEmpty &&
            ready &&
            storageReady && (
              <section className="welcome">
                <div className="welcome-composition">
                  <div className="welcome-copy">
                    <h2>Start with a passage</h2>
                    <p>
                      Log a chapter, a few verses, or several Bible passages
                      together. Each square represents a verse; color shows when
                      and how often you’ve recorded it. Bible text is not
                      included.
                    </p>
                    <div className="welcome-actions">
                      <button className="primary" onClick={() => openLog()}>
                        Log your first reading <ArrowRight size={16} />
                      </button>
                      <button
                        className="secondary"
                        onClick={() => setSample(true)}
                      >
                        Explore sample data
                      </button>
                    </div>
                  </div>
                  <EmptyMapDemo />
                </div>
                <div className="welcome-footnote">
                  <p>
                    <ShieldCheck size={17} /> Your journal is saved in this
                    browser. Export a backup from Your data to keep another
                    copy.
                  </p>
                  <button
                    className="quiet"
                    onClick={() => setExploreEmpty(true)}
                  >
                    Explore my empty map <ArrowRight size={14} />
                  </button>
                </div>
              </section>
            )}
          {page === "map" &&
            (sample || allReadings.length > 0 || exploreEmpty || readOnly) && (
              <>
                <dl
                  className="reading-summary"
                  aria-label="Reading map summary"
                >
                  <div>
                    <dt>Verses recorded</dt>
                    <dd>
                      {pretty(covered)}{" "}
                      <span>of {pretty(total)} in this map</span>
                    </dd>
                  </div>
                  <div>
                    <dt>Reading sessions</dt>
                    <dd>
                      {pretty(active.length)} <span>in the current view</span>
                    </dd>
                  </div>
                  <div>
                    <dt>Last reading</dt>
                    <dd className="summary-date">
                      {sorted[0]
                        ? formatDate(sorted[0].startedAt)
                        : "No readings yet"}
                    </dd>
                  </div>
                </dl>
                <div
                  className={`detail-layout ${selected !== null || readingDetail ? "has-detail" : ""}`}
                >
                  <div className="detail-main">
                    <section className="map-card">
                      <div className="map-toolbar">
                        <div className="scope-controls">
                          {" "}
                          <div
                            className="presentation-controls"
                            role="group"
                            aria-label="Map presentation"
                          >
                            <button
                              className="secondary"
                              aria-pressed={presentation === "map"}
                              onClick={() => setPresentation("map")}
                            >
                              Color map
                            </button>
                            <button
                              className="secondary"
                              aria-pressed={presentation === "text"}
                              onClick={() => setPresentation("text")}
                            >
                              Text view
                            </button>
                          </div>
                          <button
                            className="secondary"
                            aria-expanded={mapDisplay}
                            aria-controls="map-display-panel"
                            onClick={() => setMapDisplay(!mapDisplay)}
                          >
                            Map display ·{" "}
                            {metric === "combined"
                              ? "Combined"
                              : metric === "recency"
                                ? "Recency"
                                : "Frequency"}
                          </button>
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
                          <button
                            id="passage-search-trigger"
                            className="secondary"
                            aria-expanded={passageSearch}
                            aria-controls="passage-search"
                            onClick={() => {
                              setPassageSearch(!passageSearch);
                              if (!passageSearch)
                                requestAnimationFrame(() =>
                                  document
                                    .getElementById("passage-search-input")
                                    ?.focus(),
                                );
                            }}
                          >
                            Go to passage
                          </button>
                          <form
                            hidden={!passageSearch}
                            id="passage-search"
                            className="scope-search"
                            onKeyDown={(e) => {
                              if (e.key === "Escape") {
                                e.preventDefault();
                                setPassageSearch(false);
                                document
                                  .getElementById("passage-search-trigger")
                                  ?.focus();
                              }
                            }}
                            onSubmit={(e) => {
                              e.preventDefault();
                              applyScope();
                            }}
                          >
                            <Search size={14} />
                            <input
                              id="passage-search-input"
                              aria-invalid={!!scopeError}
                              aria-describedby={
                                scopeError ? "scope-error" : undefined
                              }
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
                      </div>
                      {scopeError && (
                        <div
                          id="scope-error"
                          className="inline-error"
                          role="alert"
                        >
                          {scopeError}
                        </div>
                      )}
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
                          <div className="loading">
                            Opening your reading space…
                          </div>
                        ) : (
                          <>
                            <div hidden={presentation !== "text"}>
                              <TextView
                                scope={scope}
                                stats={stats}
                                everStats={unfilteredStats}
                                readings={active}
                                journals={journals}
                                onSelect={inspectVerse}
                                onReadingSelect={inspectReading}
                                onScopeChange={(r: Range) => {
                                  setScopeRange(r);
                                  setBook("all");
                                  setChapter("all");
                                  setSelected(null);
                                }}
                                frequencyUnit={
                                  !archivedViewId &&
                                  journalScopeMode !== "single" &&
                                  !sample
                                    ? "encounters"
                                    : "reading records"
                                }
                              />
                            </div>
                            <div hidden={presentation !== "map"}>
                              <Heatmap
                                scope={scope}
                                stats={stats}
                                everStats={unfilteredStats}
                                now={timeNow}
                                metric={metric}
                                layout={layout}
                                zoom={zoom}
                                onInspect={setInspectedVerse}
                                selected={selected}
                                frequencyUnit={
                                  !archivedViewId &&
                                  journalScopeMode !== "single" &&
                                  !sample
                                    ? "recorded encounters"
                                    : "recorded readings"
                                }
                                onSelect={inspectVerse}
                              />
                            </div>
                          </>
                        )}
                      </div>
                      <p className="counting-rule">
                        {!archivedViewId &&
                        journalScopeMode !== "single" &&
                        !sample
                          ? "Counts deduplicate shared encounters across selected journals."
                          : "Counts reflect reading records in this journal."}
                      </p>
                      <div className="map-footer">
                        <span>
                          <span className="dot-square" /> One square, one verse{" "}
                          <span className="footer-separator">·</span> Inspect a
                          verse for counts and dates
                        </span>

                        <MetricLegend metric={metric} />
                      </div>
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
                              if (
                                ranges[0].start < scope.start ||
                                ranges[0].start > scope.end
                              )
                                throw new Error(
                                  "This verse is outside the current passage scope. Use Text view to find it and explicitly change passage scope.",
                                );
                              setInspectedVerse(ranges[0].start);
                              inspectVerse(ranges[0].start);
                              setInspectError("");
                            } catch (e) {
                              setInspectError((e as Error).message);
                            }
                          }}
                        >
                          <label className="field-label">
                            Verse reference
                            <input
                              aria-invalid={!!inspectError}
                              aria-describedby={
                                inspectError ? "inspect-error" : undefined
                              }
                              value={inspectText}
                              onChange={(e) => setInspectText(e.target.value)}
                              placeholder="John 3:16"
                            />
                          </label>
                          <button className="secondary">Inspect verse</button>
                        </form>
                        {inspectError && (
                          <p id="inspect-error" role="alert">
                            {inspectError}
                          </p>
                        )}
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
                            setInspectedVerse((id) =>
                              Math.max(scope.start, id - 1),
                            )
                          }
                        >
                          Previous verse
                        </button>
                        <button
                          disabled={inspectedVerse >= scope.end}
                          onClick={() =>
                            setInspectedVerse((id) =>
                              Math.min(scope.end, id + 1),
                            )
                          }
                        >
                          Next verse
                        </button>
                        <button onClick={() => inspectVerse(inspectedVerse)}>
                          Open inspected verse details
                        </button>
                        <details>
                          <summary>Keyboard and text inspection</summary>
                          <p>
                            Arrow keys inspect verses; Home and End reach row
                            edges, Ctrl+Home and Ctrl+End reach scope
                            boundaries. Enter opens details; stationary tap
                            previews a verse. Text inspection provides the same
                            counts and dates without using the map.
                          </p>
                        </details>
                      </section>
                    </section>
                  </div>{" "}
                  {selected !== null && (
                    <DetailSurface
                      title={reference(selected)}
                      onClose={() => setSelected(null)}
                      origin={origin.current}
                      returnLabel={
                        presentation === "text"
                          ? "Back to Text view"
                          : "Back to map"
                      }
                    >
                      <div className="verse-detail">
                        <span className="eyebrow">VERSE READING HISTORY</span>
                        <strong>
                          {stats[selected].count}{" "}
                          <small>
                            {!archivedViewId &&
                            journalScopeMode !== "single" &&
                            !sample
                              ? "recorded encounters"
                              : "recorded readings"}
                          </small>
                        </strong>
                        <p>
                          {stats[selected].last
                            ? `Last read ${formatDate(stats[selected].last!)}`
                            : unfilteredStats[selected].count
                              ? "No readings in this period."
                              : "Never recorded in these journals."}
                        </p>
                        {!stats[selected].count &&
                          unfilteredStats[selected].last && (
                            <p>
                              All dates in these journals: last recorded{" "}
                              {formatDate(unfilteredStats[selected].last!)}.
                            </p>
                          )}
                        {stats[selected].first && (
                          <p className="muted">
                            First recorded {formatDate(stats[selected].first!)}
                          </p>
                        )}
                      </div>
                      <div className="verse-events">
                        {sorted
                          .filter((r) =>
                            r.ranges.some(
                              (q) => selected >= q.start && selected <= q.end,
                            ),
                          )
                          .map((r) => (
                            <div key={r.id}>
                              <button
                                className="reading-title"
                                onClick={() => inspectReading(r)}
                              >
                                {r.ranges.map(rangeLabel).join("; ")}
                              </button>
                              <span>{formatDate(r.startedAt)}</span>
                              <small>
                                {sample
                                  ? "Example data"
                                  : journals.find((j) => j.id === r.journalId)
                                      ?.name}{" "}
                                · {r.ranges.map(rangeLabel).join("; ")}
                              </small>
                              <p className="reading-notes">
                                {r.notes || "No notes for this reading."}
                              </p>
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
                          disabled={sample || readOnly || !storageReady}
                          onClick={() => {
                            const text = reference(selected);
                            setSelected(null);
                            openLog(null, text);
                          }}
                        >
                          Log this verse <Plus size={15} />
                        </button>
                      </div>
                    </DetailSurface>
                  )}
                  {readingDetail && (
                    <ReadingDetail
                      presentation={adjacent ? "pane" : "page"}
                      returnLabel="Back to map"
                      restoreFocus={origin.current}
                      reading={readingDetail}
                      journalName={
                        sample
                          ? "Example data"
                          : journals.find(
                              (j) => j.id === readingDetail.journalId,
                            )?.name || "Journal"
                      }
                      editable={
                        !sample &&
                        !readOnly &&
                        !journals.find((j) => j.id === readingDetail.journalId)
                          ?.archived
                      }
                      onClose={() => setReadingDetail(null)}
                      onEdit={() => {
                        const r = readingDetail;
                        setReadingDetail(null);
                        openLog(r);
                      }}
                    />
                  )}
                </div>
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
                          onClick={() => inspectReading(r)}
                        >
                          <span className="reading-icon">
                            <BookOpen size={16} />
                          </span>
                          <div>
                            <strong>
                              {r.ranges.map(rangeLabel).join("; ")}
                            </strong>
                            <span>
                              {sample
                                ? "Example data"
                                : journals.find((j) => j.id === r.journalId)
                                    ?.name}
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
                    <h3>Explore your reading</h3>
                    <p>
                      See the books and verses in the journals and dates you’re
                      viewing.
                    </p>
                    {!active.length ? (
                      <button onClick={() => setSample(true)}>
                        Explore sample data <ArrowUpRight size={14} />
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
            <div
              className={`detail-layout ${readingDetail ? "has-detail" : ""}`}
            >
              <div className="detail-main">
                <HistoryView
                  sorted={sorted}
                  sessionCount={active.length}
                  hasReadings={!!readings.length}
                  sample={sample}
                  readOnly={readOnly}
                  journals={journals}
                  query={historyQuery}
                  onQueryChange={setHistoryQuery}
                  onInspectReading={inspectReading}
                  onMoveReading={(r) => {
                    setTransferMode("move");
                    setTransfer(r);
                    setDestination("");
                    setTransferError("");
                  }}
                  onCopyReading={(r) => {
                    setTransferMode("copy");
                    setCopyId(crypto.randomUUID());
                    setTransfer(r);
                    setDestination("");
                    setTransferError("");
                  }}
                  onDeleteReading={setConfirmDelete}
                  onLogReading={() => openLog()}
                />
              </div>{" "}
              {readingDetail && (
                <ReadingDetail
                  presentation={adjacent ? "pane" : "page"}
                  returnLabel={
                    page === "history" ? "Back to History" : "Back to map"
                  }
                  restoreFocus={origin.current}
                  reading={readingDetail}
                  journalName={
                    sample
                      ? "Example data"
                      : journals.find((j) => j.id === readingDetail.journalId)
                          ?.name || "Journal"
                  }
                  editable={
                    !sample &&
                    !readOnly &&
                    !journals.find((j) => j.id === readingDetail.journalId)
                      ?.archived
                  }
                  onClose={() => setReadingDetail(null)}
                  onEdit={() => {
                    const r = readingDetail;
                    setReadingDetail(null);
                    openLog(r);
                  }}
                />
              )}
            </div>
          )}
          {page === "insights" && (
            <PatternsView
              stats={stats}
              sessionCount={active.length}
              deduplicatesEncounters={
                !archivedViewId && journalScopeMode !== "single" && !sample
              }
              onExploreBook={(bookIndex) => {
                setBook(String(bookIndex));
                setChapter("all");
                setScopeRange(null);
                setPage("map");
              }}
              onInspectVerse={(verseId) => {
                setScopeRange(null);
                setBook("all");
                setChapter("all");
                setPage("map");
                inspectVerse(verseId);
              }}
            />
          )}
          {page === "data" && (
            <>
              <div className="data-banner">
                <ShieldCheck size={24} />
                <div>
                  <h2>At home on your device.</h2>
                  <p>
                    Your history stays in this browser on this device. There’s
                    no account, cloud sync, or reading telemetry.
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
                    including empty and archived journals, dates, passages, and
                    notes. View filters do not limit the backup; Trash is
                    excluded until restored.
                  </p>
                  <button
                    className="primary"
                    onClick={exportData}
                    disabled={!storageReady || exporting}
                  >
                    {exporting ? "Exporting…" : "Export all journals"}{" "}
                    <Download size={15} />
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
                    disabled={!storageReady || importing || saving}
                    onClick={() => fileRef.current?.click()}
                  >
                    {importing ? "Reading backup…" : "Choose a JSON file"}{" "}
                    <Upload size={15} />
                  </button>
                </section>
              </div>
              <details
                className="panel"
                open={trashOpen}
                onToggle={(e) => setTrashOpen(e.currentTarget.open)}
              >
                <summary>Trash · {trash.length} groups</summary>
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
              </details>

              <details className="panel">
                <summary>About this reading space</summary>
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
                    <dd>Version 3 / Version 3</dd>
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
                <div className="source-info">
                  <h2>Run Jot &amp; Tittle yourself</h2>
                  <p className="muted" style={{ margin: "12px 0 18px" }}>
                    This source-code download does not back up your personal
                    data. Visit the latest GitHub release. To host the app
                    without build tools, download jot-and-tittle-build.zip.
                    Source-code archives contain code, tests, and setup
                    instructions and require a build before static hosting.
                  </p>
                  <a
                    className="secondary source-link"
                    href="https://github.com/travisseitler/jot-and-tittle/releases/latest"
                  >
                    Download source code <Download size={15} />
                  </a>
                </div>
              </details>
            </>
          )}
          <footer className="page-footer">
            <span>JOT & TITTLE</span>
            <button onClick={() => setPage("data")}>
              <ShieldCheck size={12} /> Your data &amp; backups
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
          {savedReading &&
            allReadings.some((r) => r.id === savedReading.id) &&
            (toast.startsWith("Reading saved") ||
              toast.startsWith("Reading updated")) && (
              <button
                onClick={() => {
                  setSample(false);
                  setPeriodMode("all");
                  setJournalScopeMode("selected");
                  setSelectedJournalIds([savedReading.journalId]);
                  setArchivedViewId(null);
                  setPage("map");
                  setScopeRange(savedReading.ranges[0]);
                  setBook("all");
                  setChapter("all");
                  setScopeText("");
                  setExploreEmpty(true);
                  setSavedReading(null);
                }}
              >
                Show this reading
              </button>
            )}
        </div>
      )}
      {mapDisplay && (
        <Dialog
          title="Map display"
          initialFocus="heading"
          onClose={() => setMapDisplay(false)}
        >
          <MapDisplayControls
            metric={metric}
            layout={layout}
            zoom={zoom}
            setMetric={setMetric}
            setLayout={setLayout}
            setZoom={setZoom}
          />
          <p>
            Cell size changes the verse marks. Browser zoom remains available.
            Book and chapter structure appears during inspection.
          </p>
          <button className="primary" onClick={() => setMapDisplay(false)}>
            Done
          </button>
        </Dialog>
      )}
      {modal && (
        <CaptureSurface
          title={editing ? "Edit your reading" : "Log a reading"}
          onClose={closeCapture}
          busy={saving}
          origin={captureOrigin.current}
        >
          <form onSubmit={saveReading} noValidate aria-busy={saving}>
            <label className="field-label">
              Passage or passages
              <input
                data-initial-focus
                readOnly={saving}
                id="reading-passage"
                aria-invalid={!!formError && !parsed.ranges.length}
                aria-describedby={`passage-help ${input ? "passage-preview" : ""} ${formError ? "reading-error" : ""}`}
                value={input}
                onChange={(e) => {
                  setInput(e.target.value);
                  setFormError("");
                }}
                placeholder="e.g. Romans 8:1–17; Psalm 23"
              />
            </label>
            <small id="passage-help" className="field-help">
              Try John 3:16 or Psalm 23.
            </small>
            <details className="reference-examples">
              <summary>More reference examples</summary>
              <small className="field-help">
                Book names or abbreviations. Commas inherit verse context (John
                3:16, 18–21) or chapter context (John 3, 5). Repeat the book or
                use a semicolon to start chapters after verses.
              </small>
            </details>
            {input && (
              <div
                id="passage-preview"
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
                disabled={saving}
                id="reading-date"
                aria-invalid={
                  !!formError &&
                  (!validCalendarDate(date) || date > dateLocal())
                }
                aria-describedby={formError ? "reading-error" : undefined}
                value={date}
                max={dateLocal()}
                onChange={(e) => {
                  setDate(e.target.value);
                  setFormError("");
                }}
                required
              />
            </label>
            <label className="field-label">
              Recording in
              <select
                aria-label="Recording journal"
                value={editing?.journalId || recordJournalId}
                disabled={!!editing || saving}
                onChange={(e) => setRecordJournalId(e.target.value)}
              >
                {journals
                  .filter((j) => !j.archived || j.id === editing?.journalId)
                  .map((j) => (
                    <option key={j.id} value={j.id}>
                      {j.name}
                    </option>
                  ))}
              </select>
            </label>
            <label className="field-label">
              Notes <span>optional</span>
              <textarea
                readOnly={saving}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Anything you’d like to remember…"
                rows={3}
              />
            </label>
            {formError && (
              <p id="reading-error" className="inline-error" role="alert">
                {formError}
              </p>
            )}
            <div className="dialog-actions">
              <button
                type="button"
                className="secondary"
                disabled={saving}
                onClick={closeCapture}
              >
                Cancel
              </button>
              <button
                className="primary"
                disabled={
                  saving ||
                  !storageReady ||
                  !journals.some((j) => j.id === recordJournalId && !j.archived)
                }
              >
                {saving ? "Saving…" : editing ? "Save changes" : "Save reading"}
                <Check size={16} />
              </button>
            </div>
            <div className="dialog-private">
              <ShieldCheck size={12} /> Saved in this browser on this device
            </div>
            <button
              type="button"
              className="quiet"
              disabled={saving}
              onClick={() => {
                draft.current = null;
                setInput("");
                setDate(dateLocal());
                setNotes("");
                setFormError("");
                setModal(false);
              }}
            >
              Discard draft
            </button>
            {error && (
              <p className="inline-error" role="alert">
                {error}
              </p>
            )}
          </form>
        </CaptureSurface>
      )}
      {importPreview && !importPlan && (
        <Dialog
          title="Review your import"
          busy={saving || importChecking}
          busyLabel={importChecking ? "Checking the latest data…" : "Merging…"}
          onClose={() => setImportPreview(null)}
        >
          <p role="alert">{importPlanError}</p>
          <p>
            Restore an existing archived destination before adding readings.
            Newly imported archives retain their history.
          </p>
          <button className="secondary" onClick={() => setImportPreview(null)}>
            Cancel
          </button>
        </Dialog>
      )}
      {importPreview && importPlan && (
        <Dialog
          error={error}
          busy={saving || importChecking}
          busyLabel={importChecking ? "Checking the latest data…" : "Merging…"}
          title="Review your import"
          initialFocus="heading"
          onClose={() => {
            if (!saving && !importChecking) setImportPreview(null);
          }}
        >
          <p className="muted">{importName}</p>
          {importMessage && <p role="status">{importMessage}</p>}

          <p className="dialog-intro">
            This file contains {importPreview.readings.length} readings across{" "}
            {importPreview.journals.length} journals. {importPlan.duplicates}{" "}
            readings already have matching IDs and will be kept as they are.
          </p>
          <div className="parse-preview">
            <Check size={18} />
            <div>
              <strong>File validated</strong>
              <small>Jot & Tittle v{importVersion} · protestant-en</small>
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
            <p className="muted">{importPlan.renamedJournals.join("; ")}</p>
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
              disabled={saving || importChecking}
              onClick={() => setImportPreview(null)}
            >
              Cancel
            </button>
            <button
              className="primary"
              disabled={
                saving ||
                importChecking ||
                (!importPlan.addedReadings && !importPlan.addedJournals)
              }
              onClick={applyImport}
            >
              {saving ? "Merging…" : "Merge journals & readings"}{" "}
              <Upload size={15} />
            </button>
          </div>
        </Dialog>
      )}

      {conflict && (
        <Dialog
          error={error}
          busy={saving}
          title={
            conflict.kind === "journal-missing"
              ? "Recording journal unavailable"
              : "This reading changed elsewhere"
          }
          onClose={() => setConflict(null)}
        >
          <p className="dialog-intro">
            {conflict.kind === "journal-missing"
              ? "The recording journal was removed or archived in another tab. Choose an active journal to save your draft as a new reading."
              : describeConflict(conflict.kind)}
            {conflict.forDelete
              ? " The delete was not applied."
              : " Your draft is still here and has not been saved."}
          </p>
          {!conflict.forDelete && (
            <div className="conflict-draft">
              <span className="eyebrow">Your draft</span>
              <strong>{input}</strong>
              <p>
                {date} · {journals.find((j) => j.id === recordJournalId)?.name}
              </p>
              <p className="reading-notes">{notes || "No notes"}</p>
            </div>
          )}
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
          {!conflict.forDelete &&
            (conflict.kind === "reading-deleted" ||
              conflict.kind === "journal-missing") && (
              <label className="field-label">
                Save new reading in
                <select
                  value={
                    journals.some(
                      (j) => j.id === recordJournalId && !j.archived,
                    )
                      ? recordJournalId
                      : ""
                  }
                  disabled={saving}
                  onChange={(e) => setRecordJournalId(e.target.value)}
                >
                  <option value="">Choose an active journal</option>
                  {journals
                    .filter((j) => !j.archived)
                    .map((j) => (
                      <option key={j.id} value={j.id}>
                        {j.name}
                      </option>
                    ))}
                </select>
                <small>
                  The new reading gets a new ID. Deleted readings and
                  unavailable journals are not recreated.
                </small>
              </label>
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
            {!conflict.forDelete &&
              (conflict.kind === "reading-deleted" ||
                conflict.kind === "journal-missing") && (
                <button
                  className="primary"
                  disabled={
                    saving ||
                    !journals.some(
                      (j) => j.id === recordJournalId && !j.archived,
                    )
                  }
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
          error={error}
          busy={saving}
          initialFocus="cancel"
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
              disabled={saving}
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
          error={error}
          busy={saving}
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
              disabled={saving}
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
          busy={saving}
          error={trashError || error}
          title="Permanently delete readings"
          initialFocus="cancel"
          onClose={() => setPurgeEntry(null)}
        >
          <button
            className="secondary"
            data-initial-focus
            disabled={saving}
            onClick={() => setPurgeEntry(null)}
          >
            Cancel
          </button>
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
          error={error}
          busy={saving}
          initialFocus="cancel"
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
          <button
            className="secondary"
            data-initial-focus
            disabled={saving}
            onClick={() => setDeleteJournal(null)}
          >
            Cancel
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
                setToast(`Empty journal “${deleteJournal.name}” deleted.`);
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
          error={error}
          busy={saving}
          title="Manage journals"
          onClose={() => setManageJournals(false)}
        >
          <p>
            Archived journals keep their history and exports. Restore them
            before changing readings.
          </p>
          <button
            disabled={saving}
            className="secondary"
            onClick={() => {
              setManageJournals(false);
              openJournalEditor();
            }}
          >
            Create a journal
          </button>
          {journalError && (
            <div>
              <p role="alert">{journalError}</p>
              <button
                className="secondary"
                disabled={saving}
                onClick={async () => {
                  try {
                    const state = await repository.load();
                    applyState(state);
                    setJournalError("");
                    setJournalConflict(null);
                    setJournalMissing(false);
                  } catch (e) {
                    setJournalError((e as Error).message);
                  }
                }}
              >
                Reload journals
              </button>
            </div>
          )}
          {journals.map((j) => (
            <div key={j.id}>
              <strong>
                {j.name} {j.archived ? "(archived)" : "(active)"}
              </strong>
              <button
                disabled={saving}
                onClick={() => {
                  setManageJournals(false);
                  openJournalEditor(j);
                }}
              >
                Rename {j.name}
              </button>
              {!j.archived && (
                <button
                  disabled={saving}
                  onClick={() => {
                    setManageJournals(false);
                    setResetJournal(j);
                    setConfirmReset(true);
                    setResetReadingIds(
                      allReadings
                        .filter((r) => r.journalId === j.id)
                        .map((r) => r.id),
                    );
                  }}
                >
                  Clear {j.name} readings
                </button>
              )}
              {j.id !== DEFAULT_JOURNAL_ID && (
                <button
                  disabled={saving}
                  onClick={() => {
                    setManageJournals(false);
                    setDeleteJournalError("");
                    setDeleteJournal(j);
                  }}
                >
                  Delete {j.name}
                </button>
              )}
              {j.archived && (
                <button
                  disabled={saving}
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
          error={error}
          busy={saving}
          title={journalEditing ? "Rename journal" : "Create a journal"}
          onClose={() => setJournalDialog(false)}
        >
          <p className="dialog-intro">
            {journalEditing
              ? "Change the name while keeping every reading and its history."
              : "Give a different kind of reading its own space. Each journal tracks verses independently."}
          </p>
          <form onSubmit={saveJournal} noValidate>
            <label className="field-label">
              Journal name
              <input
                id="journal-name"
                aria-invalid={!!journalError}
                aria-describedby={journalError ? "journal-error" : undefined}
                readOnly={saving}
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
                    disabled={saving}
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
              <p id="journal-error" className="inline-error" role="alert">
                {journalError}
              </p>
            )}
            {journalConflict && (
              <section className="conflict-remote">
                <h3>Journal saved in another tab</h3>
                <p>
                  {journalConflict.name} ·{" "}
                  {journalConflict.archived ? "Archived" : "Active"}
                </p>
                <p>Your intended name: {journalName}</p>
                <button
                  type="button"
                  className="secondary"
                  disabled={saving}
                  onClick={async () => {
                    try {
                      const latest = await repository.load();
                      applyState(latest);
                      const j = latest.journals.find(
                        (j) => j.id === journalEditing?.id,
                      );
                      if (!j) {
                        setJournalMissing(true);
                        setJournalConflict(null);
                        setJournalError(
                          "This journal was deleted. Choose another journal.",
                        );
                        return;
                      }
                      setJournalEditing(j);
                      setJournalName(j.name);
                      setJournalConflict(null);
                      setJournalError("");
                    } catch (e) {
                      setJournalError((e as Error).message);
                    }
                  }}
                >
                  Reload saved journal
                </button>
                <button
                  type="button"
                  className="secondary"
                  disabled={saving}
                  onClick={async () => {
                    try {
                      const latest = await repository.load();
                      applyState(latest);
                      const j = latest.journals.find(
                        (j) => j.id === journalEditing?.id,
                      );
                      if (!j) {
                        setJournalMissing(true);
                        setJournalConflict(null);
                        setJournalError(
                          "This journal was deleted. Your name will not recreate it.",
                        );
                        return;
                      }
                      if (j.updatedAt !== journalConflict.updatedAt) {
                        setJournalConflict(j);
                        setJournalError(
                          "The journal changed again. Review the latest version.",
                        );
                        return;
                      }
                      setJournalEditing(j);
                      setJournalConflict(null);
                      setJournalError(
                        "Review your intended name and choose Save name to apply it to this latest journal.",
                      );
                    } catch (e) {
                      setJournalError((e as Error).message);
                    }
                  }}
                >
                  Keep my intended name
                </button>
              </section>
            )}

            <div className="dialog-actions">
              <button
                type="button"
                className="secondary"
                disabled={saving}
                onClick={() => setJournalDialog(false)}
              >
                Cancel
              </button>
              <button
                className="primary"
                disabled={saving || journalMissing || !!journalConflict}
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
          error={error}
          busy={saving}
          initialFocus="heading"
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
              Export and import them from Your data.
            </p>
            <p>
              <strong>Made for attention, not achievement.</strong> These marks
              describe the readings you’ve recorded; they don’t measure your
              faith, effort, or worth. No streaks or spiritual scores.
            </p>
            <p className="muted">
              The name comes from Matthew 5:18. Version 0.3.0 · Open-source
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
createRoot(document.getElementById("root")!).render(<App />);
