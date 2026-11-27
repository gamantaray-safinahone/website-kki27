"use client";

import { formatClock, formatCoord } from "@/lib/format";
import { SLOT_LABELS, type Slot } from "@/lib/mission";
import { capturePublicUrl, type Capture } from "@/lib/queries";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

// Thumbnail dimuat lebih dulu; foto penuh dibuka di tab baru saat diklik.
export function CaptureCard({
  slot,
  capture,
}: {
  slot: Slot;
  capture: Capture | null;
}) {
  const supabase = createSupabaseBrowserClient();

  return (
    <figure className="overflow-hidden rounded-lg border border-neutral-500/20">
      <div className="flex aspect-video items-center justify-center bg-neutral-500/10">
        {capture ? (
          <a
            href={capturePublicUrl(supabase, capture.storage_path)}
            target="_blank"
            rel="noreferrer"
            className="h-full w-full"
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- sengaja <img>, bukan optimasi Vercel */}
            <img
              src={capturePublicUrl(
                supabase,
                capture.thumb_path ?? capture.storage_path,
              )}
              alt={`${SLOT_LABELS[slot]} photo`}
              loading="lazy"
              className="h-full w-full object-cover"
            />
          </a>
        ) : (
          <span className="text-sm text-neutral-500">No photo yet</span>
        )}
      </div>
      <figcaption className="p-2 text-xs">
        <p className="font-semibold">
          {slot} · {SLOT_LABELS[slot]}
        </p>
        {capture && (
          <p className="text-neutral-500">
            {formatClock(capture.captured_at)} · {formatCoord(capture.lat)},{" "}
            {formatCoord(capture.lon)}
          </p>
        )}
      </figcaption>
    </figure>
  );
}
