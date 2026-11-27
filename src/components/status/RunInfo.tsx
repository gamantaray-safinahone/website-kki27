"use client";

import { useLive } from "@/lib/live/store";

// Label run yang sedang ditampilkan: "Course A · Final A - 1 · Official".
export function RunInfo() {
  const run = useLive((s) => s.run);
  const runLoading = useLive((s) => s.runLoading);
  const activeCourse = useLive((s) => s.appState?.active_lintasan ?? null);

  if (runLoading)
    return <p className="text-sm text-neutral-500">Loading run…</p>;
  if (!run) {
    return (
      <p className="text-sm text-neutral-500">
        Course {activeCourse ?? "—"} · Waiting for the boat to start a run
      </p>
    );
  }
  const name = run.label ?? `Run ${run.id.slice(0, 8)}`;
  return (
    <p className="text-sm text-neutral-500">
      Course {run.lintasan ?? "—"} · {name}
      {run.is_official && (
        <span className="ml-2 font-semibold text-blue-600">Official</span>
      )}
      {run.source === "sim" && (
        <span className="ml-2 font-semibold text-amber-600">Simulator</span>
      )}
    </p>
  );
}
