import { useMemo } from "react";
import { ChevronRight } from "lucide-react";
import { books, reference, type Stats } from "./domain";

const pretty = (n: number) => n.toLocaleString();

export function PatternsView({
  stats,
  sessionCount,
  sample,
  hasReadings,
  readOnly,
  deduplicatesEncounters,
  onExploreBook,
  onInspectVerse,
}: {
  stats: Stats[];
  sessionCount: number;
  sample: boolean;
  hasReadings: boolean;
  readOnly: boolean;
  deduplicatesEncounters: boolean;
  onExploreBook: (bookIndex: number) => void;
  onInspectVerse: (verseId: number) => void;
}) {
  const bookStats = useMemo(
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
  const bookCount = bookStats.filter((b) => b.read).length;
  const revisitedCount = stats.filter((v) => v.count > 1).length;
  return (
    <>
      <section className="pattern-overview">
        <h2>In this view</h2>
        <p>
          {sessionCount
            ? `${sample ? "This sample" : "This view"} contains ${sessionCount} reading ${sessionCount === 1 ? "session" : "sessions"} across ${bookCount} ${bookCount === 1 ? "book" : "books"}. ${revisitedCount} ${revisitedCount === 1 ? "verse has" : "verses have"} more than one counted reading.`
            : readOnly
              ? "No readings from this archived journal appear in this view. Return to active journal to view your current readings."
              : hasReadings || sample
                ? "No readings in this view. Choose View readings to change journals or dates."
                : "Patterns emerge as you record readings. Log a passage, then return here to explore."}
        </p>
      </section>
      <p className="counting-rule">
        {sample
          ? "Verse counts reflect sample readings."
          : deduplicatesEncounters
            ? "Linked records of the same reading count once per verse in this view."
            : "Verse counts include each reading saved in this journal."}{" "}
        Reading sessions count each saved record. Patterns include all books in
        the journals and dates you’re viewing; book and passage choices on the
        map do not limit them.
        {deduplicatesEncounters && (
          <>
            {" "}
            One reading copied into two journals: one count per verse, two saved
            records when both copies are in this view.
          </>
        )}
      </p>
      <section className="stats-row">
        <div className="stat">
          <div>UNIQUE VERSES</div>
          <strong>{pretty(stats.filter((s) => s.count).length)}</strong>
          <span>Verses with at least one recorded reading</span>
        </div>
        <div className="stat">
          <div>REVISITED VERSES</div>
          <strong>{pretty(stats.filter((s) => s.count > 1).length)}</strong>
          <span>Verses with more than one counted reading</span>
        </div>
        <div className="stat">
          <div>VERSE READINGS</div>
          <strong>{pretty(stats.reduce((a, s) => a + s.count, 0))}</strong>
          <span>Sum of verse counts in this view</span>
        </div>
      </section>
      <section className="panel">
        <div className="section-title">
          <h2>Where have you been reading?</h2>
          <span className="muted">Unique verses recorded · Bible order</span>
        </div>
        <details className="book-breakdown">
          <summary>Explore all 66 books</summary>
          <div className="book-grid">
            {bookStats.map((b) => (
              <button
                className="book-stat"
                key={b.index}
                onClick={() => onExploreBook(b.index)}
              >
                <div>
                  <strong>{b.name}</strong>
                  <span>
                    {b.read
                      ? `${((b.read / (b.end - b.start + 1)) * 100).toFixed(1)}%`
                      : "0%"}
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
        </details>
      </section>
      <section className="panel return-panel">
        <h2>Places you return to</h2>
        <p className="muted">
          Up to ten verses recorded more than once, ordered by frequency. Ties
          follow Bible order.
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
              onClick={() => onInspectVerse(s.i)}
            >
              <span>{reference(s.i)}</span>
              <span>
                {s.count} readings <ChevronRight size={14} />
              </span>
            </button>
          ))}
        {!stats.some((s) => s.count > 1) && (
          <p className="muted">
            Verses recorded more than once will appear here.
          </p>
        )}
      </section>
    </>
  );
}
