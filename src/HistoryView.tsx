import React from "react";
import {
  Search,
  CalendarDays,
  ArrowRight,
  Layers,
  Trash2,
  BookOpen,
  Plus,
} from "lucide-react";
import {
  readingDate,
  formatReadingDate as formatDate,
  rangeLabel,
  rangeCount,
} from "./domain";
import type { Journal, JournalReading as Reading } from "./journals";

const pretty = (n: number) => n.toLocaleString();

function matchesHistoryQuery(reading: Reading, query: string) {
  return (
    reading.originalInput +
    " " +
    reading.notes +
    " " +
    reading.ranges.map(rangeLabel).join(" ") +
    " " +
    readingDate(reading.startedAt) +
    " " +
    formatDate(reading.startedAt)
  )
    .toLowerCase()
    .includes(query.toLowerCase());
}

export function HistoryView({
  sorted,
  sessionCount,
  hasReadings,
  sample,
  readOnly,
  journals,
  query,
  onQueryChange,
  onInspectReading,
  onMoveReading,
  onCopyReading,
  onDeleteReading,
  onLogReading,
}: {
  sorted: Reading[];
  sessionCount: number;
  hasReadings: boolean;
  sample: boolean;
  readOnly: boolean;
  journals: Journal[];
  query: string;
  onQueryChange: (query: string) => void;
  onInspectReading: (reading: Reading) => void;
  onMoveReading: (reading: Reading) => void;
  onCopyReading: (reading: Reading) => void;
  onDeleteReading: (reading: Reading) => void;
  onLogReading: () => void;
}) {
  const matchingReadings = sorted.filter((reading) =>
    matchesHistoryQuery(reading, query),
  );
  return (
    <section className="panel">
      <div className="section-title">
        <h2>{sessionCount} reading sessions</h2>
        <span className="muted">
          {query && `${matchingReadings.length} search results`}
        </span>
        <div className="history-search">
          <Search size={15} />
          <input
            aria-label="Search reading history"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            placeholder="Search dates, passages or notes"
          />
        </div>
      </div>
      {matchingReadings.map((r, index, rows) => (
        <React.Fragment key={r.id}>
          {(index === 0 ||
            readingDate(rows[index - 1].startedAt) !==
              readingDate(r.startedAt)) && (
            <h3 className="history-day-heading">{formatDate(r.startedAt)}</h3>
          )}
          <div className="history-row" key={r.id}>
            <button
              className="history-date"
              onClick={() => onInspectReading(r)}
            >
              <CalendarDays size={16} />
              {formatDate(r.startedAt)}
            </button>
            <div className="history-passage">
              <span>
                {sample
                  ? "Sample readings"
                  : journals.find((j) => j.id === r.journalId)?.name}
              </span>
              <button
                className="reading-title"
                onClick={() => onInspectReading(r)}
              >
                {r.ranges.map(rangeLabel).join("; ")}
              </button>
              <small>
                {pretty(rangeCount(r.ranges))} unique verses
                {r.notes && ` · ${r.notes}`}
              </small>
            </div>
            {!sample &&
              !readOnly &&
              !journals.find((j) => j.id === r.journalId)?.archived && (
                <details className="reading-actions">
                  <summary>More actions</summary>
                  <button
                    className="icon-btn"
                    disabled={
                      sample ||
                      readOnly ||
                      !!journals.find((j) => j.id === r.journalId)?.archived
                    }
                    aria-label={`Move ${r.originalInput}`}
                    onClick={() => onMoveReading(r)}
                  >
                    <ArrowRight size={16} /> Move
                  </button>
                  <button
                    className="icon-btn"
                    disabled={
                      sample ||
                      readOnly ||
                      !!journals.find((j) => j.id === r.journalId)?.archived
                    }
                    aria-label={`Copy ${r.originalInput}`}
                    onClick={() => onCopyReading(r)}
                  >
                    <Layers size={16} /> Copy
                  </button>

                  <button
                    className="icon-btn"
                    disabled={
                      sample ||
                      readOnly ||
                      !!journals.find((j) => j.id === r.journalId)?.archived
                    }
                    aria-label={`Delete ${r.originalInput}`}
                    onClick={() => onDeleteReading(r)}
                  >
                    <Trash2 size={16} /> Delete
                  </button>
                </details>
              )}
          </div>
        </React.Fragment>
      ))}
      {!sorted.length && (
        <div className="large-empty">
          <BookOpen size={32} />
          <h3>
            {hasReadings || sample
              ? "No readings in this view."
              : "A reading history starts with one passage."}
          </h3>
          <p>
            {hasReadings || sample
              ? "Change View readings or Reset view to see more of your history."
              : "Log a chapter, a few verses, or several passages together."}
          </p>
          <button className="primary" onClick={() => onLogReading()}>
            <Plus size={16} /> Log a reading
          </button>
        </div>
      )}
      {sorted.length > 0 && matchingReadings.length === 0 && (
        <p className="muted">
          No readings match your search.{" "}
          <button onClick={() => onQueryChange("")}>Clear search</button>
        </p>
      )}
    </section>
  );
}
