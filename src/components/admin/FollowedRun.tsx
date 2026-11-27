"use client";

import { useState } from "react";

import { formatAge, formatWibTime } from "@/lib/format";
import { useLive } from "@/lib/live/store";
import { useNow } from "@/lib/live/useNow";
import { endRunManually, updateAppState, type Run } from "@/lib/queries";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

import { RunForm } from "./RunForm";
import { useConfirm } from "./useConfirm";
import { StatusMessage, type ActionResult } from "./StatusMessage";
import { buttonClass, dangerButtonClass, sectionClass } from "./styles";

// Run yang sedang diikuti dashboard: edit label/notes, akhiri, lepas.
export function FollowedRun() {
  const run = useLive((s) => s.run);
  const latest = useLive((s) => s.latest);
  const now = useNow();
  const [result, setResult] = useState<ActionResult>(null);
  const { confirm, dialog } = useConfirm();

  async function unfollow() {
    const error = await updateAppState(createSupabaseBrowserClient(), {
      live_run_id: null,
    });
    setResult(
      error
        ? { ok: false, text: error.message }
        : { ok: true, text: "Dashboard shows no active run." },
    );
  }

  async function endRun(target: Run) {
    if (
      !(await confirm(
        `End run "${target.label ?? target.id.slice(0, 8)}"? It will be marked aborted (manual).`,
        "End run",
      ))
    )
      return;
    const error = await endRunManually(
      createSupabaseBrowserClient(),
      target.id,
    );
    setResult(
      error
        ? { ok: false, text: error.message }
        : { ok: true, text: "Run ended." },
    );
  }

  if (!run) {
    return (
      <section className={sectionClass}>
        <h2 className="text-kapur-muda font-semibold">Followed run</h2>
        <p className="text-sage-dingin text-sm">
          No run followed. A new boat run is followed automatically; or pick one
          below.
        </p>
        <StatusMessage result={result} />
      </section>
    );
  }

  const lastData = latest?.received_at
    ? `Last data ${formatAge(now - Date.parse(latest.received_at))}`
    : "No telemetry yet";

  return (
    <section className={sectionClass}>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-kapur-muda font-semibold">Followed run</h2>
        <span className="text-sage-dingin text-sm tabular-nums">
          {lastData}
        </span>
      </div>
      <dl className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm sm:grid-cols-4">
        {[
          ["Course", run.lintasan ?? "-"],
          ["Source", run.source],
          ["Status", run.status],
          ["Started", `${formatWibTime(run.started_at)} WIB`],
        ].map(([label, value]) => (
          <div key={label}>
            <dt className="text-sage-dingin text-xs uppercase">{label}</dt>
            <dd className="text-kapur-muda">{value}</dd>
          </div>
        ))}
      </dl>

      {/* key: form diisi ulang saat run yang diikuti berganti */}
      <RunForm key={run.id} run={run} onResult={setResult} />

      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={unfollow} className={buttonClass}>
          Unfollow
        </button>
        {run.status === "live" && (
          <button
            type="button"
            onClick={() => endRun(run)}
            className={dangerButtonClass}
          >
            End run (manual)
          </button>
        )}
      </div>
      <StatusMessage result={result} />
      {dialog}
    </section>
  );
}
