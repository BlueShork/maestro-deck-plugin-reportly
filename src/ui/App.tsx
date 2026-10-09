import { useEffect, useState } from "preact/hooks";

import { renderCard } from "../card/draw";
import type { Mode } from "../card/theme";
import type { RunReport } from "../report";
import { host } from "../sdk";

const fileName = (r: RunReport) => {
  const d = new Date(r.startedAt);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `maestro-report-${r.project.name}-${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}.png`;
};

const message = (e: unknown) => (e instanceof Error ? e.message : String(e));

export function App() {
  const [report, setReport] = useState<RunReport | null>(null);
  const [mode, setMode] = useState<Mode>("dark");
  const [png, setPng] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void host.runs.latest().then(setReport);
    void host.storage.get<Mode>("theme").then((m) => m && setMode(m));
    return host.onRunFinished(setReport);
  }, []);

  useEffect(() => {
    setPng(null);
    if (report) void renderCard(report, mode).then(setPng);
  }, [report, mode]);

  const toggle = () => {
    const next = mode === "dark" ? "light" : "dark";
    setMode(next);
    void host.storage.set("theme", next);
  };

  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    try {
      await fn();
    } catch (e) {
      void host.ui.toast({ kind: "error", message: `Reportly: ${message(e)}` });
    } finally {
      setBusy(false);
    }
  };

  const copy = () =>
    run(async () => {
      try {
        await host.ui.copyImage(png!);
      } catch (e) {
        throw new Error(`could not copy the image (${message(e)}). Use Save as PNG instead.`);
      }
      void host.ui.toast({ kind: "success", message: "Report copied — paste it in Teams" });
    });

  const saveAs = () =>
    run(async () => {
      const { saved } = await host.ui.saveFile(fileName(report!), png!);
      if (saved) void host.ui.toast({ kind: "success", message: "Report saved" });
    });

  if (!report) return <p class="pad muted">Run a flow or Run All to generate a report.</p>;

  return (
    <div class="pad stack">
      {png ? (
        <img class="preview" src={`data:image/png;base64,${png}`} alt="Run report" />
      ) : (
        <p class="muted">Rendering…</p>
      )}
      <div class="actions">
        <button class="primary" disabled={!png || busy} onClick={copy}>
          Copy image
        </button>
        <button class="secondary" disabled={!png || busy} onClick={saveAs}>
          Save as PNG
        </button>
        <button class="link" onClick={toggle}>
          {mode === "dark" ? "Light card" : "Dark card"}
        </button>
      </div>
    </div>
  );
}
