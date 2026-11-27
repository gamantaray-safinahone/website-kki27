"use client";

import L from "leaflet";
import { useEffect } from "react";

import { useLive } from "@/lib/live/store";

// Jejak lintasan. Membaca store langsung (bukan lewat render React):
// titik baru ditambahkan satu per satu, dan jejak digambar ulang penuh hanya
// bila trailRevision berubah (run baru atau backlog datang tidak urut).
export function TrailLayer({ map }: { map: L.Map }) {
  useEffect(() => {
    const line = L.polyline([], {
      color: "#f97316",
      weight: 3,
      opacity: 0.9,
    }).addTo(map);
    let revision = -1;
    let drawn = 0;

    const draw = () => {
      const { trail, trailRevision } = useLive.getState();
      if (trailRevision !== revision) {
        line.setLatLngs(trail.map((p) => [p.lat, p.lon]));
        revision = trailRevision;
        drawn = trail.length;
        return;
      }
      for (let i = drawn; i < trail.length; i++) {
        line.addLatLng([trail[i].lat, trail[i].lon]);
      }
      drawn = trail.length;
    };

    draw();
    const unsubscribe = useLive.subscribe(draw);
    return () => {
      unsubscribe();
      line.remove();
    };
  }, [map]);

  return null;
}
