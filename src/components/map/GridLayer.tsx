"use client";

import L from "leaflet";
import { useEffect } from "react";

import { gridLines } from "@/lib/geo";
import type { Course } from "@/lib/queries";

// Grid area lomba (default 6 x 6 sel @ 5 m), digambar hanya bila koordinat pusat sudah diisi.
export function GridLayer({
  map,
  course,
}: {
  map: L.Map;
  course: Course | null;
}) {
  useEffect(() => {
    if (!course || course.center_lat == null || course.center_lon == null)
      return;
    const lines = gridLines(
      { lat: course.center_lat, lon: course.center_lon },
      course.grid_rows,
      course.grid_cols,
      course.grid_cell_m,
      course.grid_bearing_deg,
    );
    const group = L.layerGroup(
      lines.map((line) =>
        L.polyline(
          line.map((p) => [p.lat, p.lon]),
          { color: "#64748b", weight: 1, opacity: 0.7, interactive: false },
        ),
      ),
    ).addTo(map);
    return () => {
      group.remove();
    };
  }, [map, course]);

  return null;
}
