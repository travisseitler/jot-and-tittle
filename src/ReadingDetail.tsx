import { useEffect, useId, useRef } from "react";
import { Dialog, restoreUsefulFocus } from "./Dialog";
import { rangeLabel, rangeCount, formatReadingDate } from "./domain";
import type { JournalReading } from "./journals";
export function ReadingDetail({
  reading,
  journalName,
  editable,
  onClose,
  onEdit,
  presentation = "dialog",
  returnLabel = "Back to history",
  restoreFocus,
}: {
  reading: JournalReading;
  journalName: string;
  editable: boolean;
  onClose: () => void;
  onEdit: () => void;
  presentation?: "dialog" | "pane" | "page";
  returnLabel?: string;
  restoreFocus?: HTMLElement | null;
}) {
  const titleId = useId();
  const heading = useRef<HTMLHeadingElement>(null);
  const origin = useRef<HTMLElement | null>(
    restoreFocus ?? (document.activeElement as HTMLElement),
  );
  const nonmodal = presentation !== "dialog";
  useEffect(() => {
    if (!nonmodal) return;
    heading.current?.focus();
    return () => restoreUsefulFocus(origin.current);
  }, [nonmodal]);
  const content = (
    <>
      <h2 id={titleId} ref={heading} tabIndex={-1}>
        {reading.ranges.map(rangeLabel).join("; ")}
      </h2>
      <p className="dialog-intro">
        {formatReadingDate(reading.startedAt)} · {journalName} ·{" "}
        {rangeCount(reading.ranges)} unique verses
      </p>
      {!editable && <p className="detail-readonly">Read-only reading</p>}
      <p className="reading-notes">
        {reading.notes || "No notes for this reading."}
      </p>
      {editable && (
        <button type="button" className="primary" onClick={onEdit}>
          Edit reading
        </button>
      )}
    </>
  );
  if (!nonmodal)
    return (
      <Dialog
        title="Reading details"
        initialFocus="heading"
        onClose={onClose}
        restoreFocus={restoreFocus}
      >
        {content}
      </Dialog>
    );
  const Tag = presentation === "pane" ? "aside" : "section";
  return (
    <Tag
      className={`reading-detail reading-detail-${presentation}`}
      aria-labelledby={titleId}
      onKeyDown={(e) => {
        if (
          e.key === "Escape" &&
          !(e.target as HTMLElement).closest(
            'input,textarea,select,form,[contenteditable="true"]',
          )
        ) {
          e.preventDefault();
          e.stopPropagation();
          onClose();
        }
      }}
    >
      <button type="button" className="secondary" onClick={onClose}>
        {presentation === "pane" ? "Close reading details" : returnLabel}
      </button>
      {content}
    </Tag>
  );
}
