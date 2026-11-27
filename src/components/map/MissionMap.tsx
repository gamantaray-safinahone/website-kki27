"use client";

// Leaflet butuh `window`, jadi peta hanya dimuat di browser (ssr: false).
import dynamic from "next/dynamic";

const LeafletMap = dynamic(() => import("./LeafletMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center text-sm text-neutral-500">
      Loading map…
    </div>
  ),
});

export function MissionMap() {
  return (
    <div className="relative h-full min-h-80 w-full overflow-hidden rounded-xl border border-neutral-500/25">
      <LeafletMap />
    </div>
  );
}
