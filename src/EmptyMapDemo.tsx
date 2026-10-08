import { useState, type CSSProperties } from "react";
import { Pause, Play } from "lucide-react";
import { combinedPalette, palette } from "./domain";

const columns = 44;
const cells = Array.from({ length: columns * 26 }, (_, index) => {
  // Contiguous runs wrap across rows, just like passages in the verse map.
  const passage =
    index >= 4 * columns + 5 && index < 4 * columns + 39
      ? 1
      : index >= 10 * columns + 21 && index < 11 * columns + 32
        ? 2
        : index >= 17 * columns + 28 && index < 18 * columns + 18
          ? 3
          : 0;
  return { index, passage };
});

export function EmptyMapDemo() {
  const [paused, setPaused] = useState(false);
  return (
    <figure className={`empty-map-demo${paused ? " is-paused" : ""}`}>
      <svg
        viewBox="0 0 600 280"
        role="img"
        aria-label="Illustration of a zoomed-in verse grid filling with color as readings are added over time."
        style={
          {
            "--demo-empty": palette[0],
            "--demo-new": combinedPalette[0][5],
            "--demo-aged": combinedPalette[0][2],
            "--demo-repeat": combinedPalette[1][5],
          } as CSSProperties
        }
      >
        <g className="demo-camera">
          <g className="demo-grid">
            {cells.map(({ index, passage }) => (
              <rect
                key={index}
                x={(index % columns) * 22}
                y={Math.floor(index / columns) * 22}
                width="19"
                height="19"
                rx="1.5"
                className={
                  passage ? `demo-passage demo-passage-${passage}` : undefined
                }
                fill={palette[0]}
              />
            ))}
          </g>
        </g>
      </svg>
      <figcaption>
        <span>
          <i aria-hidden="true" /> How recorded readings color the map{" "}
          <small>Illustration · no readings saved</small>
        </span>
        <button
          className="quiet demo-pause"
          onClick={() => setPaused(!paused)}
          aria-label={paused ? "Play map demo" : "Pause map demo"}
        >
          {paused ? <Play size={14} /> : <Pause size={14} />}
          {paused ? "Play" : "Pause"}
        </button>
      </figcaption>
    </figure>
  );
}
