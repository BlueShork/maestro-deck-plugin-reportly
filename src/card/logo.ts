// Path data from Maestro Deck's public/logo-horizontal.svg. Drawn as a vector:
// an <img> loaded into this opaque-origin frame would taint the canvas.
const MARK =
  "M256 64C150.02 64 64 150.02 64 256V768C64 873.98 150.02 960 256 960H768C873.98 960 960 873.98 960 768V256C960 150.02 873.98 64 768 64H256ZM320 256C284.654 256 256 284.654 256 320V704C256 739.346 284.654 768 320 768H704C739.346 768 768 739.346 768 704V320C768 284.654 739.346 256 704 256H320Z";

/** Mark + "Maestro Deck" wordmark, `h` px tall, top-left at (x, y). */
export function drawLogo(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  h: number,
  color: string,
) {
  const s = h / 896; // the mark spans 64..960 in its 1024 box
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  ctx.translate(-64, -64);
  ctx.fillStyle = color;
  ctx.fill(new Path2D(MARK), "evenodd");
  ctx.beginPath();
  ctx.roundRect(336, 336, 352, 352, 24);
  ctx.fill();
  ctx.restore();
  ctx.fillStyle = color;
  ctx.font = `700 ${Math.round(h * 0.78)}px Manrope`;
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillText("Maestro Deck", x + h * 1.35, y + h / 2);
}
