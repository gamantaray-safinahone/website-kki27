"use client";

import { useMemo } from "react";

import { Card } from "@/components/ui/Card";
import { isSlot, SLOTS, type Slot } from "@/lib/mission";
import { selectCourse, useLive } from "@/lib/live/store";
import type { Capture } from "@/lib/queries";

import { CaptureCard } from "./CaptureCard";

// Foto terbaru (tidak disembunyikan admin) per slot. Slot milik lintasan aktif tampil besar.
export function LatestCaptures() {
  const captures = useLive((s) => s.captures);
  const course = useLive(selectCourse);

  const latestBySlot = useMemo(() => {
    const result: Partial<Record<Slot, Capture>> = {};
    for (const c of Object.values(captures)) {
      if (c.hidden || !isSlot(c.slot)) continue;
      const current = result[c.slot];
      if (
        !current ||
        Date.parse(c.captured_at) > Date.parse(current.captured_at)
      ) {
        result[c.slot] = c;
      }
    }
    return result;
  }, [captures]);

  const primary = (course?.imaging_slots ?? []).filter(isSlot);
  const others = SLOTS.filter((s) => !primary.includes(s) && latestBySlot[s]);

  return (
    <Card title="Imaging">
      <div className="grid grid-cols-2 gap-3">
        {(primary.length > 0 ? primary : SLOTS).map((slot) => (
          <CaptureCard
            key={slot}
            slot={slot}
            capture={latestBySlot[slot] ?? null}
          />
        ))}
      </div>
      {primary.length > 0 && others.length > 0 && (
        <div className="mt-3 grid grid-cols-4 gap-2">
          {others.map((slot) => (
            <CaptureCard
              key={slot}
              slot={slot}
              capture={latestBySlot[slot] ?? null}
            />
          ))}
        </div>
      )}
    </Card>
  );
}
