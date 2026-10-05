import { type JournalState } from "./journals";

export interface BackupRecord {
  initiatedAt: string;
  fingerprint: string;
}

// Sort records and object keys so database order and UI selection do not matter.
export async function exportFingerprint(state: JournalState): Promise<string> {
  const canonical = (value: unknown): unknown => {
    if (Array.isArray(value)) return value.map(canonical);
    if (value && typeof value === "object")
      return Object.fromEntries(
        Object.entries(value)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([key, item]) => [key, canonical(item)]),
      );
    return value;
  };
  const content = {
    journals: [...state.journals].sort((a, b) => a.id.localeCompare(b.id)),
    readings: [...state.readings].sort((a, b) => a.id.localeCompare(b.id)),
  };
  const hash = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(JSON.stringify(canonical(content))),
  );
  return Array.from(new Uint8Array(hash), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");
}
