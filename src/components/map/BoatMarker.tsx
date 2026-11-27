"use client";

import L from "leaflet";
import { useEffect } from "react";

import { destination } from "@/lib/geo";
import { useLive } from "@/lib/live/store";
import type { Telemetry } from "@/lib/queries";

// Ikon kapal dari dashboard 2026 (haluan menghadap ke atas), proporsi gambar dijaga.
const BOAT_HTML = `<div class="boat-icon"><img src="/kapalasli3.png" alt="" draggable="false" /></div>`;

// Ikon kapal berputar sesuai heading (arah haluan), plus garis putus-putus arah COG.
export function BoatMarker({ map }: { map: L.Map }) {
  useEffect(() => {
    const icon = L.divIcon({
      html: BOAT_HTML,
      className: "boat-marker",
      iconSize: [30, 50],
      iconAnchor: [15, 25],
    });
    const marker = L.marker([0, 0], {
      icon,
      interactive: false,
      keyboard: false,
    });
    const cogLine = L.polyline([], {
      color: "#0f172a",
      weight: 2,
      dashArray: "4 4",
      interactive: false,
    });
    let shown: Telemetry | null = null;

    // Matikan animasi geser saat zoom supaya ikon tidak "meluncur" setelah zoom.
    const freeze = () => marker.getElement()?.classList.add("no-transition");
    const unfreeze = () =>
      setTimeout(
        () => marker.getElement()?.classList.remove("no-transition"),
        50,
      );
    map.on("zoomstart", freeze);
    map.on("zoomend", unfreeze);

    const update = () => {
      const latest = useLive.getState().latest;
      if (latest === shown) return;
      shown = latest;
      if (!latest || latest.lat == null || latest.lon == null) {
        marker.remove();
        cogLine.remove();
        return;
      }
      const position = { lat: latest.lat, lon: latest.lon };
      marker.setLatLng([position.lat, position.lon]);
      if (!map.hasLayer(marker)) marker.addTo(map);

      const rotation = latest.heading_deg ?? latest.cog_deg ?? 0;
      const iconElement = marker
        .getElement()
        ?.querySelector<HTMLElement>(".boat-icon");
      if (iconElement) iconElement.style.transform = `rotate(${rotation}deg)`;

      if (latest.cog_deg != null) {
        const length = Math.max(4, (latest.sog_ms ?? 0) * 6); // meter
        const tip = destination(position, latest.cog_deg, length);
        cogLine.setLatLngs([
          [position.lat, position.lon],
          [tip.lat, tip.lon],
        ]);
        if (!map.hasLayer(cogLine)) cogLine.addTo(map);
      } else {
        cogLine.remove();
      }
    };

    update();
    const unsubscribe = useLive.subscribe(update);
    return () => {
      unsubscribe();
      map.off("zoomstart", freeze);
      map.off("zoomend", unfreeze);
      marker.remove();
      cogLine.remove();
    };
  }, [map]);

  return null;
}
