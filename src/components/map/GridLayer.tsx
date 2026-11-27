"use client";

import L from "leaflet";
import { useEffect } from "react";

import { gridCells, gridLines } from "@/lib/geo";
import type { Course } from "@/lib/queries";

const LABEL_PANE = "gridLabels";

// Grid area lomba (ukuran dari tabel courses, default 6 x 6 sel @ 5 m) beserta
// label sel di tengahnya ("C3"). Digambar hanya bila koordinat pusat sudah diisi.
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

    // Label di pane sendiri: di atas kotak imaging, di bawah buoy dan kapal.
    if (!map.getPane(LABEL_PANE)) {
      const pane = map.createPane(LABEL_PANE);
      pane.style.zIndex = "450";
      pane.style.pointerEvents = "none";
    }

    const center = { lat: course.center_lat, lon: course.center_lon };
    const args = [
      center,
      course.grid_rows,
      course.grid_cols,
      course.grid_cell_m,
      course.grid_bearing_deg,
    ] as const;

    const lines = gridLines(...args).map((line) =>
      L.polyline(
        line.map((p) => [p.lat, p.lon]),
        { color: "#0f172a", weight: 1, opacity: 0.3, interactive: false },
      ),
    );
    const labels = gridCells(...args).map((cell) =>
      L.marker([cell.center.lat, cell.center.lon], {
        pane: LABEL_PANE,
        interactive: false,
        keyboard: false,
        icon: L.divIcon({
          className: "grid-label",
          html: `<span>${cell.label}</span>`,
          iconSize: undefined,
        }),
      }),
    );

    const group = L.layerGroup([...lines, ...labels]).addTo(map);
    return () => {
      group.remove();
    };
  }, [map, course]);

  return null;
}
