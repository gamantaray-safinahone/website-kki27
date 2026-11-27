"use client";

import { formatWibDate, formatWibTime } from "@/lib/format";
import { useNow } from "@/lib/live/useNow";

// Jam dua baris: "14.05.33 WIB" dan "27 November 2026".
// Dihitung dengan zona Asia/Jakarta, bukan zona waktu perangkat penonton.
export function WibClock() {
  const now = useNow();
  return (
    <div className="flex flex-col items-end text-right leading-tight">
      <time
        dateTime={now ? new Date(now).toISOString() : undefined}
        className="text-kapur-muda tall:text-base text-sm font-medium tracking-wider tabular-nums"
      >
        {now ? formatWibTime(now) : "--.--.--"} WIB
      </time>
      <span className="text-sage-dingin text-xs font-medium">
        {now ? formatWibDate(now) : " "}
      </span>
    </div>
  );
}
