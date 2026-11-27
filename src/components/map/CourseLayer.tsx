"use client";

import L from "leaflet";
import { useEffect } from "react";

import { offsetMeters } from "@/lib/geo";
import type { CourseItem } from "@/lib/queries";

const BUOY_COLORS: Record<string, string> = {
  buoy_red: "#dc2626",
  buoy_green: "#16a34a",
  buoy_blue: "#2563eb",
};

const KIND_LABELS: Record<string, string> = {
  start: "Start",
  finish: "Finish",
  buoy_red: "Red buoy",
  buoy_green: "Green buoy",
  buoy_blue: "Docking ball",
  imaging_surface: "Surface imaging (green box)",
  imaging_underwater: "Underwater imaging (blue box)",
  waypoint: "Waypoint",
};

const BOX_HALF_M = 0.75; // kotak imaging digambar 1,5 x 1,5 m

function toLayer(item: CourseItem): L.Layer {
  const label = `${KIND_LABELS[item.kind] ?? item.kind} ${item.seq}${item.label ? ` · ${item.label}` : ""}`;
  const at: L.LatLngExpression = [item.lat, item.lon];

  if (item.kind in BUOY_COLORS) {
    return L.circleMarker(at, {
      radius: 6,
      color: "#ffffff",
      weight: 1.5,
      fillColor: BUOY_COLORS[item.kind],
      fillOpacity: 1,
    }).bindTooltip(label);
  }
  if (item.kind === "imaging_surface" || item.kind === "imaging_underwater") {
    const center = { lat: item.lat, lon: item.lon };
    const sw = offsetMeters(center, -BOX_HALF_M, -BOX_HALF_M);
    const ne = offsetMeters(center, BOX_HALF_M, BOX_HALF_M);
    return L.rectangle(
      [
        [sw.lat, sw.lon],
        [ne.lat, ne.lon],
      ],
      {
        color: item.kind === "imaging_surface" ? "#16a34a" : "#2563eb",
        weight: 2,
        fillOpacity: 0.25,
      },
    ).bindTooltip(label);
  }
  if (item.kind === "start" || item.kind === "finish") {
    return L.circleMarker(at, {
      radius: 8,
      color: "#0f172a",
      weight: 3,
      fillColor: "#fff",
      fillOpacity: 1,
    }).bindTooltip(KIND_LABELS[item.kind], {
      permanent: true,
      direction: "top",
      offset: [0, -8],
    });
  }
  return L.circleMarker(at, {
    radius: 4,
    color: "#64748b",
    weight: 1,
    fillOpacity: 0.8,
  }).bindTooltip(label);
}

// Buoy, kotak imaging, start/finish, dan waypoint lintasan yang sedang ditampilkan.
export function CourseLayer({
  map,
  items,
}: {
  map: L.Map;
  items: CourseItem[];
}) {
  useEffect(() => {
    const group = L.layerGroup(items.map(toLayer)).addTo(map);
    return () => {
      group.remove();
    };
  }, [map, items]);

  return null;
}
