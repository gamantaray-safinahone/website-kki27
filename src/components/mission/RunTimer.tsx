"use client";

import { formatDuration } from "@/lib/format";
import { useLive } from "@/lib/live/store";
import { useNow } from "@/lib/live/useNow";

const MAX_RUN_MS = 10 * 60 * 1000;

// Waktu tempuh sejak fase start aktif, berhenti saat finish selesai atau run berakhir.
// Merah bila melewati batas 10 menit.
export function RunTimer() {
  const now = useNow();
  const events = useLive((s) => s.events);
  const endedAt = useLive((s) => s.run?.ended_at ?? null);

  const start = events.find(
    (e) => e.phase === "start" && e.status === "active",
  );
  const finish = events.find(
    (e) => e.phase === "finish" && e.status === "done",
  );
  if (!start) {
    return (
      <span className="text-sage-dingin tall:text-lg text-base font-semibold tabular-nums">
        <span className="sr-only">Run time </span>--:--
      </span>
    );
  }

  const startMs = Date.parse(start.t);
  const stopIso = finish?.t ?? endedAt;
  const endMs = stopIso ? Date.parse(stopIso) : now;
  const elapsed = endMs ? endMs - startMs : 0;

  return (
    <span
      className={`tall:text-lg text-base font-semibold tabular-nums ${
        elapsed > MAX_RUN_MS
          ? "light:text-red-700 text-red-400"
          : "text-kapur-muda"
      }`}
    >
      <span className="sr-only">Run time </span>
      {formatDuration(elapsed)}
    </span>
  );
}
