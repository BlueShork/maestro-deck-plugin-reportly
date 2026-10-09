import { describe, expect, it } from "vitest";

import type { ReportItem, RunReport } from "../report";
import {
  BANNER_H,
  DEVICE_H,
  ERROR_H,
  FOOTER_H,
  HEADER_H,
  MAX_ROWS,
  PAD,
  ROW_H,
  banner,
  deviceLabel,
  formatDuration,
  headerMeta,
  layoutReport,
  truncate,
} from "./layout";

const item = (
  name: string,
  status: ReportItem["status"] = "passed",
  error: string | null = null,
): ReportItem => ({ name, status, durationMs: 1200, error });

const report = (items: ReportItem[], over: Partial<RunReport> = {}): RunReport => ({
  id: "r",
  kind: "all",
  status: "passed",
  title: "shop",
  startedAt: 0,
  durationMs: 65_000,
  project: { name: "shop", branch: "main" },
  device: { platform: "android", name: "Pixel 8" },
  items,
  totals: {
    passed: items.filter((i) => i.status === "passed").length,
    failed: items.filter((i) => i.status === "failed").length,
    skipped: items.filter((i) => i.status === "skipped").length,
  },
  ...over,
});

describe("formatDuration", () => {
  it("formats ms, seconds and minutes", () => {
    expect(formatDuration(null)).toBe("—");
    expect(formatDuration(850)).toBe("850ms");
    expect(formatDuration(12_340)).toBe("12.3s");
    expect(formatDuration(65_000)).toBe("1m 05s");
  });
});

describe("truncate", () => {
  it("collapses whitespace and cuts with an ellipsis", () => {
    expect(truncate("a\n  b", 10)).toBe("a b");
    expect(truncate("x".repeat(130), 120)).toBe("x".repeat(119) + "…");
  });
});

describe("banner", () => {
  it("names the outcome", () => {
    expect(banner(report([item("a")]))).toEqual({ title: "All tests passed", tone: "success" });
    expect(
      banner(report([item("a", "failed"), item("b", "failed")], { status: "failed" })),
    ).toEqual({ title: "2 flows failed", tone: "error" });
    expect(banner(report([item("a", "failed")], { status: "failed", kind: "flow" })).title).toBe(
      "1 step failed",
    );
    expect(banner(report([], { status: "failed" })).title).toBe("Run failed");
    expect(banner(report([], { status: "stopped" }))).toEqual({
      title: "Run stopped",
      tone: "warning",
    });
  });
});

describe("layoutReport", () => {
  it("puts failures first and adds an error line under them", () => {
    const l = layoutReport(report([item("a"), item("b", "failed", "Element  not\nfound"), item("c")]));
    expect(l.rows.map((r) => r.name)).toEqual(["b", "a", "c"]);
    expect(l.rows[0].error).toBe("Element not found");
    expect(l.height).toBe(
      HEADER_H + BANNER_H + DEVICE_H + 3 * ROW_H + ERROR_H + FOOTER_H + 2 * PAD,
    );
  });

  it("caps rows and summarises the rest", () => {
    const l = layoutReport(report(Array.from({ length: 40 }, (_, i) => item(`f${i}`))));
    expect(l.rows).toHaveLength(MAX_ROWS);
    expect(l.overflow).toBe("… and 15 more flows");
  });

  it("shows a placeholder row when nothing finished", () => {
    const l = layoutReport(report([], { status: "stopped" }));
    expect(l.rows).toEqual([]);
    expect(l.empty).toBe("No flow finished");
    expect(l.height).toBe(HEADER_H + BANNER_H + DEVICE_H + ROW_H + FOOTER_H + 2 * PAD);
  });

  it("truncates long names and errors", () => {
    const l = layoutReport(report([item("n".repeat(200), "failed", "e".repeat(300))]));
    expect(l.rows[0].name.length).toBe(70);
    expect(l.rows[0].error!.length).toBe(120);
  });
});

describe("headerMeta", () => {
  it("skips the project name when it is already the title", () => {
    expect(headerMeta(report([]), "Oct 9")).toBe("main  ·  Oct 9");
    expect(headerMeta(report([], { title: "Login" }), "Oct 9")).toBe("shop  ·  main  ·  Oct 9");
    expect(
      headerMeta(report([], { title: "Login", project: { name: "shop", branch: null } }), "Oct 9"),
    ).toBe("shop  ·  Oct 9");
  });
});

describe("deviceLabel", () => {
  it("names the platform, except for cloud runs whose name already says it", () => {
    expect(deviceLabel(report([]))).toBe("Android · Pixel 8");
    expect(
      deviceLabel(report([], { device: { platform: "cloud", name: "Maestro Deck Cloud · ios" } })),
    ).toBe("Maestro Deck Cloud · ios");
    expect(deviceLabel(report([], { device: null }))).toBe("Unknown device");
  });
});
