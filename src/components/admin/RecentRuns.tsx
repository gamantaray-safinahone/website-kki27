"use client";

import { useEffect, useState } from "react";

import { formatWibDate, formatWibTime } from "@/lib/format";
import { useLive } from "@/lib/live/store";
import { fetchRecentRuns, updateAppState, type Run } from "@/lib/queries";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

import { StatusMessage, type ActionResult } from "./StatusMessage";
import { buttonClass, sectionClass } from "./styles";

const REFRESH_MS = 15_000;

// 10 run terbaru dengan tombol Follow (set app_state.live_run_id).
export function RecentRuns() {
  const followedId = useLive((s) => s.appState?.live_run_id ?? null);
  // Perubahan run (dibuat, diakhiri, diberi label) memicu muat ulang daftar.
  const followed = useLive((s) => s.run);
  const [runs, setRuns] = useState<Run[] | null>(null);
  const [result, setResult] = useState<ActionResult>(null);

  // Admin tidak membuka channel Realtime sendiri, jadi run baru yang belum
  // diikuti dashboard muncul lewat muat ulang ringan tiap 15 detik.
  useEffect(() => {
    let cancelled = false;
    const load = () =>
      fetchRecentRuns(createSupabaseBrowserClient())
        .then((rows) => !cancelled && setRuns(rows))
        .catch(
          (error: Error) =>
            !cancelled && setResult({ ok: false, text: error.message }),
        );
    load();
    const timer = window.setInterval(load, REFRESH_MS);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [followedId, followed]);

  async function follow(run: Run) {
    const error = await updateAppState(createSupabaseBrowserClient(), {
      live_run_id: run.id,
    });
    setResult(
      error
        ? { ok: false, text: error.message }
        : { ok: true, text: "Dashboard now follows this run." },
    );
  }

  return (
    <section className={sectionClass}>
      <h2 className="text-kapur-muda font-semibold">Recent runs</h2>
      {runs === null ? (
        <p className="text-sage-dingin text-sm">Loading…</p>
      ) : runs.length === 0 ? (
        <p className="text-sage-dingin text-sm">No runs yet.</p>
      ) : (
        <ul className="divide-border divide-y text-sm">
          {runs.map((run) => (
            <li
              key={run.id}
              className="flex flex-wrap items-center justify-between gap-2 py-2"
            >
              <div className="min-w-0">
                <p className="text-kapur-muda truncate">
                  {run.label ?? run.id.slice(0, 8)}
                </p>
                <p className="text-sage-dingin text-xs">
                  {formatWibDate(Date.parse(run.started_at))}{" "}
                  {formatWibTime(run.started_at)} WIB · Course{" "}
                  {run.lintasan ?? "-"} · {run.source} · {run.status}
                </p>
              </div>
              <button
                type="button"
                onClick={() => follow(run)}
                disabled={run.id === followedId}
                className={buttonClass}
              >
                {run.id === followedId ? "Following" : "Follow"}
              </button>
            </li>
          ))}
        </ul>
      )}
      <StatusMessage result={result} />
    </section>
  );
}
