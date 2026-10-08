import { useRef, useState } from "react";
import type { Journal } from "./journals";
import { periodBounds } from "./periods";

type View = {
  mode: string;
  from: string;
  to: string;
  journalMode: string;
  ids: string[];
};
type Props = View & {
  journals: Journal[];
  currentJournalId: string;
  destinationName: string;
  archived: boolean;
  sample: boolean;
  today: string;
  period: { from?: string; to?: string };
  scopeIds: string[];
  onApply: (view: View) => void;
};
/** Viewing is independent of the destination used when recording a reading. */
export function ReadingViewControls(props: Props) {
  const [draft, setDraft] = useState<View | null>(null);
  const [error, setError] = useState("");
  const trigger = useRef<HTMLButtonElement>(null);
  const changed = props.mode !== "all" || props.journalMode !== "single";
  function close() {
    setDraft(null);
    setError("");
    trigger.current?.focus();
  }
  function reset() {
    props.onApply({
      ...props,
      mode: "all",
      journalMode: "single",
      ids: [props.currentJournalId],
    });
    close();
  }
  return (
    <section className="view-controls" aria-label="Reading view">
      <div className="view-summary">
        <p>
          <strong>
            {props.sample
              ? "Example data"
              : props.scopeIds
                  .map((id) => props.journals.find((j) => j.id === id)?.name)
                  .join(", ") || "No journals selected"}
          </strong>
          <span>
            Applied period:{" "}
            {props.period.from
              ? `${props.period.from} through ${props.period.to} (inclusive)`
              : "All time"}
          </span>
        </p>
        <button
          ref={trigger}
          className="secondary"
          aria-expanded={!!draft}
          aria-controls="view-readings-panel"
          onClick={() =>
            draft
              ? close()
              : setDraft({
                  mode: props.mode,
                  from: props.from,
                  to: props.to,
                  journalMode: props.journalMode,
                  ids: [...props.ids],
                })
          }
        >
          View readings
        </button>
        {changed && (
          <button className="quiet" onClick={reset}>
            Reset view
          </button>
        )}
      </div>
      {changed && (
        <div className="view-chips" aria-label="Active view filters">
          {props.mode !== "all" && (
            <button
              className="secondary"
              onClick={() => props.onApply({ ...props, mode: "all" })}
            >
              Clear period filter
            </button>
          )}
          {!props.sample &&
            !props.archived &&
            props.journalMode !== "single" &&
            props.scopeIds.map((id) => (
              <button
                key={id}
                className="secondary"
                aria-label={`Remove ${props.journals.find((j) => j.id === id)?.name} from view`}
                onClick={() =>
                  props.onApply({
                    ...props,
                    journalMode: "selected",
                    ids: props.scopeIds.filter((v) => v !== id),
                  })
                }
              >
                {props.journals.find((j) => j.id === id)?.name} ×
              </button>
            ))}
        </div>
      )}
      {!props.sample && props.journalMode !== "single" && (
        <p className="destination-hint">
          Saving new readings to {props.destinationName}
        </p>
      )}
      {draft && (
        <form
          id="view-readings-panel"
          className="view-panel"
          onSubmit={(e) => {
            e.preventDefault();
            try {
              periodBounds(draft.mode, props.today, draft.from, draft.to);
              props.onApply(draft);
              close();
            } catch (e) {
              setError((e as Error).message);
            }
          }}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              e.stopPropagation();
              close();
            }
          }}
        >
          <label className="field-label">
            Reading period
            <select
              aria-label="Reading period"
              value={draft.mode}
              onChange={(e) => setDraft({ ...draft, mode: e.target.value })}
            >
              <option value="all">All time</option>
              <option value="month">This month</option>
              <option value="year">This year</option>
              <option value="custom">Custom dates</option>
            </select>
          </label>
          {draft.mode === "custom" && (
            <div className="view-date-fields">
              <label className="field-label">
                Start date
                <input
                  type="date"
                  value={draft.from}
                  onChange={(e) => setDraft({ ...draft, from: e.target.value })}
                />
              </label>
              <label className="field-label">
                End date
                <input
                  type="date"
                  value={draft.to}
                  onChange={(e) => setDraft({ ...draft, to: e.target.value })}
                />
              </label>
            </div>
          )}
          {!props.sample && !props.archived && props.journals.length > 1 && (
            <>
              <label className="field-label">
                View journals
                <select
                  aria-label="View journals"
                  value={draft.journalMode}
                  onChange={(e) =>
                    setDraft({ ...draft, journalMode: e.target.value })
                  }
                >
                  <option value="single">Current journal</option>
                  <option value="all">All active journals</option>
                  <option value="selected">Selected journals</option>
                </select>
              </label>
              {draft.journalMode === "selected" && (
                <fieldset>
                  <legend>Journals to include</legend>
                  {props.journals.map((j) => (
                    <label key={j.id}>
                      <input
                        type="checkbox"
                        checked={draft.ids.includes(j.id)}
                        onChange={(e) =>
                          setDraft({
                            ...draft,
                            ids: e.target.checked
                              ? [...draft.ids, j.id]
                              : draft.ids.filter((id) => id !== j.id),
                          })
                        }
                      />
                      {j.name}
                      {j.archived ? " (archived)" : ""}
                    </label>
                  ))}
                </fieldset>
              )}
            </>
          )}
          {error && <p role="alert">{error}</p>}
          <p>
            Recency is measured relative to today. Changing your view does not
            change where new readings are saved.
          </p>
          <div className="dialog-actions">
            <button type="button" className="secondary" onClick={close}>
              Cancel
            </button>
            <button className="primary">Apply view</button>
          </div>
        </form>
      )}
    </section>
  );
}
