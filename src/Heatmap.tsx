import { useEffect, useId, useRef, useState } from "react";
import { layoutGeometry, hitTest } from "./layout";
import {
  books,
  verses,
  reference,
  metricColor,
  formatReadingDate,
  type Stats,
  type Range,
} from "./domain";
import "./map-design.css";

export function Heatmap({
  scope,
  stats,
  everStats,
  now = Date.now(),
  metric,
  layout,
  zoom,
  frequencyUnit = "recorded readings",
  selected,
  onSelect,
  onInspect,
}: {
  scope: Range;
  stats: Stats[];
  everStats?: Stats[];
  now?: number;
  metric: string;
  layout: string;
  zoom: number;
  frequencyUnit?: string;
  selected?: number | null;
  onSelect: (id: number) => void;
  onInspect?: (id: number) => void;
}) {
  const wrapper = useRef<HTMLDivElement>(null),
    canvas = useRef<HTMLCanvasElement>(null),
    overlay = useRef<HTMLCanvasElement>(null);
  const pointer = useRef<{
    id: number;
    x: number;
    y: number;
    left: number;
    top: number;
    moved: boolean;
  } | null>(null);
  const [width, setWidth] = useState(800),
    [hover, setHover] = useState<number | null>(null),
    [focus, setFocus] = useState(scope.start);
  const [preview, setPreview] = useState<number | null>(null),
    [announcement, setAnnouncement] = useState("");
  const [announceId, setAnnounceId] = useState<number | null>(null);
  const instructions = useId();
  const stride = zoom + 1;
  const {
    columns,
    offset,
    height,
    width: w,
  } = layoutGeometry(scope, width, stride, layout === "fixed-grid");
  const boundedFocus = Math.max(scope.start, Math.min(scope.end, focus));
  function summary(id: number) {
    const s = stats[id];
    return `${reference(id)} · ${s.count} ${frequencyUnit} · ${s.last ? `Last recorded ${formatReadingDate(s.last)}` : everStats?.[id].count ? "No readings in this view" : "Never recorded in these journals"}`;
  }
  useEffect(() => {
    const obs = new ResizeObserver((entries) => {
      const measuredWidth = entries[0].contentRect.width;
      // Preserve the last usable geometry while this presentation is hidden.
      if (measuredWidth > 0) setWidth(measuredWidth);
    });
    if (wrapper.current) obs.observe(wrapper.current);
    return () => obs.disconnect();
  }, []);
  useEffect(() => {
    setFocus(scope.start);
    setHover(null);
    setPreview(null);
    setAnnounceId(null);
  }, [scope.start, scope.end]);
  useEffect(() => {
    if (announceId === null) return;
    const timer = setTimeout(() => setAnnouncement(summary(announceId)), 220);
    return () => clearTimeout(timer);
  }, [announceId, stats, everStats, frequencyUnit]);
  useEffect(() => {
    const c = canvas.current;
    if (!c) return;
    const dpr = window.devicePixelRatio || 1;
    c.width = w * dpr;
    c.height = height * dpr;
    c.style.width = `${w}px`;
    c.style.height = `${height}px`;
    const ctx = c.getContext("2d")!;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, w, height);
    for (let id = scope.start; id <= scope.end; id++) {
      const i = id - offset;
      ctx.fillStyle = metricColor(stats[id], metric, now);
      ctx.fillRect(
        (i % columns) * stride,
        Math.floor(i / columns) * stride,
        zoom,
        zoom,
      );
    }
  }, [
    w,
    height,
    columns,
    offset,
    scope.start,
    scope.end,
    stats,
    metric,
    layout,
    zoom,
    now,
  ]);
  useEffect(() => {
    const c = overlay.current;
    if (!c) return;
    const dpr = window.devicePixelRatio || 1;
    c.width = w * dpr;
    c.height = height * dpr;
    c.style.width = `${w}px`;
    c.style.height = `${height}px`;
    const ctx = c.getContext("2d")!;
    ctx.scale(dpr, dpr);
    if (hover !== null) {
      const book = books[verses[hover].book],
        start = Math.max(book.start, scope.start),
        end = Math.min(book.end, scope.end);
      const first = Math.floor((start - offset) / columns),
        last = Math.floor((end - offset) / columns);
      ctx.strokeStyle = "#29392e";
      ctx.lineWidth = 0.7;
      for (let row = first; row <= last; row++) {
        const left = row === first ? (start - offset) % columns : 0,
          right = row === last ? ((end - offset) % columns) + 1 : columns;
        const x = left * stride + 0.5,
          y = row * stride + 0.5,
          length = (right - left) * stride - 1;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x, y + zoom);
        ctx.moveTo(x + length, y);
        ctx.lineTo(x + length, y + zoom);
        if (row === first) {
          ctx.moveTo(x, y);
          ctx.lineTo(x + length, y);
        }
        if (row === last) {
          ctx.moveTo(x, y + zoom);
          ctx.lineTo(x + length, y + zoom);
        }
        ctx.stroke();
      }
    }
    const locators = new Set(
      [selected, preview, hover].filter(
        (id): id is number =>
          id !== null &&
          id !== undefined &&
          id >= scope.start &&
          id <= scope.end,
      ),
    );
    for (const id of locators) {
      const i = id - offset,
        x = (i % columns) * stride,
        y = Math.floor(i / columns) * stride;
      ctx.strokeStyle = "#29392e";
      ctx.lineWidth = 2;
      ctx.strokeRect(x + 0.5, y + 0.5, zoom - 1, zoom - 1);
      ctx.strokeStyle = "#fffef9";
      ctx.lineWidth = 1;
      ctx.strokeRect(
        x + 1.5,
        y + 1.5,
        Math.max(1, zoom - 3),
        Math.max(1, zoom - 3),
      );
    }
  }, [
    hover,
    preview,
    selected,
    w,
    height,
    columns,
    offset,
    zoom,
    scope.start,
    scope.end,
  ]);
  function inspect(id: number) {
    const bounded = Math.max(scope.start, Math.min(scope.end, id));
    setFocus(bounded);
    setPreview(bounded);
    setAnnounceId(bounded);
    onInspect?.(bounded);
    const i = bounded - offset,
      x = (i % columns) * stride,
      y = Math.floor(i / columns) * stride,
      container = wrapper.current;
    if (container) {
      if (x < container.scrollLeft) container.scrollLeft = x;
      else if (x + stride > container.scrollLeft + container.clientWidth)
        container.scrollLeft = x + stride - container.clientWidth;
      if (y < container.scrollTop) container.scrollTop = y;
      else if (y + stride > container.scrollTop + container.clientHeight)
        container.scrollTop = y + stride - container.clientHeight;
    }
  }
  function pointerVerse(e: React.PointerEvent<HTMLCanvasElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    return hitTest(
      e.clientX - rect.left,
      e.clientY - rect.top,
      scope,
      columns,
      offset,
      stride,
    );
  }
  const shown = preview ?? hover;
  return (
    <section className="r2-map-navigator" aria-label="Verse map navigation">
      <details className="r2-map-help">
        <summary>Map keyboard help</summary>
        <p id={instructions} className="r2-map-instructions">
          Arrow keys explore verses. Home and End move to row edges; Ctrl+Home
          and Ctrl+End reach the scope edges. Enter inspects. You can also use
          Verse list or the reference controls.
        </p>
      </details>
      <div
        role="group"
        tabIndex={0}
        aria-label={`${metric === "combined" ? "Combined recency and frequency" : metric} verse map, ${scope.end - scope.start + 1} verses`}
        aria-describedby={instructions}
        className="r2-spatial-control"
        onFocus={(e) => {
          if (e.target === e.currentTarget && !pointer.current)
            inspect(boundedFocus);
        }}
        onKeyDown={(e) => {
          if (e.target !== e.currentTarget) return;
          const deltas: Record<string, number> = {
            ArrowRight: 1,
            ArrowLeft: -1,
            ArrowDown: columns,
            ArrowUp: -columns,
          };
          if (e.key in deltas) {
            e.preventDefault();
            inspect(boundedFocus + deltas[e.key]);
          } else if (e.key === "Home" || e.key === "End") {
            e.preventDefault();
            const rowStart =
              offset + Math.floor((boundedFocus - offset) / columns) * columns;
            inspect(
              e.ctrlKey
                ? e.key === "Home"
                  ? scope.start
                  : scope.end
                : e.key === "Home"
                  ? Math.max(scope.start, rowStart)
                  : Math.min(scope.end, rowStart + columns - 1),
            );
          } else if (e.key === "Enter") {
            e.preventDefault();
            onSelect(boundedFocus);
          } else if (e.key === "Escape") {
            e.preventDefault();
            setPreview(null);
            setHover(null);
          }
        }}
      >
        <div
          className="map-scroll"
          ref={wrapper}
          onScroll={() => {
            if (pointer.current) pointer.current.moved = true;
            setHover(null);
          }}
        >
          <div className="canvas-wrap" style={{ width: w, height }}>
            <canvas
              ref={canvas}
              aria-hidden="true"
              onPointerDown={(e) => {
                const c = wrapper.current!;
                pointer.current = {
                  id: e.pointerId,
                  x: e.clientX,
                  y: e.clientY,
                  left: c.scrollLeft,
                  top: c.scrollTop,
                  moved: false,
                };
              }}
              onPointerMove={(e) => {
                const p = pointer.current;
                if (p && Math.hypot(e.clientX - p.x, e.clientY - p.y) > 6)
                  p.moved = true;
                if (e.pointerType === "mouse" && !p) setHover(pointerVerse(e));
              }}
              onPointerLeave={() => {
                setHover(null);
                pointer.current = null;
              }}
              onPointerCancel={() => {
                pointer.current = null;
              }}
              onPointerUp={(e) => {
                const p = pointer.current,
                  c = wrapper.current;
                pointer.current = null;
                if (
                  !p ||
                  p.id !== e.pointerId ||
                  p.moved ||
                  !c ||
                  c.scrollLeft !== p.left ||
                  c.scrollTop !== p.top
                )
                  return;
                const id = pointerVerse(e);
                if (id !== null) inspect(id);
              }}
            />
            <canvas className="overlay" ref={overlay} aria-hidden="true" />
          </div>
        </div>
      </div>
      <div className="r2-map-preview" aria-label="Verse preview">
        {shown !== null ? (
          <>
            <strong>{reference(shown)}</strong>
            <span>{summary(shown).split(" · ").slice(1).join(" · ")}</span>
            <small>
              {books[verses[shown].book].name}
              {preview === null ? " · Hover preview" : " · Selected preview"}
            </small>
          </>
        ) : (
          <span>
            Explore a verse or use Verse list for exact counts and dates.
          </span>
        )}
        <div className="r2-map-actions">
          <button
            type="button"
            className="secondary"
            disabled={boundedFocus <= scope.start}
            onClick={() => inspect(boundedFocus - 1)}
          >
            Previous verse
          </button>
          <button
            type="button"
            className="secondary"
            disabled={boundedFocus >= scope.end}
            onClick={() => inspect(boundedFocus + 1)}
          >
            Next verse
          </button>
          <button
            type="button"
            className="secondary"
            disabled={shown === null}
            onClick={() => shown !== null && onSelect(shown)}
          >
            Inspect passage
          </button>
          {preview !== null && (
            <button
              type="button"
              className="quiet"
              onClick={() => setPreview(null)}
            >
              Dismiss preview
            </button>
          )}
        </div>
      </div>
      <span
        className="r2-map-live"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        {announcement}
      </span>
    </section>
  );
}
