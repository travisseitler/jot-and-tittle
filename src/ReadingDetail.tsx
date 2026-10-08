import { Dialog } from "./Dialog";
import { rangeLabel, rangeCount, formatReadingDate } from "./domain";
import type { JournalReading } from "./journals";
export function ReadingDetail({
  reading,
  journalName,
  editable,
  onClose,
  onEdit,
}: {
  reading: JournalReading;
  journalName: string;
  editable: boolean;
  onClose: () => void;
  onEdit: () => void;
}) {
  return (
    <Dialog title="Reading details" onClose={onClose}>
      <h3>{reading.ranges.map(rangeLabel).join("; ")}</h3>
      <p className="dialog-intro">
        {formatReadingDate(reading.startedAt)} · {journalName} ·{" "}
        {rangeCount(reading.ranges)} unique verses
      </p>
      <p className="reading-notes">
        {reading.notes || "No notes for this reading."}
      </p>
      {editable && (
        <button className="primary" onClick={onEdit}>
          Edit reading
        </button>
      )}
    </Dialog>
  );
}
