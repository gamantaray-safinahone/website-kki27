"use client";

import L from "leaflet";
import { useEffect } from "react";

import { offsetMeters } from "@/lib/geo";
import { COURSE_ITEM_LABELS, type CourseItemKind } from "@/lib/mission";
import type { CourseItem } from "@/lib/queries";

const BUOY_PX = 14;
const BUOY_ICONS: Record<string, string> = {
  buoy_red: "/merah.png",
  buoy_green: "/hijau.png",
  buoy_blue: "/biru.svg",
};

const BOX_HALF_M = 0.75;

function toLayer(item: CourseItem): L.Layer {
  const label = `${COURSE_ITEM_LABELS[item.kind as CourseItemKind] ?? item.kind} ${item.seq}${item.label ? ` · ${item.label}` : ""}`;
  const at: L.LatLngExpression = [item.lat, item.lon];

  const buoyIcon = BUOY_ICONS[item.kind];
  if (buoyIcon) {
    return L.marker(at, {
      keyboard: false,
      icon: L.icon({
        iconUrl: buoyIcon,
        iconSize: [BUOY_PX, BUOY_PX],
        iconAnchor: [BUOY_PX / 2, BUOY_PX / 2],
      }),
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
    return L.marker(at, {
      keyboard: false,
      icon: L.divIcon({
        className: "course-banner",
        html: `<span>${item.kind === "start" ? "START" : "FINISH"}</span>`,
        iconSize: undefined,
      }),
    }).bindTooltip(label);
  }
  return L.circleMarker(at, {
    radius: 5,
    color: "#475569",
    weight: 1.5,
    fillColor: "#ffffff",
    fillOpacity: 0.9,
  }).bindTooltip(label);
}

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
