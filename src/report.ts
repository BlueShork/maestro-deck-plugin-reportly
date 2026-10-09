/** The last run as Maestro Deck hands it over (`runs.latest`, `run.finished`). */
export interface ReportItem {
  name: string;
  status: "passed" | "failed" | "skipped";
  durationMs: number | null;
  error: string | null;
}

export interface RunReport {
  id: string;
  kind: "flow" | "all";
  status: "passed" | "failed" | "stopped";
  title: string;
  startedAt: number;
  durationMs: number;
  project: { name: string; branch: string | null };
  device: { platform: "android" | "ios" | "web" | "cloud"; name: string } | null;
  items: ReportItem[];
  totals: { passed: number; failed: number; skipped: number };
}
