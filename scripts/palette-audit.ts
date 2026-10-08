import { mkdirSync, writeFileSync } from "node:fs";
import {
  combinedPalette,
  metricColor,
  palette,
  recencyLabels,
  frequencyLabels,
} from "../src/domain";
// Machado severity-1 matrices, applied to linear sRGB. Source and limitations: PALETTE.md.
const matrices: Record<string, number[][]> = {
  protan: [
    [0.152286, 1.052583, -0.204868],
    [0.114503, 0.786281, 0.099216],
    [-0.003882, -0.048116, 1.051998],
  ],
  deutan: [
    [0.367322, 0.860646, -0.227968],
    [0.280085, 0.672501, 0.047413],
    [-0.01182, 0.04294, 0.968881],
  ],
  tritan: [
    [1.255528, -0.076749, -0.178779],
    [-0.078411, 0.930809, 0.147602],
    [0.004733, 0.691367, 0.3039],
  ],
};
const linear = (v: number) =>
  v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
const encoded = (v: number) =>
  v <= 0.0031308 ? v * 12.92 : 1.055 * v ** (1 / 2.4) - 0.055;
function rgb(color: string): number[] {
  if (color.startsWith("#"))
    return [1, 3, 5].map((i) => parseInt(color.slice(i, i + 2), 16) / 255);
  const [h, s, l] = color.match(/[0-9]+/g)!.map(Number);
  const sat = s / 100,
    light = l / 100;
  const a = sat * Math.min(light, 1 - light),
    f = (n: number) => {
      const k = (n + h / 30) % 12;
      return light - a * Math.max(-1, Math.min(k - 3, 9 - k, 1));
    };
  return [f(0), f(8), f(4)];
}
const luminance = (color: number[]) =>
  color
    .map(linear)
    .reduce((sum, v, i) => sum + v * [0.2126, 0.7152, 0.0722][i], 0);
function simulate(color: number[], condition: string) {
  if (condition === "grayscale")
    return Array(3).fill(encoded(luminance(color)));
  if (condition === "washed-out")
    return color.map((v, i) => 0.7 * v + 0.3 * rgb("#f5f6ee")[i]);
  const matrix = matrices[condition];
  return matrix
    ? matrix.map((row) =>
        Math.max(
          0,
          Math.min(
            1,
            encoded(row.reduce((a, v, i) => a + v * linear(color[i]), 0)),
          ),
        ),
      )
    : color;
}
function lab(color: number[]) {
  const [r, g, b] = color.map(linear);
  const f = (t: number) =>
    t > (6 / 29) ** 3 ? Math.cbrt(t) : t / (3 * (6 / 29) ** 2) + 4 / 29;
  const x = f((0.4124564 * r + 0.3575761 * g + 0.1804375 * b) / 0.95047),
    y = f(0.2126729 * r + 0.7151522 * g + 0.072175 * b),
    z = f((0.0193339 * r + 0.119192 * g + 0.9503041 * b) / 1.08883);
  return [116 * y - 16, 500 * (x - y), 200 * (y - z)];
}
const delta = (a: number[], b: number[]) =>
  Math.hypot(...lab(a).map((v, i) => v - lab(b)[i]));
const now = Date.parse("2026-10-05T12:00:00Z"),
  days = [400, 120, 45, 14, 3, 0],
  counts = [1, 2, 5, 10, 25, 50];
const dataset = counts.flatMap((count, f) =>
  days.map((age, r) => ({
    count,
    first: null,
    last: new Date(now - age * 86400000).toISOString(),
    frequency: f,
    recency: r,
  })),
);
for (const s of dataset)
  if (
    metricColor(s, "combined", now) !== combinedPalette[s.frequency][s.recency]
  )
    throw new Error("Map/palette mismatch");
mkdirSync("audits", { recursive: true });
writeFileSync(
  "audits/palette-reference.json",
  JSON.stringify(
    {
      referenceDate: new Date(now).toISOString(),
      counts,
      colors: combinedPalette,
      days,
      dataset,
    },
    null,
    2,
  ) + "\n",
);
const conditions = [
    "normal",
    "protan",
    "deutan",
    "tritan",
    "grayscale",
    "washed-out",
  ],
  report: any[] = [];
let svg =
  '<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1260"><rect width="1080" height="1260" fill="#f5f6ee"/><style>text{font:12px sans-serif;fill:#172915}</style><text x="20" y="22">Combined palette reference: frequency rows / recency columns; strides 4 (minimum/default), 8, 14</text>';
for (const [ci, condition] of conditions.entries()) {
  const colors = combinedPalette.map((row) =>
      row.map((c) => simulate(rgb(c), condition)),
    ),
    gray = simulate(rgb(palette[0]), condition);
  let minDrop = Infinity,
    minGray = Infinity;
  const difficult: any[] = [];
  for (let r = 0; r < 6; r++)
    for (let f = 0; f < 5; f++) {
      const drop = luminance(colors[f][r]) - luminance(colors[f + 1][r]);
      minDrop = Math.min(minDrop, drop);
      if (drop <= 0)
        throw new Error(`Frequency is not darker: ${condition} ${f} ${r}`);
    }
  for (let f = 0; f < 6; f++)
    for (let r = 0; r < 5; r++) {
      const d = delta(colors[f][r], colors[f][r + 1]);
      if (d < 10)
        difficult.push({
          frequency: frequencyLabels[f],
          pair: [recencyLabels[r], recencyLabels[r + 1]],
          deltaE76: +d.toFixed(2),
        });
    }
  for (const color of colors[0])
    minGray = Math.min(minGray, delta(color, gray));
  report.push({
    condition,
    minFrequencyLuminanceDrop: +minDrop.toFixed(4),
    minLightRecordedToGrayDeltaE76: +minGray.toFixed(2),
    difficultAdjacentRecencyPairs: difficult,
  });
  const y = ci * 200 + 45;
  svg += `<text x="20" y="${y}">${condition}</text>`;
  const hex = (color: number[]) =>
    "#" +
    color
      .map((v) =>
        Math.round(v * 255)
          .toString(16)
          .padStart(2, "0"),
      )
      .join("");
  for (let f = 0; f < 6; f++)
    for (let r = 0; r < 6; r++)
      svg += `<rect x="${20 + r * 36}" y="${y + 12 + f * 22}" width="34" height="20" fill="${hex(colors[f][r])}"/>`;
  svg += `<rect x="240" y="${y + 12}" width="34" height="20" fill="${hex(gray)}"/><text x="282" y="${y + 27}">unrecorded gray</text>`;
  for (const [si, stride] of [4, 8, 14].entries()) {
    const x = 420 + si * 190;
    svg += `<text x="${x}" y="${y + 12}">${stride}px stride</text>`;
    for (let repeat = 0; repeat < 1; repeat++)
      for (let f = 0; f < 6; f++)
        for (let r = 0; r < 6; r++)
          svg += `<rect x="${x + r * stride}" y="${y + 22 + (f + repeat * 6) * stride}" width="${stride - 1}" height="${stride - 1}" fill="${hex(colors[f][r])}"/>`;
  }
}
svg += "</svg>";
writeFileSync("audits/palette-reference.svg", svg);
writeFileSync(
  "audits/palette-report.json",
  JSON.stringify(report, null, 2) + "\n",
);
console.log(
  JSON.stringify(
    report.map(
      ({
        condition,
        minFrequencyLuminanceDrop,
        minLightRecordedToGrayDeltaE76,
        difficultAdjacentRecencyPairs,
      }) => ({
        condition,
        minFrequencyLuminanceDrop,
        minLightRecordedToGrayDeltaE76,
        difficultPairs: difficultAdjacentRecencyPairs.length,
      }),
    ),
    null,
    2,
  ),
);
