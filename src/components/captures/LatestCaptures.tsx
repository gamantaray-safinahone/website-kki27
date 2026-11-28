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

// Slot cadangan bila baris lintasan belum dimuat
const FALLBACK_SLOTS: Record<string, Slot[]> = {
  A: ["SR", "UL"],
  B: ["SL", "UR"],
};

// Camera Feeds: 3 panel untuk lintasan yang sedang dilihat (sama dengan peta).
// Urutan dari atas: slot surface lintasan, slot surface lainnya, slot underwater
// lintasan beserta foto permukaannya. A = SR, SL, UL; B = SL, SR, UR.
// Border: surface lintasan hijau; surface lainnya + underwater dalam satu bingkai biru.
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

  const card = (slot: Slot, withSurface: boolean, border: "green" | "none") => (
    <CaptureCard
      key={slot}
      code={slot}
      label={SLOT_LABELS[slot]}
      captures={bySlot[slot]}
      border={border}
      withSurface={withSurface}
      onOpen={(id) => setViewer({ slot, withSurface, id })}
    />
  );

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
        {card(surface, false, "green")}
        {/* Surface lainnya + underwater satu pasangan: satu bingkai biru. */}
        <div className="flex min-h-0 flex-col gap-px border border-blue-500 xl:flex-2">
          {card(otherSurface, false, "none")}
          {card(underwater, true, "none")}
        </div>
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
