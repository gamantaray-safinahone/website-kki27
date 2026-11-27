import "leaflet/dist/leaflet.css";

import L from "leaflet";
import { useCallback, useEffect, useState } from "react";

import { GridLayer } from "@/components/map/GridLayer";
import { gridLines } from "@/lib/geo";
import type { Course, CourseItem } from "@/lib/queries";

const KIND_COLORS: Record<string, string> = {
  start: "#0f172a",
  finish: "#0f172a",
  buoy_red: "#dc2626",
  buoy_green: "#16a34a",
  buoy_blue: "#2563eb",
  imaging_surface: "#16a34a",
  imaging_underwater: "#2563eb",
  waypoint: "#64748b",
};

function itemIcon(item: CourseItem, selected: boolean) {
  const size = selected ? 22 : 16;
  return L.divIcon({
    className: "",
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    html: `<span style="display:flex;width:${size}px;height:${size}px;align-items:center;justify-content:center;border-radius:9999px;background:${KIND_COLORS[item.kind] ?? "#64748b"};color:#fff;font:600 10px/1 sans-serif;border:2px solid ${selected ? "#d9f21a" : "#fff"};box-shadow:0 0 2px #000">${item.seq}</span>`,
  });
}

// Peta editor lintasan: grid dan objek lintasan yang bisa digeser (drag).
// Hanya dimuat di browser lewat next/dynamic (ssr: false).
export default function CourseEditorMap({
  course,
  items,
  selectedId,
  onSelect,
  onMove,
  onMapReady,
}: {
  course: Course | null;
  items: CourseItem[];
  selectedId: number | null;
  onSelect: (id: number) => void;
  onMove: (id: number, lat: number, lon: number) => void;
  onMapReady: (getCenter: () => { lat: number; lon: number }) => void;
}) {
  const [map, setMap] = useState<L.Map | null>(null);

  const containerRef = useCallback((element: HTMLDivElement | null) => {
    if (!element) return;
    const m = L.map(element, { maxZoom: 22, zoomSnap: 0.5 }).setView(
      [-2.5, 118],
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
    L.control
      .layers(
        { Map: streets, Satellite: satellite },
        {},
        { position: "topleft" },
      )
      .addTo(m);
    L.control.scale({ imperial: false, position: "bottomright" }).addTo(m);
    const resize = new ResizeObserver(() => m.invalidateSize());
    resize.observe(element);
    setMap(m);
    return () => {
      resize.disconnect();
      m.remove();
      setMap(null);
    };
  }, []);

  useEffect(() => {
    if (!map) return;
    onMapReady(() => {
      const c = map.getCenter();
      return { lat: c.lat, lon: c.lng };
    });
  }, [map, onMapReady]);

  // Pusatkan ke grid (bila koordinat pusat ada) atau ke objek lintasan,
  // hanya saat lintasan berganti, supaya drag tidak menggeser peta.
  const lintasan = course?.lintasan ?? null;
  useEffect(() => {
    if (!map || !course) return;
    if (course.center_lat != null && course.center_lon != null) {
      const points = gridLines(
        { lat: course.center_lat, lon: course.center_lon },
        course.grid_rows,
        course.grid_cols,
        course.grid_cell_m,
        course.grid_bearing_deg,
      ).flat();
      map.fitBounds(L.latLngBounds(points.map((p) => [p.lat, p.lon])), {
        padding: [24, 24],
        maxZoom: 22,
      });
    } else if (items.length > 0) {
      map.fitBounds(L.latLngBounds(items.map((i) => [i.lat, i.lon])), {
        padding: [40, 40],
        maxZoom: 21,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- hanya saat lintasan/peta berganti
  }, [map, lintasan]);

  useEffect(() => {
    if (!map) return;
    const markers = items.map((item) =>
      L.marker([item.lat, item.lon], {
        draggable: true,
        icon: itemIcon(item, item.id === selectedId),
        zIndexOffset: item.id === selectedId ? 1000 : 0,
      })
        .bindTooltip(
          `${item.kind} ${item.seq}${item.label ? ` · ${item.label}` : ""}`,
        )
        .on("click", () => onSelect(item.id))
        .on("dragend", (event) => {
          const at = (event.target as L.Marker).getLatLng();
          onMove(item.id, at.lat, at.lng);
        }),
    );
    const group = L.layerGroup(markers).addTo(map);
    return () => {
      group.remove();
    };
  }, [map, items, selectedId, onSelect, onMove]);

  return (
    <>
      <div ref={containerRef} className="absolute inset-0" />
      {map && <GridLayer map={map} course={course} />}
    </>
  );
}
