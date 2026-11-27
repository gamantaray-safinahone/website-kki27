"use client";

import { useLive, type RealtimeStatus } from "@/lib/live/store";
import { useNow } from "@/lib/live/useNow";

const ONLINE_MS = 5_000;
const DELAYED_MS = 15_000;

const REALTIME_LABELS: Record<RealtimeStatus, string> = {
  connecting: "Connecting…",
  connected: "Live",
  reconnecting: "Reconnecting…",
  polling: "Polling",
};

type Boat = { label: string; dot: string };

function boatStatus(
  hasRun: boolean,
  ended: boolean,
  ageMs: number | null,
): Boat {
  if (!hasRun) return { label: "No active run", dot: "bg-sage-dingin" };
  if (ended) return { label: "Run ended", dot: "bg-sage-dingin" };
  if (ageMs == null)
    return { label: "Waiting for data", dot: "bg-sage-dingin" };
  if (ageMs < ONLINE_MS) return { label: "Online", dot: "bg-green-500" };
  if (ageMs < DELAYED_MS) return { label: "Delayed", dot: "bg-amber-500" };
  return { label: "Offline", dot: "bg-red-500" };
}

// Status kapal (dari umur data) dan status sambungan Realtime. Teks selalu ditampilkan, jadi status tidak hanya dibedakan lewat warna titik.
export function ConnectionBadge() {
  const now = useNow();
  const run = useLive((s) => s.run);
  const lastArrivalMs = useLive((s) => s.lastArrivalMs);
  const realtime = useLive((s) => s.realtime);

  const ageMs = now && lastArrivalMs != null ? now - lastArrivalMs : null;
  const boat = boatStatus(
    run != null,
    run != null && run.status !== "live",
    ageMs,
  );

  return (
    <div
      className="flex flex-col items-end text-right leading-tight"
      aria-live="polite"
    >
      <span className="text-kapur-muda tall:text-base flex items-center gap-2 text-sm font-semibold">
        <span
          className={`inline-block size-2.5 rounded-full ${boat.dot}`}
          aria-hidden
        />
        Boat: {boat.label}
      </span>
      <span className="text-sage-dingin text-xs font-medium">
        Feed: {REALTIME_LABELS[realtime]}
      </span>
    </div>
  );
}
