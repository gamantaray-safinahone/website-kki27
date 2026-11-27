"use client";

import { useLive } from "@/lib/live/store";

// Info run yang sedang diikuti, di header panel peta: "Final A - 1 · Official".
export function RunInfo() {
  const run = useLive((s) => s.run);
  const runLoading = useLive((s) => s.runLoading);

  if (runLoading) {
    return <p className="text-sage-dingin text-sm">Loading run…</p>;
  }
  if (!run) {
    return <p className="text-sage-dingin text-sm">No active run</p>;
  }
  const name = run.label ?? `Run ${run.id.slice(0, 8)}`;
  return (
    <p className="text-sage-dingin flex min-w-0 items-center gap-2 text-sm">
      <span className="truncate" title={name}>
        {name}
      </span>
      {run.is_official && (
        <span className="border-lime-neon text-lime-neon shrink-0 border px-1.5 text-xs font-semibold">
          Official
        </span>
      )}
      {/* Run uji (source = 'sim') dibuat lewat supabase/snippets/uji-manual.sql */}
      {run.source === "sim" && (
        <span className="light:border-amber-700 light:text-amber-700 shrink-0 border border-amber-500 px-1.5 text-xs font-semibold text-amber-500">
          Test run
        </span>
      )}
    </p>
  );
}
