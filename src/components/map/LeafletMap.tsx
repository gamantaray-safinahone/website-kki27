"use client";

import "leaflet/dist/leaflet.css";

import L from "leaflet";
import { useCallback, useEffect, useMemo, useState } from "react";

import { gridLines } from "@/lib/geo";
import { useLive } from "@/lib/live/store";

import { BoatMarker } from "./BoatMarker";
import { CourseLayer } from "./CourseLayer";
import { GridLayer } from "./GridLayer";
import { MapControls } from "./MapControls";
import { MapLegend } from "./MapLegend";
import { TrailLayer } from "./TrailLayer";

const FALLBACK_VIEW: L.LatLngExpression = [-2.5, 118];
const BOAT_ZOOM = 20;
const FIT_OPTIONS: L.FitBoundsOptions = { padding: [24, 24], maxZoom: 22 };

export default function LeafletMap({ lintasan }: { lintasan: string }) {
  const [map, setMap] = useState<L.Map | null>(null);
  const course = useLive((s) => s.courses[lintasan] ?? null);
  const allItems = useLive((s) => s.items);
  const runId = useLive((s) => s.run?.id ?? null);
  const hasBoat = useLive((s) => s.latest?.lat != null && s.latest.lon != null);
  const [trailReset, setTrailReset] = useState<{
    runId: string | null;
    t: number;
  } | null>(null);

  const items = useMemo(
    () => Object.values(allItems).filter((i) => i.lintasan === lintasan),
    [allItems, lintasan],
  );

  const containerRef = useCallback((element: HTMLDivElement | null) => {
    if (!element) return;
    const m = L.map(element, {
      maxZoom: 22,
      zoomSnap: 0.5,
      attributionControl: true, 
    }).setView(FALLBACK_VIEW, 5);

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
      .layers(
        { Map: streets, Satellite: satellite },
        { "Sea marks": seamarks },
        { position: "topleft" },
      )
      .addTo(m);
    L.control.scale({ imperial: false, position: "bottomright" }).addTo(m);

    // Ukuran wadah berubah (layout, fullscreen): Leaflet perlu menghitung ulang.
    const resize = new ResizeObserver(() => m.invalidateSize());
    resize.observe(element);

    setMap(m);
    return () => {
      resize.disconnect();
      m.remove();
      setMap(null);
    };
  }, []);

  // lintasan yang isinya sama tidak menggeser peta yang sedang dilihat penonton.
  const centerLat = course?.center_lat ?? null;
  const centerLon = course?.center_lon ?? null;
  const rows = course?.grid_rows ?? 0;
  const cols = course?.grid_cols ?? 0;
  const cellM = course?.grid_cell_m ?? 0;
  const bearing = course?.grid_bearing_deg ?? 0;
  const bounds = useMemo(() => {
    if (centerLat == null || centerLon == null) return null;
    const points = gridLines(
      { lat: centerLat, lon: centerLon },
      rows,
      cols,
      cellM,
      bearing,
    ).flat();
    return L.latLngBounds(points.map((p) => [p.lat, p.lon]));
  }, [centerLat, centerLon, rows, cols, cellM, bearing]);
  const hasCenter = bounds != null;

  // Ada koordinat lintasan: sesuaikan peta ke seluruh grid lintasan.
  useEffect(() => {
    if (map && bounds) map.fitBounds(bounds, FIT_OPTIONS);
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

  const zoomToBoat = () => {
    const latest = useLive.getState().latest;
    if (map && latest?.lat != null && latest.lon != null) {
      map.setView([latest.lat, latest.lon], BOAT_ZOOM);
    }
  };

  const fitArena = () => {
    if (map && bounds) map.fitBounds(bounds, FIT_OPTIONS);
    else zoomToBoat();
  };

  const resetTrail = () => {
    const trail = useLive.getState().trail;
    const last = trail[trail.length - 1];
    if (last) setTrailReset({ runId, t: last.t });
  };

  const hiddenUntilT =
    trailReset && trailReset.runId === runId ? trailReset.t : null;

  return (
    <>
      <div ref={containerRef} className="absolute inset-0" />
      {map && (
        <>
          <GridLayer map={map} course={course} />
          <CourseLayer map={map} items={items} />
          <TrailLayer map={map} hiddenUntilT={hiddenUntilT} />
          <BoatMarker map={map} />
        </>
      )}
      <MapControls
        onBoat={zoomToBoat}
        onArena={fitArena}
        onReset={resetTrail}
        hasBoat={hasBoat}
      />
      <MapLegend />
    </>
  );
}
