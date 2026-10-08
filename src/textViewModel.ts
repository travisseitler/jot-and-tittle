import type { Range } from "./domain";

/** Inclusive verse bounds for the page containing an anchor in the current scope. */
export function textPage(scope: Range, anchor: number, pageSize: number) {
  const total = scope.end - scope.start + 1;
  const page = Math.floor(
    (Math.max(scope.start, Math.min(scope.end, anchor)) - scope.start) /
      pageSize,
  );
  const start = scope.start + page * pageSize;
  return {
    total,
    page,
    start,
    end: Math.min(scope.end, start + pageSize - 1),
    lastPage: Math.ceil(total / pageSize) - 1,
  };
}

/** Resolve a pager request to the first verse of a bounded page. */
export function textPageDestination(
  scope: Range,
  page: number,
  pageSize: number,
) {
  const lastPage = Math.ceil((scope.end - scope.start + 1) / pageSize) - 1;
  const bounded = Math.max(0, Math.min(lastPage, page));
  return { page: bounded, anchor: scope.start + bounded * pageSize };
}

/** Keep intersections in request order, including repeated requested verses. */
export function passagesInScope(ranges: Range[], scope: Range): Range[] {
  return ranges
    .map((r) => ({
      start: Math.max(r.start, scope.start),
      end: Math.min(r.end, scope.end),
    }))
    .filter((r) => r.start <= r.end);
}

/** Keep the before/after pieces of each request as separate continuous passages. */
export function passagesOutsideScope(ranges: Range[], scope: Range): Range[] {
  return ranges.flatMap((r) => {
    const parts: Range[] = [];
    if (r.start < scope.start)
      parts.push({ start: r.start, end: Math.min(r.end, scope.start - 1) });
    if (r.end > scope.end)
      parts.push({ start: Math.max(r.start, scope.end + 1), end: r.end });
    return parts;
  });
}

export function passageVerseIds(ranges: Range[]): number[] {
  return ranges.flatMap((r) =>
    Array.from({ length: r.end - r.start + 1 }, (_, i) => r.start + i),
  );
}
