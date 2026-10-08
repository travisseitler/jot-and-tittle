import {
  combinedPalette,
  frequencyLabels,
  recencyLabels,
  palette,
} from "./domain";
import "./map-design.css";
export function MetricLegend({ metric }: { metric: string }) {
  if (metric !== "combined")
    return (
      <section
        className="r2-metric-legend"
        aria-label={`${metric === "recency" ? "Recency" : "Frequency"} color key`}
      >
        <ul className="r2-legend-buckets">
          {[
            "No qualifying date or records",
            ...(metric === "recency" ? recencyLabels : frequencyLabels),
          ].map((label, i) => (
            <li key={label}>
              <i
                className="r2-swatch"
                style={{ background: palette[i] }}
                aria-hidden="true"
              />
              <span>
                {i === 0 && metric === "frequency"
                  ? "No records in this view"
                  : label}
              </span>
            </li>
          ))}
        </ul>
        <p>
          Counts and exact dates are available in Text view and inspection. Gray
          can also mean a future recorded date in Recency.
        </p>
      </section>
    );
  return (
    <section className="r2-metric-legend" aria-label="Combined color key">
      <div className="combined-key">
        <span>Recency: older</span>
        {combinedPalette[2].map((color, i) => (
          <i
            className="r2-swatch"
            key={i}
            style={{ background: color }}
            title={recencyLabels[i]}
            aria-hidden="true"
          />
        ))}
        <span>recent</span>
      </div>
      <div className="combined-key">
        <span>Frequency: fewer</span>
        {combinedPalette.map((row, i) => (
          <i
            className="r2-swatch"
            key={i}
            style={{ background: row[5] }}
            title={frequencyLabels[i]}
            aria-hidden="true"
          />
        ))}
        <span>more</span>
      </div>
      <details>
        <summary>View color key</summary>
        <h3>Recency and frequency, together</h3>
        <p>
          Brown to green shows when a verse was last recorded. Pale to dark
          shows how often. Date-only readings use calendar days; known times use
          elapsed hours. Counts follow the current journal-view counting rule.
        </p>
        <div className="r2-legend-scroll">
          <table>
            <caption>Frequency by recency: 36 color combinations</caption>
            <thead>
              <tr>
                <th scope="col">Frequency</th>
                {[
                  "365+ days",
                  "90–364 days",
                  "30–89 days",
                  "7–29 days",
                  "1–6 days",
                  "Today / within 24h",
                ].map((label) => (
                  <th key={label} scope="col">
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {combinedPalette.map((row, f) => (
                <tr key={f}>
                  <th scope="row">
                    {["1", "2–4", "5–9", "10–24", "25–49", "50+"][f]}
                  </th>
                  {row.map((color, r) => (
                    <td
                      key={r}
                      style={{ background: color }}
                      aria-label={`${frequencyLabels[f]}; last recorded ${recencyLabels[r]}`}
                    />
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p>
          <i
            className="r2-swatch"
            style={{ background: palette[0] }}
            aria-hidden="true"
          />{" "}
          Gray means no qualifying record or date; imported future dates may be
          gray despite a nonzero count. Inspect for exact filtered and all-time
          context.
        </p>
        <p>
          Small cells and neighboring hues can be difficult to distinguish. Text
          view provides the same counts and dates without depending on color.
          Recency and Frequency can also be viewed separately.
        </p>
      </details>
    </section>
  );
}
