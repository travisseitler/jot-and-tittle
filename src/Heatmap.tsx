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
  metric,
  layout,
  zoom,
  onSelect,
}: {
  scope: Range;
  stats: Stats[];
  metric: string;
  layout: string;
  zoom: number;
  onSelect: (id: number) => void;
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
    const now = Date.now();
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
  }, [width, scope.start, scope.end, stats, metric, layout, zoom]);
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
    ctx.strokeStyle = "#577541";
    ctx.lineWidth = 0.65;
    const start = Math.max(b.start, scope.start),
      end = Math.min(b.end, scope.end);
    for (let id = start; id <= end; id++) {
      const i = id - offset;
      ctx.strokeRect(
        (i % columns) * stride - 0.3,
        Math.floor(i / columns) * stride - 0.3,
        stride - 0.4,
        stride - 0.4,
      );
    }
    const i = hover - offset;
    ctx.strokeStyle = "#172915";
    ctx.lineWidth = 1.7;
    ctx.strokeRect(
      (i % columns) * stride - 1,
      Math.floor(i / columns) * stride - 1,
      stride + 1,
      stride + 1,
    );
  }, [hover, width, layout, zoom, scope.start, scope.end]);
  function inspect(id: number) {
    const bounded = Math.max(scope.start, Math.min(scope.end, id));
    setFocus(bounded);
    setHover(bounded);
    const i = bounded - offset;
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
        <canvas className="overlay" ref={overlay} />
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
                : "No recorded readings"}
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
