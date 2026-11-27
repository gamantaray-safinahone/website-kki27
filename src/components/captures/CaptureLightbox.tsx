import { ChevronLeft, ChevronRight, X } from "lucide-react";
import {
  useEffect,
  useId,
  useRef,
  type KeyboardEvent,
  type MouseEvent,
} from "react";

import {
  formatCoord,
  formatDeg,
  formatNumber,
  formatWibTime,
} from "@/lib/format";
import { capturePublicUrl, type Capture } from "@/lib/queries";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

import { DetectionOverlay } from "./DetectionOverlay";

const FOCUSABLE =
  'button:not([disabled]), [href], [tabindex]:not([tabindex="-1"])';

// Lightbox foto penuh. Memakai <dialog> modal bawaan browser: tampil di atas
// semua elemen dan bagian halaman lain tidak bisa diklik selama terbuka.
// - ESC atau klik di luar foto menutup; fokus dikunci di dalam dialog.
// - ← foto lebih baru, → foto lebih lama (riwayat slot yang sama).
// - Foto yang dilihat diingat lewat id, jadi tidak berpindah walau foto baru masuk.
export function CaptureLightbox({
  label,
  captures,
  currentId,
  withSurface,
  onChange,
  onClose,
}: {
  label: string;
  captures: Capture[]; // urut terbaru dulu
  currentId: number;
  withSurface: boolean;
  onChange: (id: number) => void;
  onClose: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const supabase = createSupabaseBrowserClient();

  useEffect(() => {
    const dialog = dialogRef.current;
    const opener =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    if (dialog && !dialog.open) dialog.showModal();
    return () => {
      dialog?.close();
      opener?.focus(); // kembalikan fokus ke tombol yang membuka lightbox
    };
  }, []);

  const index = captures.findIndex((c) => c.id === currentId);
  const current = index >= 0 ? captures[index] : null;
  const newer = index > 0 ? captures[index - 1] : null;
  const older =
    index >= 0 && index < captures.length - 1 ? captures[index + 1] : null;

  const onKeyDown = (event: KeyboardEvent<HTMLDialogElement>) => {
    if (event.key === "ArrowLeft" && newer) {
      event.preventDefault();
      onChange(newer.id);
    } else if (event.key === "ArrowRight" && older) {
      event.preventDefault();
      onChange(older.id);
    } else if (event.key === "Tab") {
      // Kunci fokus: Tab dari tombol terakhir kembali ke tombol pertama, dan sebaliknya.
      const items = Array.from(
        event.currentTarget.querySelectorAll<HTMLElement>(FOCUSABLE),
      );
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
  };

  // Klik di area kosong (dialog atau wadah bertanda data-backdrop) menutup lightbox.
  const onClick = (event: MouseEvent<HTMLDialogElement>) => {
    const target = event.target as HTMLElement;
    if (target === event.currentTarget || target.dataset.backdrop != null)
      onClose();
  };

  const surfacePath = current
    ? (current.surface_path ?? current.surface_thumb_path)
    : null;
  const navButton =
    "flex size-10 shrink-0 items-center justify-center border border-border bg-surface-strong text-kapur-muda transition-colors hover:text-lime-neon disabled:opacity-30 disabled:hover:text-kapur-muda";

  return (
    <dialog
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      onCancel={(event) => {
        event.preventDefault(); // ESC: tutup lewat state React
        onClose();
      }}
      onKeyDown={onKeyDown}
      onClick={onClick}
      className="text-kapur-muda fixed inset-0 m-0 h-dvh max-h-none w-screen max-w-none bg-transparent p-3 backdrop:bg-black/80 backdrop:backdrop-blur-sm sm:p-6"
    >
      <div
        data-backdrop
        className="mx-auto flex h-full max-w-7xl flex-col gap-3"
      >
        <header className="border-border bg-surface-strong flex items-center gap-3 border px-4 py-2">
          <h2 id={titleId} className="min-w-0 flex-1 truncate font-medium">
            {label}
            {current && ` · ${formatWibTime(current.captured_at)} WIB`}
          </h2>
          {index >= 0 && (
            <span className="text-sage-dingin text-sm tabular-nums">
              {index + 1} / {captures.length}
            </span>
          )}
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="hover:text-lime-neon flex size-8 items-center justify-center transition-colors"
          >
            <X className="size-5" aria-hidden />
          </button>
        </header>

        <div
          data-backdrop
          className="flex min-h-0 flex-1 items-center justify-center gap-2 sm:gap-4"
        >
          <button
            type="button"
            className={navButton}
            aria-label="Newer photo"
            disabled={!newer}
            onClick={() => newer && onChange(newer.id)}
          >
            <ChevronLeft className="size-5" aria-hidden />
          </button>

          <div
            data-backdrop
            className="flex min-h-0 min-w-0 flex-1 flex-col items-center justify-center gap-3 md:flex-row"
          >
            {current ? (
              <>
                <figure className="flex min-w-0 flex-col items-center gap-1">
                  <div className="border-lime-neon relative inline-block max-w-full border-2">
                    <img
                      src={capturePublicUrl(supabase, current.storage_path)}
                      alt={`${label} photo`}
                      className="block h-auto max-h-[60vh] w-auto max-w-full"
                    />
                    <DetectionOverlay detection={current.detection} />
                  </div>
                  {withSurface && (
                    <figcaption className="text-sage-dingin text-xs">
                      Underwater
                    </figcaption>
                  )}
                </figure>
                {withSurface && (
                  <figure className="flex min-w-0 flex-col items-center gap-1">
                    {surfacePath ? (
                      <img
                        src={capturePublicUrl(supabase, surfacePath)}
                        alt={`Surface photo taken with the ${label} photo`}
                        className="border-border block h-auto max-h-[60vh] w-auto max-w-full border-2"
                      />
                    ) : (
                      <div className="border-border bg-surface-strong text-sage-dingin flex h-40 w-64 max-w-full items-center justify-center border-2 text-sm">
                        No surface photo
                      </div>
                    )}
                    <figcaption className="text-sage-dingin text-xs">
                      Surface (same moment)
                    </figcaption>
                  </figure>
                )}
              </>
            ) : (
              <p className="border-border bg-surface-strong border px-4 py-3 text-sm">
                This photo is no longer available.
              </p>
            )}
          </div>

          <button
            type="button"
            className={navButton}
            aria-label="Older photo"
            disabled={!older}
            onClick={() => older && onChange(older.id)}
          >
            <ChevronRight className="size-5" aria-hidden />
          </button>
        </div>

        {current && (
          <dl className="border-border bg-surface-strong grid grid-cols-2 gap-x-6 gap-y-1 border px-4 py-2 text-sm sm:grid-cols-4">
            <div>
              <dt className="text-sage-dingin text-xs">Time</dt>
              <dd className="tabular-nums">
                {formatWibTime(current.captured_at)} WIB
              </dd>
            </div>
            <div>
              <dt className="text-sage-dingin text-xs">Position</dt>
              <dd className="tabular-nums">
                {formatCoord(current.lat)}, {formatCoord(current.lon)}
              </dd>
            </div>
            <div>
              <dt className="text-sage-dingin text-xs">SoG</dt>
              <dd className="tabular-nums">
                {current.sog_ms != null
                  ? `${formatNumber(current.sog_ms, 1)} m/s`
                  : "—"}
              </dd>
            </div>
            <div>
              <dt className="text-sage-dingin text-xs">CoG</dt>
              <dd className="tabular-nums">{formatDeg(current.cog_deg)}</dd>
            </div>
          </dl>
        )}
      </div>
    </dialog>
  );
}
