/* eslint-disable @next/next/no-img-element -- thumbnail dari Supabase Storage, sengaja <img> (bukan optimasi gambar Vercel) */
import { formatWibTime } from "@/lib/format";
import { capturePublicUrl, type Capture } from "@/lib/queries";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

// Strip riwayat foto satu slot: terbaru di kiri, bisa digeser ke samping.
// Hanya memuat thumbnail; foto penuh dibuka di lightbox.
export function CaptureStrip({
  label,
  captures,
  onOpen,
}: {
  label: string;
  captures: Capture[]; // urut terbaru dulu
  onOpen: (id: number) => void;
}) {
  const supabase = createSupabaseBrowserClient();
  return (
    <ul
      aria-label={`${label} photo history`}
      className="flex shrink-0 gap-1 overflow-x-auto pt-1.5"
    >
      {captures.map((capture, index) => (
        <li key={capture.id} className="shrink-0">
          <button
            type="button"
            onClick={() => onOpen(capture.id)}
            aria-label={`Open ${label} photo from ${formatWibTime(capture.captured_at)} WIB`}
            className={`tall:h-11 tall:w-16 block h-8 w-12 overflow-hidden border ${
              index === 0
                ? "border-lime-neon"
                : "border-border hover:border-kapur-muda/60"
            }`}
          >
            <img
              src={capturePublicUrl(
                supabase,
                capture.thumb_path ?? capture.storage_path,
              )}
              alt=""
              loading="lazy"
              className="h-full w-full object-cover"
            />
          </button>
        </li>
      ))}
    </ul>
  );
}
