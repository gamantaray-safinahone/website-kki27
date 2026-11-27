"use client";

import { formatAge } from "@/lib/format";
import { useLive } from "@/lib/live/store";
import { useNow } from "@/lib/live/useNow";

// "Updated 3 s ago" dan latensi kapal -> server.
export function DataAge() {
  const now = useNow();
  const lastArrivalMs = useLive((s) => s.lastArrivalMs);
  const latest = useLive((s) => s.latest);

  if (!now || lastArrivalMs == null) {
    return <span>No data yet</span>;
  }
  const latencyMs = latest
    ? Date.parse(latest.received_at) - Date.parse(latest.t)
    : null;
  return (
    <span>
      Updated {formatAge(now - lastArrivalMs)}
      {latencyMs != null &&
        latencyMs >= 0 &&
        ` · delay ${(latencyMs / 1000).toFixed(1)} s`}
    </span>
  );
}
