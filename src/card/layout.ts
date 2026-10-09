import type { ReportItem, RunReport } from "../report";

export const WIDTH = 1200;
export const PAD = 48;
export const HEADER_H = 88;
export const BANNER_H = 112;
export const DEVICE_H = 40;
export const ROW_H = 44;
export const ERROR_H = 24;
export const FOOTER_H = 56;
export const MAX_ROWS = 25;
const NAME_MAX = 70;
const ERROR_MAX = 120;

export interface CardRow {
  name: string;
  status: ReportItem["status"];
  duration: string;
  error: string | null;
}

export function formatDuration(ms: number | null): string {
  if (ms === null) return "—";
  if (ms < 1000) return `${Math.round(ms)}ms`;
  if (ms < 60_000) return `${(ms / 1000).toFixed(1)}s`;
  const s = Math.round(ms / 1000);
  return `${Math.floor(s / 60)}m ${String(s % 60).padStart(2, "0")}s`;
}

export function truncate(s: string, max: number): string {
  const flat = s.replace(/\s+/g, " ").trim();
  return flat.length <= max ? flat : `${flat.slice(0, max - 1)}…`;
}

const unit = (r: RunReport, n: number) =>
  r.kind === "all" ? (n === 1 ? "flow" : "flows") : n === 1 ? "step" : "steps";

export function banner(r: RunReport): { title: string; tone: "success" | "error" | "warning" } {
  if (r.status === "stopped") return { title: "Run stopped", tone: "warning" };
  if (r.status === "passed") return { title: "All tests passed", tone: "success" };
  const n = r.totals.failed;
  return { title: n ? `${n} ${unit(r, n)} failed` : "Run failed", tone: "error" };
}

/** Rows to draw (failures first, capped), the tail line, and the card height. */
export function layoutReport(r: RunReport) {
  const sorted = [
    ...r.items.filter((i) => i.status === "failed"),
    ...r.items.filter((i) => i.status !== "failed"),
  ];
  const rows: CardRow[] = sorted.slice(0, MAX_ROWS).map((i) => ({
    name: truncate(i.name, NAME_MAX),
    status: i.status,
    duration: formatDuration(i.durationMs),
    error: i.status === "failed" && i.error ? truncate(i.error, ERROR_MAX) : null,
  }));
  const hidden = sorted.length - rows.length;
  const overflow = hidden > 0 ? `… and ${hidden} more ${unit(r, hidden)}` : null;
  const empty = rows.length === 0 ? `No ${unit(r, 1)} finished` : null;
  const listH =
    rows.reduce((h, row) => h + ROW_H + (row.error ? ERROR_H : 0), 0) +
    (overflow || empty ? ROW_H : 0);
  return {
    rows,
    overflow,
    empty,
    height: HEADER_H + BANNER_H + DEVICE_H + listH + FOOTER_H + 2 * PAD,
  };
}

/** Project · branch · date, without repeating the project when it is the title (Run All). */
export function headerMeta(r: RunReport, when: string): string {
  const project = r.project.name === r.title ? null : r.project.name;
  return [project, r.project.branch, when].filter(Boolean).join("  ·  ");
}

const PLATFORM: Record<string, string> = { android: "Android", ios: "iOS", web: "Web" };

export function deviceLabel(r: RunReport): string {
  if (!r.device) return "Unknown device";
  if (r.device.platform === "cloud") return r.device.name;
  return `${PLATFORM[r.device.platform] ?? r.device.platform} · ${r.device.name}`;
}
