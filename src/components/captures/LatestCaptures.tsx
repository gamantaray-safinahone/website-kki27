"use client";

import { Video } from "lucide-react";
import { useMemo, useState } from "react";

import { Card } from "@/components/ui/Card";
import { useViewLintasan } from "@/lib/courseView";
import { isSlot, SLOT_LABELS, type Slot } from "@/lib/mission";
import { useLive } from "@/lib/live/store";
import type { Capture } from "@/lib/queries";

import { CaptureCard } from "./CaptureCard";
import { CaptureLightbox } from "./CaptureLightbox";

type Viewer = { slot: Slot; withSurface: boolean; id: number };

const newestFirst = (a: Capture, b: Capture) =>
  Date.parse(b.captured_at) - Date.parse(a.captured_at) || b.id - a.id;

// Slot cadangan bila baris lintasan belum dimuat (sama dengan isi awal migrasi).
const FALLBACK_SLOTS: Record<string, Slot[]> = {
  A: ["SR", "UL"],
  B: ["SL", "UR"],
};

// Camera Feeds: 3 panel untuk lintasan yang sedang dilihat (sama dengan peta).
// Urutan dari atas: slot surface lintasan, slot surface lainnya, slot underwater
// lintasan beserta foto permukaannya. A = SR, SL, UL; B = SL, SR, UR.
// Urutan diturunkan dari awalan S/U di courses.imaging_slots, jadi urutan isi
// kolom itu di database tidak berpengaruh. Slot milik lintasan diberi border lime.
export function LatestCaptures() {
  const captures = useLive((s) => s.captures);
  const [lintasan] = useViewLintasan();
  const courseSlots = useLive((s) => s.courses[lintasan]?.imaging_slots);
  const [viewer, setViewer] = useState<Viewer | null>(null);

  // Riwayat per slot, terbaru dulu. Foto yang disembunyikan admin tidak tampil.
  const bySlot = useMemo(() => {
    const result: Record<Slot, Capture[]> = { SL: [], SR: [], UL: [], UR: [] };
    for (const capture of Object.values(captures)) {
      if (!capture.hidden && isSlot(capture.slot))
        result[capture.slot].push(capture);
    }
    for (const list of Object.values(result)) list.sort(newestFirst);
    return result;
  }, [captures]);

  const usedSlots = (courseSlots ?? FALLBACK_SLOTS[lintasan] ?? []).filter(
    isSlot,
  );
  const surface = usedSlots.find((slot) => slot.startsWith("S")) ?? "SL";
  const otherSurface: Slot = surface === "SL" ? "SR" : "SL";
  const underwater = usedSlots.find((slot) => slot.startsWith("U")) ?? "UL";

  const panels: { slot: Slot; withSurface: boolean }[] = [
    { slot: surface, withSurface: false },
    { slot: otherSurface, withSurface: false },
    { slot: underwater, withSurface: true },
  ];

  return (
    <Card
      title="Camera Feeds"
      icon={Video}
      className="flex-1"
      action={
        <span className="text-sage-dingin text-sm font-semibold">
          Lintasan {lintasan}
        </span>
      }
    >
      <div className="bg-foreground/10 flex min-h-0 flex-1 flex-col gap-px">
        {panels.map(({ slot, withSurface }) => (
          <CaptureCard
            key={slot}
            code={slot}
            label={SLOT_LABELS[slot]}
            captures={bySlot[slot]}
            highlight={usedSlots.includes(slot)}
            withSurface={withSurface}
            onOpen={(id) => setViewer({ slot, withSurface, id })}
          />
        ))}
      </div>

      {viewer && (
        <CaptureLightbox
          label={SLOT_LABELS[viewer.slot]}
          captures={bySlot[viewer.slot]}
          currentId={viewer.id}
          withSurface={viewer.withSurface}
          onChange={(id) => setViewer({ ...viewer, id })}
          onClose={() => setViewer(null)}
        />
      )}
    </Card>
  );
}
