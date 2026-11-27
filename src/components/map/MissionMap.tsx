"use client";

import { Map as MapIcon, Maximize, Minimize } from "lucide-react";
// Leaflet butuh `window`, jadi peta hanya dimuat di browser (ssr: false).
import dynamic from "next/dynamic";
import { useRef, useSyncExternalStore } from "react";

import { RunInfo } from "@/components/status/RunInfo";
import { Card } from "@/components/ui/Card";
import { useViewLintasan } from "@/lib/courseView";

const LeafletMap = dynamic(() => import("./LeafletMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center text-sm text-slate-600">
      Loading map…
    </div>
  ),
});

const LINTASAN = ["A", "B"] as const;

function subscribeFullscreen(onChange: () => void) {
  document.addEventListener("fullscreenchange", onChange);
  return () => document.removeEventListener("fullscreenchange", onChange);
}
const isFullscreenNow = () => document.fullscreenElement != null;
const isFullscreenOnServer = () => false;

// Panel Real-Time Map gaya 2026.
export function MissionMap() {
  // Pilihan Lintasan A/B hanya mengganti tampilan lokal (peta dan Camera Feeds).
  const [lintasan, setLintasan] = useViewLintasan();
  const bodyRef = useRef<HTMLDivElement>(null);
  const isFullscreen = useSyncExternalStore(
    subscribeFullscreen,
    isFullscreenNow,
    isFullscreenOnServer,
  );

  const toggleFullscreen = () => {
    if (document.fullscreenElement) void document.exitFullscreen();
    else void bodyRef.current?.requestFullscreen?.();
  };

  return (
    <Card
      title="Real-Time Map"
      icon={MapIcon}
      className="flex-1"
      action={
        // flex-auto (bukan flex-1): bila tidak muat di samping judul, grup ini turun ke baris baru.
        <div className="flex min-w-0 flex-auto flex-wrap items-center justify-end gap-x-4 gap-y-2">
          <RunInfo />
          <div
            role="group"
            aria-label="Course shown on the map"
            className="flex shrink-0"
          >
            {LINTASAN.map((value) => (
              <button
                key={value}
                type="button"
                aria-pressed={lintasan === value}
                onClick={() => setLintasan(value)}
                className={`tall:px-4 tall:py-1.5 border px-3 py-1 text-sm transition-colors ${
                  lintasan === value
                    ? "border-lime-neon bg-lime-neon text-on-accent"
                    : "border-border text-kapur-muda/80 hover:bg-foreground/5"
                }`}
              >
                Lintasan {value}
              </button>
            ))}
          </div>
        </div>
      }
    >
      <div
        ref={bodyRef}
        className="relative min-h-0 flex-1 overflow-hidden bg-[#dfeccf]"
      >
        <LeafletMap lintasan={lintasan} />

        <div className="absolute top-3 right-3 z-[1000] flex items-start gap-2">
          <span className="bg-lime-neon text-on-accent inline-flex h-8 items-center px-2.5 text-xs font-bold tracking-widest shadow-md">
            Lintasan {lintasan}
          </span>
          <button
            type="button"
            aria-label={
              isFullscreen ? "Exit fullscreen" : "Show map fullscreen"
            }
            onClick={toggleFullscreen}
            className="border-border bg-surface-strong text-kapur-muda hover:text-lime-neon inline-flex size-8 items-center justify-center border shadow-lg transition-colors"
          >
            {isFullscreen ? (
              <Minimize className="size-3.5" aria-hidden />
            ) : (
              <Maximize className="size-3.5" aria-hidden />
            )}
          </button>
        </div>
      </div>
    </Card>
  );
}
