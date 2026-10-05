import {
  localDate,
  readingDate,
  validCalendarDate,
  type Reading,
} from "./domain";
export function periodBounds(
  mode: string,
  today: string,
  from: string,
  to: string,
): { from?: string; to?: string } {
  if (mode === "all") return {};
  if (mode === "month") return { from: today.slice(0, 7) + "-01", to: today };
  if (mode === "year") return { from: today.slice(0, 4) + "-01-01", to: today };
  if (!validCalendarDate(from) || !validCalendarDate(to))
    throw new Error("Choose valid start and end dates.");
  if (from > to)
    throw new Error("The start date must be on or before the end date.");
  return { from, to };
}
export function inPeriod(
  reading: Reading,
  bounds: { from?: string; to?: string },
) {
  const date = readingDate(reading.startedAt);
  return (
    (!bounds.from || date >= bounds.from) && (!bounds.to || date <= bounds.to)
  );
}
export function nextCalendarRefresh(now = Date.now()) {
  const midnight = new Date(now);
  midnight.setHours(24, 0, 0, 0);
  return midnight.getTime() - now;
}
