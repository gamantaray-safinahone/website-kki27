import { Navigation, RefreshCw, Target } from "lucide-react";

// Hanya dipakai di dalam LeafletMap (komponen client), jadi tidak perlu "use client".
export function MapControls({
  onBoat,
  onArena,
  onReset,
  hasBoat,
}: {
  onBoat: () => void;
  onArena: () => void;
  onReset: () => void;
  hasBoat: boolean;
}) {
  const button =
    "flex h-8 w-full items-center gap-2 px-3 text-xs font-semibold transition-colors hover:bg-foreground/10 disabled:cursor-not-allowed disabled:opacity-50";
  return (
    <div className="divide-border border-border bg-surface-strong text-kapur-muda absolute bottom-3 left-3 z-[1000] flex w-[130px] flex-col divide-y overflow-hidden border shadow-lg">
      <button
        type="button"
        className={button}
        onClick={onBoat}
        disabled={!hasBoat}
        title="Zoom to the boat"
      >
        <Navigation className="text-lime-neon size-3.5" aria-hidden />
        Kapal
      </button>
      <button
        type="button"
        className={button}
        onClick={onArena}
        title="Fit the course grid"
      >
        <Target className="text-lime-neon size-3.5" aria-hidden />
        Arena
      </button>
      <button
        type="button"
        className={button}
        onClick={onReset}
        title="Clear the trail on this screen (data is kept)"
      >
        <RefreshCw className="text-lime-neon size-3.5" aria-hidden />
        Reset
      </button>
    </div>
  );
}
