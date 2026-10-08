import { useMemo } from "react";
import { ChevronRight } from "lucide-react";
import { books, reference, type Stats } from "./domain";

const pretty = (n: number) => n.toLocaleString();

export function PatternsView({
  stats,
  sessionCount,
  deduplicatesEncounters,
  onExploreBook,
  onInspectVerse,
}: {
  stats: Stats[];
  sessionCount: number;
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
  return (
    <>
      <section className="pattern-overview">
        <h2>Where does your reading take you?</h2>
        <p>
          {sessionCount
            ? `You’ve recorded ${sessionCount} reading sessions across ${bookStats.filter((b) => b.read).length} books. ${stats.filter((v) => v.count > 1).length} verses appear in more than one session.`
            : "Patterns emerge as you record readings. Start with a passage, then return here to explore."}
        </p>
      </section>
      <p className="counting-rule">
        {deduplicatesEncounters
          ? "Frequencies deduplicate shared encounters; session totals count reading records."
          : "Frequencies count reading records in this journal."}{" "}
        Map geography does not limit Patterns.
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
          <span>Verses with frequency greater than one</span>
        </div>
        <div className="stat">
          <div>VERSE READINGS</div>
          <strong>{pretty(stats.reduce((a, s) => a + s.count, 0))}</strong>
          <span>Sum of verse frequencies in this evidence view</span>
        </div>
      </section>
      <section className="panel">
        <div className="section-title">
          <h2>Where have you been reading?</h2>
          <span className="muted">
            Unique verses recorded · canonical order
          </span>
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
          The ten most frequently recorded verses. Ties follow canonical order.
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
            Repeated readings will appear here as your history grows.
          </p>
        )}
      </section>
    </>
  );
}
