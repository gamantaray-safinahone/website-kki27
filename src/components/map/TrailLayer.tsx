"use client";

import L from "leaflet";
import { useEffect } from "react";

import { useLive, type TrailPoint } from "@/lib/live/store";

// Jejak lintasan: garis merah putus-putus (gaya 2026, lebih tebal supaya terlihat
// di proyektor). Membaca store langsung (bukan lewat render React): titik baru
// ditambahkan satu per satu, dan jejak digambar ulang penuh hanya bila
// trailRevision berubah (run baru atau backlog datang tidak urut).
//
// hiddenUntilT: titik dengan t <= nilai ini tidak digambar. Dipakai tombol Reset
// untuk membersihkan jejak di layar saja; data di store dan database tetap utuh.
export function TrailLayer({
  map,
  hiddenUntilT,
}: {
  map: L.Map;
  hiddenUntilT: number | null;
}) {
  useEffect(() => {
    const line = L.polyline([], {
      color: "#dc2626",
      weight: 3,
      opacity: 0.9,
      dashArray: "8 6",
      interactive: false,
    }).addTo(map);
    const visible = (p: TrailPoint) =>
      hiddenUntilT == null || p.t > hiddenUntilT;
    let revision = -1;
    let drawn = 0;

    const draw = () => {
      const { trail, trailRevision } = useLive.getState();
      if (trailRevision !== revision) {
        line.setLatLngs(trail.filter(visible).map((p) => [p.lat, p.lon]));
        revision = trailRevision;
        drawn = trail.length;
        return;
      }
      for (let i = drawn; i < trail.length; i++) {
        if (visible(trail[i])) line.addLatLng([trail[i].lat, trail[i].lon]);
      }
      drawn = trail.length;
    };

    draw();
    const unsubscribe = useLive.subscribe(draw);
    return () => {
      unsubscribe();
      line.remove();
    };
  }, [map, hiddenUntilT]);

  return null;
}
