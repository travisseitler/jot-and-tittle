import { formatReadingDate } from "./domain";
import { useEffect, useRef, useState } from "react";
import { layoutGeometry, hitTest } from "./layout";
import {
  books,
  verses,
  reference,
  metricColor,
  type Stats,
  type Range,
} from "./domain";
export function Heatmap({
  scope,
  stats,
  everStats,
  now = Date.now(),
  metric,
  layout,
  zoom,
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
  onSelect: (id: number) => void;
  onInspect?: (id: number) => void;
}) {
  const wrapper = useRef<HTMLDivElement>(null),
    canvas = useRef<HTMLCanvasElement>(null),
    overlay = useRef<HTMLCanvasElement>(null);
  const [width, setWidth] = useState(800),
    [hover, setHover] = useState<number | null>(null),
    [point, setPoint] = useState({ x: 0, y: 0 }),
    [focus, setFocus] = useState(scope.start);
  const stride = zoom;
  const {
    columns,
    offset,
    height,
    width: w,
  } = layoutGeometry(scope, width, stride, layout === "fixed-grid");
  useEffect(() => {
    const obs = new ResizeObserver((entries) =>
      setWidth(entries[0].contentRect.width),
    );
    if (wrapper.current) obs.observe(wrapper.current);
    return () => obs.disconnect();
  }, []);
  useEffect(() => {
    setFocus(scope.start);
    setHover(null);
  }, [scope.start, scope.end]);
  useEffect(() => {
    const c = canvas.current;
    if (!c) return;
    const dpr = window.devicePixelRatio || 1;
    c.width = w * dpr;
    c.height = height * dpr;
    c.style.width = w + "px";
    c.style.height = height + "px";
    const ctx = c.getContext("2d")!;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, w, height);
    for (let id = scope.start; id <= scope.end; id++) {
      const i = id - offset;
      ctx.fillStyle = metricColor(stats[id], metric, now);
      ctx.fillRect(
        (i % columns) * stride,
        Math.floor(i / columns) * stride,
        stride - 1,
        stride - 1,
      );
    }
  }, [
    width,
    scope.start,
    scope.end,
    stats,
    metric,
    layout,
    zoom,
    metric === "frequency" ? 0 : now,
  ]);
  useEffect(() => {
    const c = overlay.current;
    if (!c) return;
    const dpr = window.devicePixelRatio || 1;
    c.width = w * dpr;
    c.height = height * dpr;
    c.style.width = w + "px";
    c.style.height = height + "px";
    const ctx = c.getContext("2d")!;
    ctx.scale(dpr, dpr);
    if (hover === null) return;
    const b = books[verses[hover].book];
    // Trace the outer book boundary in the gaps, leaving every metric fill visible.
    const start = Math.max(b.start, scope.start),
      end = Math.min(b.end, scope.end);
    const firstRow = Math.floor((start - offset) / columns),
      lastRow = Math.floor((end - offset) / columns);
    ctx.strokeStyle = "#172915";
    ctx.lineWidth = 0.6;
    for (let row = firstRow; row <= lastRow; row++) {
      const left = row === firstRow ? (start - offset) % columns : 0;
      const right = row === lastRow ? ((end - offset) % columns) + 1 : columns;
      const x = left * stride - 0.5,
        y = row * stride - 0.5,
        length = (right - left) * stride;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x, y + stride);
      ctx.moveTo(x + length, y);
      ctx.lineTo(x + length, y + stride);
      if (row === firstRow) {
        ctx.moveTo(x, y);
        ctx.lineTo(x + length, y);
      }
      if (row === lastRow) {
        ctx.moveTo(x, y + stride);
        ctx.lineTo(x + length, y + stride);
      }
      ctx.stroke();
    }
    const i = hover - offset;
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 1.5;
    ctx.strokeRect(
      (i % columns) * stride - 1.5,
      Math.floor(i / columns) * stride - 1.5,
      stride + 2,
      stride + 2,
    );
    ctx.strokeStyle = "#172915";
    ctx.lineWidth = 0.8;
    ctx.strokeRect(
      (i % columns) * stride - 0.5,
      Math.floor(i / columns) * stride - 0.5,
      stride,
      stride,
    );
  }, [hover, width, layout, zoom, scope.start, scope.end]);
  function inspect(id: number) {
    const bounded = Math.max(scope.start, Math.min(scope.end, id));
    onInspect?.(bounded);
    setFocus(bounded);
    setHover(bounded);
    const i = bounded - offset;
    const x = (i % columns) * stride,
      y = Math.floor(i / columns) * stride;
    const container = wrapper.current;
    if (container) {
      if (x < container.scrollLeft) container.scrollLeft = x;
      else if (x + stride > container.scrollLeft + container.clientWidth)
        container.scrollLeft = x + stride - container.clientWidth;
      if (y < container.scrollTop) container.scrollTop = y;
      else if (y + stride > container.scrollTop + container.clientHeight)
        container.scrollTop = y + stride - container.clientHeight;
    }
    setPoint({
      x: (i % columns) * stride,
      y: Math.floor(i / columns) * stride,
    });
  }
  return (
    <div className="map-scroll" ref={wrapper}>
      <div className="canvas-wrap" style={{ width: w, height }}>
        <canvas
          ref={canvas}
          tabIndex={0}
          role="img"
          aria-label={`${metric === "combined" ? "Combined recency and frequency" : metric} verse map, ${scope.end - scope.start + 1} verses. Use arrow keys to inspect a verse and Enter to open its details.`}
          onFocus={() => inspect(focus)}
          onBlur={() => setHover(null)}
          onKeyDown={(e) => {
            const deltas: Record<string, number> = {
              ArrowRight: 1,
              ArrowLeft: -1,
              ArrowDown: columns,
              ArrowUp: -columns,
            };
            if (e.key in deltas) {
              e.preventDefault();
              inspect(focus + deltas[e.key]);
            } else if (e.key === "Home" || e.key === "End") {
              e.preventDefault();
              inspect(e.key === "Home" ? scope.start : scope.end);
            } else if (e.key === "Enter") {
              e.preventDefault();
              onSelect(focus);
            }
          }}
          onMouseMove={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const x = e.clientX - rect.left,
              y = e.clientY - rect.top;
            const id = hitTest(x, y, scope, columns, offset, stride);
            if (id !== null) {
              setHover(id);
              setPoint({ x, y });
            } else setHover(null);
          }}
          onMouseLeave={() => setHover(null)}
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const x = e.clientX - rect.left,
              y = e.clientY - rect.top;
            const id = hitTest(x, y, scope, columns, offset, stride);
            if (id !== null) onSelect(id);
          }}
        />
        <canvas className="overlay" ref={overlay} aria-hidden="true" />
        {hover !== null && (
          <div
            className="map-tooltip"
            role="status"
            style={{
              left: Math.min(point.x + 14, w - 210),
              top: Math.max(0, point.y - 76),
            }}
          >
            <strong>{reference(hover)}</strong>
            <span>
              {stats[hover].count
                ? `${stats[hover].count} reading${stats[hover].count === 1 ? "" : "s"} · Last read ${formatReadingDate(stats[hover].last!)}`
                : everStats?.[hover].count
                  ? "No readings in this period"
                  : "Never recorded"}
            </span>
            <small>
              {books[verses[hover].book].name} highlighted · Click to inspect
            </small>
          </div>
        )}
      </div>
    </div>
  );
}
