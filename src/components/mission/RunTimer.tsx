"use client";

import { formatDuration } from "@/lib/format";
import { useLive } from "@/lib/live/store";
import { useNow } from "@/lib/live/useNow";

const MAX_RUN_MS = 20 * 60 * 1000;

// Waktu tempuh sejak fase start aktif, berhenti saat finish selesai atau run berakhir.
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
  if (!start) return <span className="font-mono text-neutral-500">--:--</span>;

  const startMs = Date.parse(start.t);
  const stopIso = finish?.t ?? endedAt;
  const endMs = stopIso ? Date.parse(stopIso) : now;
  const elapsed = endMs ? endMs - startMs : 0;

  return (
    <span
      className={`font-mono text-lg font-semibold tabular-nums xl:text-2xl ${
        elapsed > MAX_RUN_MS ? "text-red-600" : ""
      }`}
    >
      {formatDuration(elapsed)}
    </span>
  );
}
