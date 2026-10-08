import {
  Leaf,
  Clock3,
  ChartNoAxesColumnIncreasing,
  Grid2X2,
  Layers,
  Minus,
  Plus,
  Expand,
} from "lucide-react";
type Props = {
  metric: string;
  layout: string;
  zoom: number;
  setMetric: (v: string) => void;
  setLayout: (v: string) => void;
  setZoom: (v: number | ((previous: number) => number)) => void;
};
export function MapDisplayControls({
  metric,
  layout,
  zoom,
  setMetric,
  setLayout,
  setZoom,
}: Props) {
  return (
    <section
      id="map-display-panel"
      aria-label="Map display settings"
      className="map-display-panel"
    >
      <div
        className="segmented metric-tabs"
        role="group"
        aria-label="Map metric"
      >
        <button
          aria-pressed={metric === "combined"}
          className={metric === "combined" ? "chosen" : ""}
          onClick={() => setMetric("combined")}
        >
          <Leaf size={14} /> Combined
        </button>
        <button
          aria-pressed={metric === "recency"}
          className={metric === "recency" ? "chosen" : ""}
          onClick={() => setMetric("recency")}
        >
          <Clock3 size={14} /> Recency
        </button>
        <button
          aria-pressed={metric === "frequency"}
          className={metric === "frequency" ? "chosen" : ""}
          onClick={() => setMetric("frequency")}
        >
          <ChartNoAxesColumnIncreasing size={14} /> Frequency
        </button>
      </div>
      <div className="layout-controls">
        <div className="segmented compact">
          <button
            aria-pressed={layout === "continuous"}
            className={layout === "continuous" ? "chosen" : ""}
            onClick={() => setLayout("continuous")}
            title="Responsive, continuous flow"
          >
            <Grid2X2 size={13} /> Flow
          </button>
          <button
            aria-pressed={layout === "fixed-grid"}
            className={layout === "fixed-grid" ? "chosen" : ""}
            onClick={() => setLayout("fixed-grid")}
            title="Stable, 160-column canonical grid"
          >
            <Layers size={13} /> Fixed
          </button>
        </div>
        <span className="tool-divider" />
        <button
          className="icon-btn"
          aria-label="Zoom out"
          disabled={zoom <= 4}
          onClick={() => setZoom((x) => x - 2)}
        >
          <Minus size={15} />
        </button>
        <button
          className="icon-btn"
          aria-label="Zoom in"
          disabled={zoom >= 14}
          onClick={() => setZoom((x) => x + 2)}
        >
          <Plus size={15} />
        </button>
        <button
          className="icon-btn"
          aria-label="Reset zoom"
          onClick={() => setZoom(4)}
        >
          <Expand size={14} />
        </button>
      </div>
    </section>
  );
}
