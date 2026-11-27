"use client";

import L from "leaflet";
import { useEffect } from "react";

import { useLive, type TrailPoint } from "@/lib/live/store";

// Jejak lintasan
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
