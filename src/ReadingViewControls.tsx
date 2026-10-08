import { useId, useRef, useState } from "react";
import type { Journal } from "./journals";
import { validCalendarDate } from "./domain";
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
  const chips = useRef<HTMLDivElement>(null);
  const startDate = useRef<HTMLInputElement>(null);
  const endDate = useRef<HTMLInputElement>(null);
  const feedbackId = useId();
  const helpId = useId();
  const [announcement, setAnnouncement] = useState("");
  const [invalidDate, setInvalidDate] = useState<"from" | "to" | null>(null);
  function apply(view: View) {
    props.onApply(view);
    const names = props.sample
      ? "Sample readings"
      : view.journalMode === "single"
        ? props.journals.find((j) => j.id === props.currentJournalId)?.name
        : view.journalMode === "all"
          ? "All active journals"
          : view.ids
              .map((id) => props.journals.find((j) => j.id === id)?.name)
              .filter(Boolean)
              .join(", ") || "No journals selected";
    const bounds = periodBounds(view.mode, props.today, view.from, view.to);
    setAnnouncement(
      `Viewing ${names}, ${bounds.from ? `${bounds.from} through ${bounds.to}, inclusive` : "all time"}. Recording destination unchanged.`,
    );
  }
  function updateDraft(view: View) {
    setDraft(view);
    setError("");
    setInvalidDate(null);
  }
  function openDraft() {
    updateDraft({
      mode: props.mode,
      from: props.from,
      to: props.to,
      journalMode: props.journalMode,
      ids: [...props.ids],
    });
  }
  const changed = props.mode !== "all" || props.journalMode !== "single";
  function close() {
    setDraft(null);
    setError("");
    setInvalidDate(null);
    trigger.current?.focus();
  }
  function reset() {
    apply({
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
              ? "Sample readings"
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
          onClick={() => (draft ? close() : openDraft())}
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
        <div
          ref={chips}
          className="view-chips"
          aria-label="Active view filters"
        >
          {props.mode !== "all" && (
            <button
              className="secondary"
              onClick={() => {
                apply({ ...props, mode: "all" });
                trigger.current?.focus();
              }}
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
                onClick={() => {
                  const buttons = Array.from(
                    chips.current?.querySelectorAll<HTMLButtonElement>(
                      "button",
                    ) || [],
                  );
                  const remaining = buttons.find(
                    (button) =>
                      button !== document.activeElement &&
                      button.getAttribute("aria-label")?.startsWith("Remove "),
                  );
                  apply({
                    ...props,
                    journalMode: "selected",
                    ids: props.scopeIds.filter((v) => v !== id),
                  });
                  (remaining || trigger.current)?.focus();
                }}
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
      {!props.sample && !props.scopeIds.length && (
        <p className="view-empty">
          No journals selected.{" "}
          <button type="button" className="secondary" onClick={openDraft}>
            Choose journals
          </button>
        </p>
      )}
      <p className="sr-only" role="status">
        {announcement}
      </p>
      {draft && (
        <form
          id="view-readings-panel"
          className="view-panel"
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            try {
              periodBounds(draft.mode, props.today, draft.from, draft.to);
              apply(draft);
              close();
            } catch (e) {
              setError((e as Error).message);
              const field =
                !validCalendarDate(draft.from) ||
                (validCalendarDate(draft.to) && draft.from > draft.to)
                  ? "from"
                  : "to";
              setInvalidDate(field);
              (field === "from" ? startDate : endDate).current?.focus();
            }
          }}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              e.preventDefault();
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
              onChange={(e) => updateDraft({ ...draft, mode: e.target.value })}
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
                  ref={startDate}
                  type="date"
                  aria-invalid={invalidDate === "from" || undefined}
                  aria-describedby={error ? `${helpId} ${feedbackId}` : helpId}
                  value={draft.from}
                  onChange={(e) =>
                    updateDraft({ ...draft, from: e.target.value })
                  }
                />
              </label>
              <label className="field-label">
                End date
                <input
                  ref={endDate}
                  type="date"
                  aria-invalid={invalidDate === "to" || undefined}
                  aria-describedby={error ? `${helpId} ${feedbackId}` : helpId}
                  value={draft.to}
                  onChange={(e) =>
                    updateDraft({ ...draft, to: e.target.value })
                  }
                />
              </label>
            </div>
          )}
          {!props.sample &&
            !props.archived &&
            (props.journals.length > 1 ||
              draft.journalMode === "selected" ||
              !props.scopeIds.length) && (
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
          {error && (
            <p id={feedbackId} role="alert">
              {error}
            </p>
          )}
          <p id={helpId}>
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
