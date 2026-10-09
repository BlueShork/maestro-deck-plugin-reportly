import preact from "@preact/preset-vite";
import { defineConfig } from "vite";

// Every asset (the fonts) is inlined as a data: URL. The plugin frame has an
// opaque origin; fonts it draws on a canvas must not be cross-origin fetches.
export default defineConfig({
  base: "./",
  plugins: [preact()],
  build: {
    outDir: "dist",
    emptyOutDir: true,
    modulePreload: { polyfill: false },
    assetsInlineLimit: () => true,
  },
});
