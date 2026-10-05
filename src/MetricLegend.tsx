import {
  combinedPalette,
  frequencyLabels,
  recencyLabels,
  palette,
} from "./domain";
export function MetricLegend({ metric }: { metric: string }) {
  if (metric !== "combined")
    return (
      <div className="legend">
        <span>{metric === "recency" ? "Older" : "Fewer"}</span>
        {[
          "Not recorded",
          ...(metric === "recency" ? recencyLabels : frequencyLabels),
        ].map((label, i) => (
          <i
            key={label}
            title={label}
            aria-label={label}
            style={{ background: palette[i] }}
          />
        ))}
        <span>{metric === "recency" ? "Recent" : "More"}</span>
      </div>
    );
  return (
    <div className="combined-legend">
      <span className="combined-key">
        <span>Older</span>
        {combinedPalette[2].map((color, i) => (
          <i key={i} style={{ background: color }} title={recencyLabels[i]} />
        ))}
        <span>Recent</span>
      </span>
      <span className="combined-key frequency-key">
        <span>Fewer</span>
        {combinedPalette.map((row, i) => (
          <i
            key={i}
            style={{ background: row[5] }}
            title={frequencyLabels[i]}
          />
        ))}
        <span>More</span>
      </span>
      <details className="legend-details">
        <summary>Read the colors</summary>
        <div className="legend-panel">
          <strong>Recency &amp; frequency, together</strong>
          <p>
            Brown to green shows when you last read a verse. Pale to dark shows
            how often you’ve read it. Date-only readings count calendar days;
            known times count elapsed hours. Today and the past 24 hours share
            the freshest color.
          </p>
          <table>
            <caption>Recency → · Frequency ↓</caption>
            <thead>
              <tr>
                <th scope="col">Readings</th>
                {[
                  "> 1 yr",
                  "3–12 mo",
                  "1–3 mo",
                  "7–30 d",
                  "1–7 d",
                  "Today / <24 h",
                ].map((label, i) => (
                  <th key={label} scope="col" title={recencyLabels[i]}>
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
                      title={`${frequencyLabels[f]} · ${recencyLabels[r]}`}
                      aria-label={`${frequencyLabels[f]}, last read ${recencyLabels[r].toLowerCase()}`}
                    />
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          <div className="never-key">
            <i style={{ background: palette[0] }} /> No recorded readings
          </div>
        </div>
      </details>
    </div>
  );
}
