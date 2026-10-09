import "./fonts.css";
import "@fontsource/manrope/latin-ext-700.css";
import "@fontsource/manrope/latin-700.css";

import type { RunReport } from "../report";
import {
  BANNER_H,
  DEVICE_H,
  ERROR_H,
  FOOTER_H,
  HEADER_H,
  PAD,
  ROW_H,
  WIDTH,
  banner,
  deviceLabel,
  formatDuration,
  headerMeta,
  layoutReport,
} from "./layout";
import { drawLogo } from "./logo";
import { PALETTES, type Mode, type Palette } from "./theme";

const SCALE = 2;
const DOT: Record<string, keyof Palette> = { passed: "success", failed: "error", skipped: "muted" };

async function fontsReady() {
  await Promise.all([
    document.fonts.load('400 16px "Inter Variable"'),
    document.fonts.load('600 16px "Inter Variable"'),
    document.fonts.load('700 16px "Inter Variable"'),
    document.fonts.load("700 16px Manrope"),
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
  const font = (w: number, size: number) => `${w} ${size}px "Inter Variable", sans-serif`;
  const right = WIDTH - PAD;

  ctx.fillStyle = p.bg;
  ctx.fillRect(0, 0, WIDTH, l.height);
  ctx.fillStyle = p.brand;
  ctx.fillRect(0, 0, WIDTH, 6);

  // Header: logo left, title and project · branch · date right.
  let y = PAD;
  drawLogo(ctx, PAD, y + 12, 36, p.logo);
  ctx.textAlign = "right";
  ctx.textBaseline = "alphabetic";
  ctx.fillStyle = p.fg;
  ctx.font = font(600, 20);
  ctx.fillText(report.title, right, y + 26);
  ctx.fillStyle = p.muted;
  ctx.font = font(400, 15);
  const when = new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(report.startedAt);
  ctx.fillText(headerMeta(report, when), right, y + 52);
  ctx.textAlign = "left";
  y += HEADER_H;

  // Status banner.
  const b = banner(report);
  ctx.fillStyle = p.panel;
  ctx.beginPath();
  ctx.roundRect(PAD, y, WIDTH - 2 * PAD, BANNER_H - 16, 12);
  ctx.fill();
  ctx.fillStyle = p[b.tone];
  ctx.beginPath();
  ctx.roundRect(PAD, y, 6, BANNER_H - 16, [12, 0, 0, 12]);
  ctx.fill();
  ctx.fillStyle = p.fg;
  ctx.font = font(700, 30);
  ctx.fillText(b.title, PAD + 32, y + 46);
  ctx.font = font(400, 16);
  ctx.fillStyle = p.muted;
  const { passed, failed, skipped } = report.totals;
  ctx.fillText(
    `${passed} passed   ${failed} failed   ${skipped} skipped   ·   ${formatDuration(report.durationMs)}`,
    PAD + 32,
    y + 78,
  );
  y += BANNER_H;

  // Device.
  ctx.font = font(400, 15);
  ctx.fillStyle = p.muted;
  ctx.fillText(deviceLabel(report), PAD, y + 24);
  y += DEVICE_H;

  // Rows.
  const rule = (yy: number) => {
    ctx.fillStyle = p.border;
    ctx.fillRect(PAD, yy, WIDTH - 2 * PAD, 1);
  };
  for (const row of l.rows) {
    rule(y);
    ctx.fillStyle = p[DOT[row.status]];
    ctx.beginPath();
    ctx.arc(PAD + 8, y + ROW_H / 2, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = p.fg;
    ctx.font = font(row.status === "failed" ? 600 : 400, 17);
    ctx.fillText(row.name, PAD + 28, y + 28);
    ctx.textAlign = "right";
    ctx.fillStyle = p.muted;
    ctx.font = font(400, 15);
    ctx.fillText(row.duration, right, y + 28);
    ctx.textAlign = "left";
    y += ROW_H;
    if (row.error) {
      ctx.fillStyle = p.error;
      ctx.font = font(400, 14);
      ctx.fillText(row.error, PAD + 28, y + 4);
      y += ERROR_H;
    }
  }
  const tail = l.overflow ?? l.empty;
  if (tail) {
    rule(y);
    ctx.fillStyle = p.muted;
    ctx.font = font(400, 15);
    ctx.fillText(tail, PAD + 28, y + 28);
    y += ROW_H;
  }
  rule(y);

  // Footer.
  ctx.fillStyle = p.muted;
  ctx.font = font(400, 13);
  ctx.fillText("Generated with Maestro Deck", PAD, y + FOOTER_H - 18);

  return canvas.toDataURL("image/png").slice("data:image/png;base64,".length);
}
