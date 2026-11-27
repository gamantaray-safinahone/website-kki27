"use client";

import "leaflet/dist/leaflet.css";

import L from "leaflet";
import { useCallback, useEffect, useMemo, useState } from "react";

import { gridLines } from "@/lib/geo";
import { selectCourse, useLive } from "@/lib/live/store";
import type { Course } from "@/lib/queries";

import { BoatMarker } from "./BoatMarker";
import { CourseLayer } from "./CourseLayer";
import { GridLayer } from "./GridLayer";
import { TrailLayer } from "./TrailLayer";

// Tampilan awal sebelum ada koordinat lintasan maupun posisi kapal (Indonesia).
const FALLBACK_VIEW: L.LatLngExpression = [-2.5, 118];
const BOAT_ZOOM = 20;

// Batas grid lintasan, dipakai untuk menyesuaikan zoom peta ke area lomba.
function courseBounds(course: Course | null): L.LatLngBounds | null {
  if (!course || course.center_lat == null || course.center_lon == null)
    return null;
  const points = gridLines(
    { lat: course.center_lat, lon: course.center_lon },
    course.grid_rows,
    course.grid_cols,
    course.grid_cell_m,
    course.grid_bearing_deg,
  ).flat();
  return L.latLngBounds(points.map((p) => [p.lat, p.lon]));
}

export default function LeafletMap() {
  const [map, setMap] = useState<L.Map | null>(null);
  const course = useLive(selectCourse);
  const allItems = useLive((s) => s.items);
  const runId = useLive((s) => s.run?.id ?? null);

  const items = useMemo(
    () =>
      Object.values(allItems).filter((i) => i.lintasan === course?.lintasan),
    [allItems, course?.lintasan],
  );

  // Peta dibuat saat elemen <div> dipasang dan dihapus saat dilepas.
  const containerRef = useCallback((element: HTMLDivElement | null) => {
    if (!element) return;
    const m = L.map(element, { maxZoom: 22, zoomSnap: 0.5 }).setView(
      FALLBACK_VIEW,
      5,
    );

    const streets = L.tileLayer(
      "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
      {
        maxNativeZoom: 19,
        maxZoom: 22,
        attribution: "&copy; OpenStreetMap contributors",
      },
    ).addTo(m);
    const satellite = L.tileLayer(
      "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      { maxNativeZoom: 19, maxZoom: 22, attribution: "Imagery &copy; Esri" },
    );
    const seamarks = L.tileLayer(
      "https://tiles.openseamap.org/seamark/{z}/{x}/{y}.png",
      {
        maxNativeZoom: 18,
        maxZoom: 22,
        attribution: "&copy; OpenSeaMap",
      },
    );
    L.control
      .layers({ Map: streets, Satellite: satellite }, { "Sea marks": seamarks })
      .addTo(m);
    L.control.scale({ imperial: false }).addTo(m);

    setMap(m);
    return () => {
      m.remove();
      setMap(null);
    };
  }, []);

  const bounds = useMemo(() => courseBounds(course), [course]);
  const hasCenter = bounds != null;

  // Ada koordinat lintasan: sesuaikan peta ke seluruh grid lintasan.
  useEffect(() => {
    if (map && bounds)
      map.fitBounds(bounds, { padding: [24, 24], maxZoom: 22 });
  }, [map, bounds]);

  // Belum ada koordinat lintasan: pusatkan sekali ke posisi kapal pertama tiap run.
  useEffect(() => {
    if (!map || hasCenter) return;
    let done = false;
    const tryCenter = () => {
      const latest = useLive.getState().latest;
      if (done || !latest || latest.lat == null || latest.lon == null) return;
      map.setView([latest.lat, latest.lon], BOAT_ZOOM);
      done = true;
    };
    tryCenter();
    return useLive.subscribe(tryCenter);
  }, [map, hasCenter, runId]);

  const recenter = () => {
    if (!map) return;
    const latest = useLive.getState().latest;
    if (bounds) {
      map.fitBounds(bounds, { padding: [24, 24], maxZoom: 22 });
    } else if (latest?.lat != null && latest.lon != null) {
      map.setView([latest.lat, latest.lon], BOAT_ZOOM);
    }
  };

  return (
    <>
      <div ref={containerRef} className="h-full w-full" />
      <button
        type="button"
        onClick={recenter}
        className="absolute right-3 bottom-8 z-[1000] rounded-md border border-neutral-500/40 bg-white px-2 py-1 text-xs font-medium text-neutral-800 shadow"
      >
        Recenter
      </button>
      {map && (
        <>
          <GridLayer map={map} course={course} />
          <CourseLayer map={map} items={items} />
          <TrailLayer map={map} />
          <BoatMarker map={map} />
        </>
      )}
    </>
  );
}
