// Values from Maestro Deck's src/styles/globals.css.
export type Mode = "dark" | "light";

export interface Palette {
  bg: string;
  fg: string;
  muted: string;
  border: string;
  panel: string;
  brand: string;
  success: string;
  error: string;
  warning: string;
  logo: string;
}

export const PALETTES: Record<Mode, Palette> = {
  dark: {
    bg: "#101013",
    fg: "#fafaf4",
    muted: "#a1a1aa",
    border: "#27272b",
    panel: "#18181c",
    brand: "#fa500f",
    success: "#22c55e",
    error: "#ff3b30",
    warning: "#ffaf00",
    logo: "#ffffff",
  },
  light: {
    bg: "#fbfaf5",
    fg: "#101013",
    muted: "#62626a",
    border: "#dcd9d2",
    panel: "#f1efe8",
    brand: "#fa500f",
    success: "#1b9e4b",
    error: "#e10500",
    warning: "#d68400",
    logo: "#0b0b0b",
  },
};
