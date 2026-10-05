import { bucket, localDate, validCalendarDate, type Stats } from "./domain";
import { nextCalendarRefresh } from "./periods";
export function recencyRefreshDelay(
  stats: Stats[],
  now: number,
  metric: string,
) {
  let next = Math.min(now + 3600000, now + nextCalendarRefresh(now));
  if (metric !== "frequency")
    for (const s of stats) {
      if (!s.last) continue;
      if (validCalendarDate(s.last)) {
        for (const days of [0, 1, 7, 30, 90, 365]) {
          const boundary = new Date(s.last + "T00:00:00");
          boundary.setDate(boundary.getDate() + days);
          const timestamp = boundary.getTime();
          if (timestamp > now) next = Math.min(next, timestamp);
        }
      } else {
        for (const days of [0, 1, 7, 30, 90, 365]) {
          const timestamp = Date.parse(s.last) + days * 86400000;
          if (timestamp > now) next = Math.min(next, timestamp);
        }
      }
    }
  return Math.max(1, next - now);
}
export function clockContext(now: number) {
  const date = new Date(now);
  return (
    localDate(date) +
    "|" +
    Intl.DateTimeFormat().resolvedOptions().timeZone +
    "|" +
    date.getTimezoneOffset()
  );
}
export function recencySignature(stats: Stats[], now: number, metric: string) {
  return metric === "frequency"
    ? ""
    : stats.map((s) => bucket(s, "recency", now)).join("");
}
