"use client";

import { useState } from "react";

import { useLive } from "@/lib/live/store";
import { updateCourse, type Course } from "@/lib/queries";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

import { StatusMessage, type ActionResult } from "./StatusMessage";
import { buttonClass, inputClass, primaryButtonClass } from "./styles";

const text = (value: number | null) => (value == null ? "" : String(value));

// Angka dari input; "" = kosong (null), teks lain yang bukan angka = NaN.
function parse(value: string): number | null {
  const trimmed = value.trim();
  return trimmed === "" ? null : Number(trimmed);
}

// Koordinat pusat, ukuran grid, dan slot kamera satu lintasan. Aturan validasi
// sama dengan check constraint tabel courses.
export function CourseSettingsForm({ course }: { course: Course }) {
  const latest = useLive((s) => s.latest);
  const [lat, setLat] = useState(text(course.center_lat));
  const [lon, setLon] = useState(text(course.center_lon));
  const [rows, setRows] = useState(String(course.grid_rows));
  const [cols, setCols] = useState(String(course.grid_cols));
  const [cell, setCell] = useState(String(course.grid_cell_m));
  const [bearing, setBearing] = useState(String(course.grid_bearing_deg));
  const [surface, setSurface] = useState(
    course.imaging_slots.find((s) => s.startsWith("S")) ?? "SL",
  );
  const [underwater, setUnderwater] = useState(
    course.imaging_slots.find((s) => s.startsWith("U")) ?? "UL",
  );
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<ActionResult>(null);

  const boat =
    latest?.lat != null && latest.lon != null
      ? { lat: latest.lat, lon: latest.lon }
      : null;

  function validate(): string | null {
    const la = parse(lat);
    const lo = parse(lon);
    if ((la === null) !== (lo === null))
      return "Fill in both center latitude and longitude, or leave both empty.";
    if (la !== null && !(la >= -90 && la <= 90))
      return "Latitude must be between -90 and 90.";
    if (lo !== null && !(lo >= -180 && lo <= 180))
      return "Longitude must be between -180 and 180.";
    const r = Number(rows);
    const c = Number(cols);
    if (![r, c].every((n) => Number.isInteger(n) && n >= 1 && n <= 20))
      return "Grid rows and columns must be whole numbers from 1 to 20.";
    if (!(Number(cell) > 0)) return "Cell size must be greater than 0.";
    const b = Number(bearing);
    if (!(b >= 0 && b < 360)) return "Bearing must be from 0 up to 360.";
    return null;
  }

  async function save() {
    const problem = validate();
    if (problem) {
      setResult({ ok: false, text: problem });
      return;
    }
    setBusy(true);
    const error = await updateCourse(
      createSupabaseBrowserClient(),
      course.lintasan,
      {
        center_lat: parse(lat),
        center_lon: parse(lon),
        grid_rows: Number(rows),
        grid_cols: Number(cols),
        grid_cell_m: Number(cell),
        grid_bearing_deg: Number(bearing),
        imaging_slots: [underwater, surface],
      },
    );
    setBusy(false);
    setResult(
      error ? { ok: false, text: error.message } : { ok: true, text: "Saved." },
    );
  }

  const field = (
    label: string,
    value: string,
    set: (v: string) => void,
    inputMode: "decimal" | "numeric" = "decimal",
  ) => (
    <label className="flex flex-col gap-1 text-sm">
      <span className="text-sage-dingin">{label}</span>
      <input
        value={value}
        inputMode={inputMode}
        onChange={(e) => set(e.target.value)}
        className={inputClass}
      />
    </label>
  );

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-3">
        {field("Center latitude", lat, setLat)}
        {field("Center longitude", lon, setLon)}
      </div>
      <button
        type="button"
        disabled={!boat}
        onClick={() => {
          if (!boat) return;
          setLat(boat.lat.toFixed(7));
          setLon(boat.lon.toFixed(7));
        }}
        className={buttonClass}
        title={boat ? undefined : "No boat position yet"}
      >
        Use boat position
      </button>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {field("Grid rows", rows, setRows, "numeric")}
        {field("Grid columns", cols, setCols, "numeric")}
        {field("Cell size (m)", cell, setCell)}
        {field("Bearing (°)", bearing, setBearing)}
      </div>
      <div className="grid grid-cols-2 gap-3 text-sm">
        <label className="flex flex-col gap-1">
          <span className="text-sage-dingin">Surface camera</span>
          <select
            value={surface}
            onChange={(e) => setSurface(e.target.value)}
            className={inputClass}
          >
            <option value="SL">SL (surface left)</option>
            <option value="SR">SR (surface right)</option>
          </select>
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-sage-dingin">Underwater camera</span>
          <select
            value={underwater}
            onChange={(e) => setUnderwater(e.target.value)}
            className={inputClass}
          >
            <option value="UL">UL (underwater left)</option>
            <option value="UR">UR (underwater right)</option>
          </select>
        </label>
      </div>
      <div className="flex justify-end">
        <button
          type="button"
          onClick={save}
          disabled={busy}
          className={primaryButtonClass}
        >
          Save course
        </button>
      </div>
      <StatusMessage result={result} />
    </div>
  );
}
