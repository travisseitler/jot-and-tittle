import { useEffect, useId, useMemo, useState } from "react";
import {
  formatReadingDate,
  parsePassage,
  rangeLabel,
  reference,
  type Range,
  type Stats,
} from "./domain";
import type { Journal, JournalReading } from "./journals";
import {
  passageVerseIds,
  passagesInScope,
  passagesOutsideScope,
  textPage,
  textPageDestination,
} from "./textViewModel";
import "./map-design.css";

export type TextViewProps = {
  scope: Range;
  stats: Stats[];
  everStats?: Stats[];
  readings: JournalReading[];
  journals?: Journal[];
  onSelect: (verseId: number) => void;
  onReadingSelect?: (reading: JournalReading) => void;
  onScopeChange?: (range: Range) => void;
  frequencyUnit?: string;
};

export function TextView({
  scope,
  stats,
  everStats,
  readings,
  journals = [],
  onSelect,
  onReadingSelect,
  onScopeChange,
  frequencyUnit = "recorded readings",
}: TextViewProps) {
  const [phone, setPhone] = useState(
    () => window.matchMedia("(max-width: 767px)").matches,
  );
  const [anchor, setAnchor] = useState(scope.start),
    [query, setQuery] = useState(""),
    [error, setError] = useState("");
  const [found, setFound] = useState<Range[]>([]),
    [matchIndex, setMatchIndex] = useState(0),
    [searched, setSearched] = useState(false),
    [status, setStatus] = useState("");
  const errorId = useId(),
    pageSize = phone ? 4 : 12;
  const { page, total, start, end, lastPage } = textPage(
    scope,
    anchor,
    pageSize,
  );
  useEffect(() => {
    const media = window.matchMedia("(max-width: 767px)");
    const update = () => setPhone(media.matches);
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);
  useEffect(() => {
    setAnchor(scope.start);
    setFound([]);
    setSearched(false);
    setError("");
    setStatus("");
    setMatchIndex(0);
  }, [scope.start, scope.end]);
  const clipped = useMemo(
    () => passagesInScope(found, scope),
    [found, scope.start, scope.end],
  );
  const matches = useMemo(() => passageVerseIds(clipped), [clipped]);
  const omitted = passagesOutsideScope(found, scope);
  const selected = matches[matchIndex];
  const records = (id: number) =>
    readings.filter((r) => r.ranges.some((q) => id >= q.start && id <= q.end));
  function dateFor(id: number) {
    const value = stats[id].last;
    return value ? formatReadingDate(value) : "No readings in this view";
  }
  function allTime(id: number) {
    return !stats[id].count && everStats?.[id].last
      ? `All-time last recorded: ${formatReadingDate(everStats[id].last!)}`
      : "";
  }
  function showMatch(index: number) {
    const id = matches[index];
    if (id === undefined) return;
    setMatchIndex(index);
    setAnchor(id);
    setStatus(
      `${reference(id)}. Match ${index + 1} of ${matches.length}. ${stats[id].count} ${frequencyUnit}.`,
    );
  }
  function pageTo(value: number) {
    const { anchor: nextAnchor, page: bounded } = textPageDestination(
      scope,
      value,
      pageSize,
    );
    setAnchor(nextAnchor);
    setStatus(
      `Showing verses ${bounded * pageSize + 1}–${Math.min(total, (bounded + 1) * pageSize)} of ${total}.`,
    );
  }
  function find(e: React.FormEvent) {
    e.preventDefault();
    try {
      const ranges = parsePassage(query);
      setFound(ranges);
      setSearched(true);
      setError("");
      setMatchIndex(0);
      const first = passagesInScope(ranges, scope)[0]?.start;
      if (first !== undefined) {
        setAnchor(first);
        setStatus(
          `Found ${reference(first)} in this scope. Zero recorded readings is also a match.`,
        );
      } else setStatus("No requested verses are in the current passage scope.");
    } catch (e) {
      setError((e as Error).message);
    }
  }
  const ids = passageVerseIds([{ start, end }]);
  function noteAccess(id: number) {
    const noted = records(id).filter((r) => r.notes.trim());
    return (
      <div className="r2-note-access">
        <span>
          {noted.length} {noted.length === 1 ? "note" : "notes"}
        </span>
        {noted.length > 0 && (
          <details>
            <summary>View note readings for {reference(id)}</summary>
            {noted.map((r) => (
              <div key={r.id}>
                {onReadingSelect ? (
                  <button
                    type="button"
                    className="quiet"
                    onClick={() => onReadingSelect(r)}
                  >
                    {r.ranges.map(rangeLabel).join("; ")} ·{" "}
                    {formatReadingDate(r.startedAt)} ·{" "}
                    {journals.find((j) => j.id === r.journalId)?.name ||
                      "Journal"}
                  </button>
                ) : (
                  <p>
                    {formatReadingDate(r.startedAt)} ·{" "}
                    {journals.find((j) => j.id === r.journalId)?.name ||
                      "Journal"}
                  </p>
                )}
                <p className="r2-note-preview">{r.notes}</p>
              </div>
            ))}
          </details>
        )}
      </div>
    );
  }
  return (
    <section className="r2-text-view" aria-label="Text verse map">
      <div className="r2-text-heading">
        <h3>Every verse, in text</h3>
        <p>
          {rangeLabel(scope)} · {total.toLocaleString()} verses, including
          unrecorded verses. Counts show {frequencyUnit} in your applied journal
          and date view.
        </p>
      </div>
      <form className="r2-text-find" onSubmit={find}>
        <label>
          Find passage
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="John 3:16; Romans 8:1–4"
            aria-invalid={!!error}
            aria-describedby={error ? errorId : undefined}
          />
        </label>
        <button className="secondary">Find passage</button>
        {error && (
          <p className="inline-error" id={errorId} role="alert">
            {error}
          </p>
        )}
      </form>
      {searched && (
        <div className="r2-find-results">
          <p>
            {matches.length
              ? `${matches.length} matching verses in this scope. Match ${matchIndex + 1}: ${reference(selected)}.`
              : "No requested verses are in this passage scope. Your evidence filters and passage scope have been kept."}
          </p>
          {matches.length > 0 && (
            <div className="r2-map-actions">
              <button
                type="button"
                className="secondary"
                aria-disabled={matchIndex === 0}
                onClick={() => matchIndex > 0 && showMatch(matchIndex - 1)}
              >
                Previous match
              </button>
              <button
                type="button"
                className="secondary"
                aria-disabled={matchIndex >= matches.length - 1}
                onClick={() =>
                  matchIndex < matches.length - 1 && showMatch(matchIndex + 1)
                }
              >
                Next match
              </button>
            </div>
          )}
          {omitted.length > 0 && (
            <>
              <p>
                Outside this scope: {omitted.map(rangeLabel).join("; ")}. Choose
                one continuous passage to change geography.
              </p>
              {onScopeChange &&
                omitted.map((r) => (
                  <button
                    type="button"
                    className="secondary"
                    key={`${r.start}-${r.end}`}
                    onClick={() => onScopeChange(r)}
                  >
                    Change passage scope to {rangeLabel(r)}
                  </button>
                ))}
            </>
          )}
        </div>
      )}
      {!phone ? (
        <div className="r2-text-table-wrap">
          <table className="r2-text-table">
            <caption>
              {rangeLabel(scope)} · verses {start - scope.start + 1}–
              {end - scope.start + 1} of {total}
            </caption>
            <thead>
              <tr>
                <th scope="col">Verse</th>
                <th scope="col">Count</th>
                <th scope="col">Last recorded</th>
                <th scope="col">Personal notes</th>
                <th scope="col">Details</th>
              </tr>
            </thead>
            <tbody>
              {ids.map((id) => (
                <tr key={id} className={id === selected ? "is-selected" : ""}>
                  <th scope="row">{reference(id)}</th>
                  <td>{stats[id].count}</td>
                  <td>
                    {dateFor(id)}
                    {allTime(id) && <small>{allTime(id)}</small>}
                  </td>
                  <td>{noteAccess(id)}</td>
                  <td>
                    <button
                      type="button"
                      className="secondary"
                      onClick={() => onSelect(id)}
                    >
                      Inspect {reference(id)}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <ol className="r2-text-list" start={start - scope.start + 1}>
          {ids.map((id) => (
            <li key={id} className={id === selected ? "is-selected" : ""}>
              <h4>{reference(id)}</h4>
              <p>
                {stats[id].count} {frequencyUnit}
              </p>
              <p>{dateFor(id)}</p>
              {allTime(id) && <p>{allTime(id)}</p>}
              {noteAccess(id)}
              <button
                type="button"
                className="secondary"
                onClick={() => onSelect(id)}
              >
                Inspect {reference(id)}
              </button>
            </li>
          ))}
        </ol>
      )}
      <nav className="r2-text-pagination" aria-label="Text verse pages">
        <button
          type="button"
          className="secondary"
          aria-disabled={page === 0}
          onClick={() => page > 0 && pageTo(page - 1)}
        >
          Previous verses
        </button>
        <span>
          Verses {start - scope.start + 1}–{end - scope.start + 1} of{" "}
          {total.toLocaleString()} · Page {page + 1} of {lastPage + 1}
        </span>
        <button
          type="button"
          className="secondary"
          aria-disabled={page === lastPage}
          onClick={() => page < lastPage && pageTo(page + 1)}
        >
          Next verses
        </button>
      </nav>
      <p
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="r2-text-status"
      >
        {status}
      </p>
    </section>
  );
}
