"use client";

import { ArrowDown, ArrowUp } from "lucide-react";
import { useMemo, useState } from "react";

import { useLive } from "@/lib/live/store";
import { PHASE_LABELS, PHASES, isPhase, type Phase } from "@/lib/mission";
import { updateAppState, type AppState } from "@/lib/queries";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

import { StatusMessage, type ActionResult } from "./StatusMessage";
import { buttonClass, primaryButtonClass, sectionClass } from "./styles";

// Form lintasan default dan urutan fase (diisi dari app_state saat ini).
export function DisplayForm({ appState }: { appState: AppState }) {
  const courseMap = useLive((s) => s.courses);
  const courses = useMemo(() => Object.keys(courseMap).sort(), [courseMap]);
  const [lintasan, setLintasan] = useState(appState.active_lintasan ?? "A");
  const [order, setOrder] = useState<Phase[]>(() => {
    const saved = appState.phase_order.filter(isPhase);
    return saved.length === PHASES.length ? saved : [...PHASES];
  });
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<ActionResult>(null);

  function move(index: number, delta: number) {
    const next = [...order];
    const target = index + delta;
    [next[index], next[target]] = [next[target], next[index]];
    setOrder(next);
  }

  async function save() {
    setBusy(true);
    const error = await updateAppState(createSupabaseBrowserClient(), {
      active_lintasan: lintasan,
      phase_order: order,
    });
    setBusy(false);
    setResult(
      error ? { ok: false, text: error.message } : { ok: true, text: "Saved." },
    );
  }

  return (
    <section className={sectionClass}>
      <h2 className="text-kapur-muda font-semibold">Dashboard display</h2>

      <label className="flex items-center gap-3 text-sm">
        <span className="text-sage-dingin">Default course on map</span>
        <select
          value={lintasan}
          onChange={(e) => setLintasan(e.target.value)}
          className="border-border bg-surface border px-2 py-1"
        >
          {courses.map((key) => (
            <option key={key} value={key}>
              Course {key}
            </option>
          ))}
        </select>
      </label>

      <div className="flex flex-col gap-1 text-sm">
        <span className="text-sage-dingin">Phase order</span>
        <ol className="flex flex-col gap-1">
          {order.map((phase, index) => (
            <li
              key={phase}
              className="border-border bg-surface flex items-center justify-between border px-2.5 py-1"
            >
              <span>
                {index + 1}. {PHASE_LABELS[phase]}
              </span>
              <span className="flex gap-1">
                <button
                  type="button"
                  aria-label={`Move ${PHASE_LABELS[phase]} up`}
                  disabled={index === 0}
                  onClick={() => move(index, -1)}
                  className={buttonClass}
                >
                  <ArrowUp className="size-3.5" aria-hidden />
                </button>
                <button
                  type="button"
                  aria-label={`Move ${PHASE_LABELS[phase]} down`}
                  disabled={index === order.length - 1}
                  onClick={() => move(index, 1)}
                  className={buttonClass}
                >
                  <ArrowDown className="size-3.5" aria-hidden />
                </button>
              </span>
            </li>
          ))}
        </ol>
      </div>

      <div className="flex flex-wrap justify-end gap-2">
        <button
          type="button"
          onClick={() => setOrder([...PHASES])}
          className={buttonClass}
        >
          Reset order
        </button>
        <button
          type="button"
          onClick={save}
          disabled={busy}
          className={primaryButtonClass}
        >
          Save
        </button>
      </div>
      <StatusMessage result={result} />
    </section>
  );
}
