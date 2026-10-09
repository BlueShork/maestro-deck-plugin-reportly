import "./fonts.css";
import "@fontsource/inter-tight/latin-ext-600.css";
import "@fontsource/inter-tight/latin-600.css";
import "@fontsource/inter-tight/latin-ext-700.css";
import "@fontsource/inter-tight/latin-700.css";
import "@fontsource/space-mono/latin-ext-400.css";
import "@fontsource/space-mono/latin-400.css";

import type { RunReport } from "../report";
import {
  DEVICE_H,
  ERROR_H,
  FOOTER_H,
  HEADER_H,
  HERO_H,
  PAD,
  ROW_H,
  STATS_H,
  WIDTH,
  banner,
  deviceLabel,
  formatDuration,
  headerMeta,
  layoutReport,
} from "./layout";
import { BANDS, mosaic, wordmarkCells, type MosaicPalette } from "./pixel";
import { PALETTES, type Mode, type Palette } from "./theme";

const SCALE = 2;
const X0 = PAD;
const X1 = WIDTH - PAD;
const MOSAIC_TILE = 42;
const MOSAIC_COLS = 6;
const DOT: Record<string, keyof Palette> = { passed: "success", failed: "error", skipped: "muted" };
const MOSAIC_FOR: Record<RunReport["status"], MosaicPalette> = {
  passed: "orange",
  failed: "red",
  stopped: "yellow",
};

const sans = (w: number, size: number) => `${w} ${size}px "Inter Variable", sans-serif`;
const display = (w: number, size: number) => `${w} ${size}px "Inter Tight", sans-serif`;
const mono = (size: number) => `400 ${size}px "Space Mono", monospace`;

async function fontsReady() {
  await Promise.all([
    document.fonts.load(sans(400, 16)),
    document.fonts.load(sans(600, 16)),
    document.fonts.load(display(600, 16)),
    document.fonts.load(display(700, 16)),
    document.fonts.load(mono(16)),
  ]);
}

/** Draws the report card and returns it as base64 PNG (no data: prefix). */
export async function renderCard(report: RunReport, mode: Mode): Promise<string> {
  await fontsReady();
  const p = PALETTES[mode];
  const l = layoutReport(report);
  const canvas = document.createElement("canvas");
  canvas.width = WIDTH * SCALE;
  canvas.height = l.height * SCALE;
  const ctx = canvas.getContext("2d")!;
  ctx.scale(SCALE, SCALE);
  ctx.textBaseline = "alphabetic";

  const hline = (y: number, from = X0, to = X1) => {
    ctx.fillStyle = p.border;
    ctx.fillRect(from, y, to - from, 1);
  };
  const vline = (x: number, y: number, h: number) => {
    ctx.fillStyle = p.border;
    ctx.fillRect(x, y, 1, h);
  };
  const label = (text: string, x: number, y: number, align: CanvasTextAlign = "left") => {
    ctx.font = mono(12);
    ctx.fillStyle = p.muted;
    ctx.textAlign = align;
    ctx.fillText(text.toUpperCase(), x, y);
    ctx.textAlign = "left";
  };

  ctx.fillStyle = p.bg;
  ctx.fillRect(0, 0, WIDTH, l.height);

  // Header: pixel wordmark | title + mono meta.
  let y = PAD;
  hline(y);
  const wm = wordmarkCells("Maestro Deck");
  const px = 4;
  const wmX = X0 + 24;
  const wmY = y + (HEADER_H - 9 * px) / 2;
  for (const c of wm.cells) {
    ctx.fillStyle = BANDS[c.band];
    ctx.fillRect(wmX + c.x * px, wmY + c.y * px, px, px);
  }
  const split = wmX + wm.width * px + 24;
  vline(split, y, HEADER_H);
  ctx.textAlign = "right";
  ctx.fillStyle = p.fg;
  ctx.font = display(600, 20);
  ctx.fillText(report.title, X1 - 24, y + 32);
  const when = new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(report.startedAt);
  label(headerMeta(report, when), X1 - 24, y + 54, "right");
  y += HEADER_H;

  // Hero: status | mosaic.
  hline(y);
  const mosaicX = X1 - MOSAIC_COLS * MOSAIC_TILE;
  const tone = p[banner(report).tone];
  ctx.fillStyle = tone;
  ctx.fillRect(X0 + 24, y + 30, 10, 10);
  label(report.kind === "all" ? "Run all · result" : "Flow run · result", X0 + 44, y + 40);
  ctx.fillStyle = p.fg;
  ctx.font = display(700, 52);
  ctx.fillText(banner(report).title, X0 + 22, y + 106);
  label(
    `${report.items.length} ${report.kind === "all" ? "flows" : "steps"} · ${formatDuration(report.durationMs)}`,
    X0 + 24,
    y + 138,
  );
  vline(mosaicX, y, HERO_H);
  const m = mosaic(MOSAIC_COLS, HERO_H / MOSAIC_TILE, MOSAIC_FOR[report.status], 7);
  for (const t of m.tiles) {
    ctx.fillStyle = t.fill;
    ctx.fillRect(mosaicX + t.x * MOSAIC_TILE, y + t.y * MOSAIC_TILE, MOSAIC_TILE, MOSAIC_TILE);
  }
  for (const d of m.diamonds) {
    const cx = mosaicX + (d.x + 0.5) * MOSAIC_TILE;
    const cy = y + (d.y + 0.5) * MOSAIC_TILE;
    const r = MOSAIC_TILE * 0.4;
    ctx.fillStyle = d.fill;
    ctx.beginPath();
    ctx.moveTo(cx, cy - r);
    ctx.lineTo(cx + r, cy);
    ctx.lineTo(cx, cy + r);
    ctx.lineTo(cx - r, cy);
    ctx.closePath();
    ctx.fill();
  }
  y += HERO_H;

  // Stats: four hairline cells.
  hline(y);
  const { passed, failed, skipped } = report.totals;
  const stats: [string, string, string][] = [
    ["Passed", String(passed), p.success],
    ["Failed", String(failed), failed ? p.error : p.fg],
    ["Skipped", String(skipped), p.muted],
    ["Duration", formatDuration(report.durationMs), p.fg],
  ];
  const cellW = (X1 - X0) / stats.length;
  stats.forEach(([name, value, color], i) => {
    const cx = X0 + i * cellW;
    if (i) vline(cx, y, STATS_H);
    label(name, cx + 24, y + 30);
    ctx.fillStyle = color;
    ctx.font = display(600, 30);
    ctx.fillText(value, cx + 24, y + 68);
  });
  y += STATS_H;

  // Device strip.
  hline(y);
  label("Device", X0 + 24, y + 28);
  ctx.fillStyle = p.fg;
  ctx.font = sans(400, 15);
  ctx.fillText(deviceLabel(report), X0 + 110, y + 28);
  y += DEVICE_H;

  // Rows.
  for (const row of l.rows) {
    hline(y);
    ctx.fillStyle = p[DOT[row.status]];
    ctx.fillRect(X0 + 24, y + ROW_H / 2 - 5, 10, 10);
    ctx.fillStyle = p.fg;
    ctx.font = sans(row.status === "failed" ? 600 : 400, 17);
    ctx.fillText(row.name, X0 + 50, y + 30);
    label(row.duration, X1 - 24, y + 30, "right");
    y += ROW_H;
    if (row.error) {
      ctx.fillStyle = p.error;
      ctx.font = mono(13);
      ctx.fillText(row.error, X0 + 50, y + 2);
      y += ERROR_H;
    }
  }
  const tail = l.overflow ?? l.empty;
  if (tail) {
    hline(y);
    label(tail, X0 + 50, y + 30);
    y += ROW_H;
  }

  // Footer.
  hline(y);
  label("Generated with Maestro Deck", X0 + 24, y + 32);
  ctx.font = mono(12);
  ctx.fillStyle = p.brand;
  ctx.textAlign = "right";
  ctx.fillText("MAESTRODECK.CLOUD", X1 - 24, y + 32);
  ctx.textAlign = "left";
  // Pixel chevron before the link, as on the app's calls to action.
  const chevX = X1 - 24 - ctx.measureText("MAESTRODECK.CLOUD").width - 18;
  for (const [cx, cy, h] of [[1, 0, 1], [2, 1, 1], [3, 2, 2], [2, 4, 1], [1, 5, 1]] as const) {
    ctx.fillRect(chevX + cx * 2, y + 20 + cy * 2, 2, h * 2);
  }
  y += FOOTER_H;
  hline(y);
  // Outer frame sides.
  vline(X0, PAD, y - PAD + 1);
  vline(X1 - 1, PAD, y - PAD + 1);

  return canvas.toDataURL("image/png").slice("data:image/png;base64,".length);
}
