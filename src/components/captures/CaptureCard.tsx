/* eslint-disable @next/next/no-img-element -- foto dari Supabase Storage, sengaja <img> (bukan optimasi gambar Vercel) */
import { Camera } from "lucide-react";

import { formatWibTime } from "@/lib/format";
import type { Slot } from "@/lib/mission";
import { capturePublicUrl, type Capture } from "@/lib/queries";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

import { CaptureStrip } from "./CaptureStrip";

// Satu panel kamera
export function CaptureCard({
  code,
  label,
  captures,
  border,
  withSurface = false,
  onOpen,
}: {
  code: Slot;
  label: string;
  captures: Capture[]; // urut terbaru dulu
  // none = bingkai dipegang pembungkus (pasangan surface + underwater)
  border: "green" | "none";
  withSurface?: boolean;
  onOpen: (id: number) => void;
}) {
  const supabase = createSupabaseBrowserClient();
  const latest = captures[0] ?? null;
  const surfaceThumb = latest
    ? (latest.surface_thumb_path ?? latest.surface_path)
    : null;
  const overlay =
    "pointer-events-none absolute bg-black/60 px-1.5 py-0.5 text-xs text-white";

  return (
    <article
      aria-label={`${label} camera`}
      className={`bg-surface tall:p-2 flex min-h-0 flex-col border p-1.5 xl:flex-1 ${
        border === "green" ? "border-green-500" : "border-transparent"
      }`}
    >
      <div className="light:bg-slate-200 relative min-h-44 flex-1 overflow-hidden bg-black/30 xl:min-h-0">
        {latest ? (
          <button
            type="button"
            onClick={() => onOpen(latest.id)}
            aria-label={`Open latest ${label} photo`}
            className="absolute inset-0"
          >
            <img
              src={capturePublicUrl(
                supabase,
                latest.thumb_path ?? latest.storage_path,
              )}
              alt=""
              className="h-full w-full object-cover opacity-90"
            />
          </button>
        ) : (
          <div className="text-sage-dingin absolute inset-0 flex flex-col items-center justify-center gap-2">
            <Camera className="tall:size-12 size-8" aria-hidden />
            <span className="text-xs tracking-[0.2em] uppercase">
              No photo yet
            </span>
          </div>
        )}

        <span
          className={`${overlay} top-1.5 left-1.5 font-bold tracking-widest`}
        >
          {code}
        </span>
        {latest && (
          <time
            dateTime={latest.captured_at}
            className={`${overlay} top-1.5 right-1.5 tabular-nums`}
          >
            {formatWibTime(latest.captured_at)} WIB
          </time>
        )}
        <span
          className={`${overlay} bottom-0 left-0 font-semibold tracking-[0.12em]`}
        >
          {label}
        </span>

        {withSurface && latest && (
          <div className="pointer-events-none absolute right-1.5 bottom-1.5 aspect-video w-[34%] overflow-hidden border border-white/70 bg-black/70 shadow-lg">
            {surfaceThumb ? (
              <img
                src={capturePublicUrl(supabase, surfaceThumb)}
                alt=""
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="flex h-full items-center justify-center px-1 text-center text-[10px] leading-tight text-white/80">
                No surface photo
              </span>
            )}
          </div>
        )}
      </div>

      {captures.length > 1 && (
        <CaptureStrip label={label} captures={captures} onOpen={onOpen} />
      )}
    </article>
  );
}
