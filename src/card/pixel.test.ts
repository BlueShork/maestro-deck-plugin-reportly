import { describe, expect, it } from "vitest";

import { BANDS, ICON_GRID, bandColor, iconCells, mosaic, wordmarkCells } from "./pixel";

describe("pixel brand kit", () => {
  it("draws the compact 9-cell icon: frame, gap, core, trimmed corners", () => {
    const cells = iconCells();
    const has = (x: number, y: number) => cells.some((c) => c.x === x && c.y === y);
    expect(ICON_GRID).toBe(9);
    expect(has(0, 0)).toBe(false); // corner trim
    expect(has(1, 0)).toBe(true); // frame
    expect(has(2, 2)).toBe(false); // gap
    expect(has(4, 4)).toBe(true); // core
  });

  it("lays the bitmap wordmark next to the icon on one grid", () => {
    const { cells, width } = wordmarkCells("Maestro Deck");
    // icon 9 + gap 3 + 11 glyphs of 5 + space of 3 + 11 spacings
    expect(width).toBe(9 + 3 + 11 * 5 + 3 + 11);
    expect(cells.every((c) => c.y >= 0 && c.y < ICON_GRID)).toBe(true);
  });

  it("bands colours warm-to-red from top to bottom", () => {
    expect(bandColor(0, 9)).toBe(BANDS[0]);
    expect(bandColor(8, 9)).toBe(BANDS[BANDS.length - 1]);
  });

  it("builds the same mosaic for the same seed", () => {
    expect(mosaic(4, 3, "red", 7)).toEqual(mosaic(4, 3, "red", 7));
    expect(mosaic(4, 3, "red", 7).tiles).toHaveLength(12);
  });
});
