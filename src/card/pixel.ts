// Pixel brand kit, ported from Maestro Deck's src/components/brand/Pixel.tsx
// (shared with the landing): banded icon, bitmap wordmark, block mosaic.

export type Cell = { x: number; y: number };

// Warm gradient, top to bottom, applied as horizontal bands.
export const BANDS = ["#FFD800", "#FFAF00", "#FF8205", "#FA500F", "#E10500"];

export function bandColor(y: number, height: number): string {
  return BANDS[Math.min(BANDS.length - 1, Math.floor((y / height) * BANDS.length))];
}

// A frame, a gap, then a solid core; outer corners trimmed.
function frameCells(frame: number, gap: number, core: number, cornerTrim: number): Cell[] {
  const size = 2 * (frame + gap) + core;
  const last = size - 1;
  const cells: Cell[] = [];
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dx = Math.min(x, last - x);
      const dy = Math.min(y, last - y);
      const inFrame = dx < frame || dy < frame;
      const inCore = dx >= frame + gap && dy >= frame + gap;
      if ((inFrame && dx + dy >= cornerTrim) || inCore) cells.push({ x, y });
    }
  }
  return cells;
}

/** The compact icon grid the app uses next to the wordmark. */
export const ICON_GRID = 9;
export const iconCells = () => frameCells(2, 1, 3, 1);

// 5×7 bitmap glyphs.
const GLYPHS: Record<string, string[]> = {
  M: ["10001", "11011", "10101", "10101", "10001", "10001", "10001"],
  A: ["01110", "10001", "10001", "11111", "10001", "10001", "10001"],
  E: ["11111", "10000", "10000", "11110", "10000", "10000", "11111"],
  S: ["01111", "10000", "10000", "01110", "00001", "00001", "11110"],
  T: ["11111", "00100", "00100", "00100", "00100", "00100", "00100"],
  R: ["11110", "10001", "10001", "11110", "10100", "10010", "10001"],
  O: ["01110", "10001", "10001", "10001", "10001", "10001", "01110"],
  D: ["11110", "10001", "10001", "10001", "10001", "10001", "11110"],
  C: ["01111", "10000", "10000", "10000", "10000", "10000", "01111"],
  K: ["10001", "10010", "10100", "11000", "10100", "10010", "10001"],
  " ": ["000", "000", "000", "000", "000", "000", "000"],
};
const GLYPH_HEIGHT = 7;

/** Icon + bitmap text on one grid, ICON_GRID cells tall; text cells keep their glyph row in `row`. */
export function wordmarkCells(text: string): { cells: (Cell & { band: number })[]; width: number } {
  const cells: (Cell & { band: number })[] = iconCells().map((c) => ({
    ...c,
    band: Math.min(BANDS.length - 1, Math.floor((c.y / ICON_GRID) * BANDS.length)),
  }));
  const top = (ICON_GRID - GLYPH_HEIGHT) / 2;
  let cursor = ICON_GRID + 3;
  for (const char of text.toUpperCase()) {
    const rows = GLYPHS[char];
    if (!rows) continue;
    rows.forEach((row, y) =>
      [...row].forEach((bit, x) => {
        if (bit === "1")
          cells.push({
            x: cursor + x,
            y: y + top,
            band: Math.min(BANDS.length - 1, Math.floor((y / GLYPH_HEIGHT) * BANDS.length)),
          });
      }),
    );
    cursor += rows[0].length + 1;
  }
  return { cells, width: cursor - 1 };
}

const MOSAIC = {
  orange: ["#FA500F", "#FF8205", "#FA500F", "#FF6A00", "#E10500", "#FFAF00"],
  red: ["#E10500", "#C4001D", "#E61300", "#FA500F", "#B3001A"],
  yellow: ["#FFD800", "#FFAF00", "#FFC23A", "#FF8205", "#FBD679"],
} as const;
export type MosaicPalette = keyof typeof MOSAIC;

function prng(seed: number) {
  let t = seed >>> 0;
  return () => {
    t = (t + 0x6d2b79f5) >>> 0;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

/** Seeded grid of warm tiles with a few diamonds, as in the app's PixelMosaic. */
export function mosaic(cols: number, rows: number, palette: MosaicPalette, seed: number) {
  const colors = MOSAIC[palette];
  const rand = prng(seed);
  const pick = () => colors[Math.floor(rand() * colors.length)];
  const tiles: (Cell & { fill: string })[] = [];
  const diamonds: (Cell & { fill: string })[] = [];
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const a = pick();
      rand(); // the app's flicker draw, kept so seeds match its mosaics
      const diamond = rand() < 0.05;
      const b = pick();
      tiles.push({ x, y, fill: a });
      if (diamond) diamonds.push({ x, y, fill: b === a ? colors[0] : b });
    }
  }
  return { tiles, diamonds };
}
