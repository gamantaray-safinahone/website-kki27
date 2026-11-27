import { useState } from "react";

import {
  COURSE_ITEM_KINDS,
  COURSE_ITEM_LABELS,
  type CourseItemKind,
} from "@/lib/mission";
import {
  deleteCourseItem,
  updateCourseItem,
  type CourseItem,
} from "@/lib/queries";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

import { useConfirm } from "./useConfirm";
import { StatusMessage, type ActionResult } from "./StatusMessage";
import { dangerButtonClass, inputClass, primaryButtonClass } from "./styles";

// Edit satu objek lintasan. Posisi juga bisa diubah dengan menggeser marker.
export function CourseItemForm({
  item,
  onDeleted,
}: {
  item: CourseItem;
  onDeleted: () => void;
}) {
  const [kind, setKind] = useState(item.kind as CourseItemKind);
  const [seq, setSeq] = useState(String(item.seq));
  const [label, setLabel] = useState(item.label ?? "");
  const [lat, setLat] = useState(String(item.lat));
  const [lon, setLon] = useState(String(item.lon));
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<ActionResult>(null);
  const { confirm, dialog } = useConfirm();

  async function save() {
    const la = Number(lat);
    const lo = Number(lon);
    const s = Number(seq);
    if (!(la >= -90 && la <= 90) || !(lo >= -180 && lo <= 180)) {
      setResult({ ok: false, text: "Latitude/longitude out of range." });
      return;
    }
    if (!Number.isInteger(s) || s < 0) {
      setResult({ ok: false, text: "Number must be a whole number." });
      return;
    }
    setBusy(true);
    const error = await updateCourseItem(
      createSupabaseBrowserClient(),
      item.id,
      { kind, seq: s, label: label.trim() || null, lat: la, lon: lo },
    );
    setBusy(false);
    setResult(
      error
        ? {
            ok: false,
            text:
              error.code === "23505"
                ? "Another object already uses this type and number."
                : error.message,
          }
        : { ok: true, text: "Saved." },
    );
  }

  async function remove() {
    if (
      !(await confirm(
        `Delete ${COURSE_ITEM_LABELS[kind]} ${item.seq}?`,
        "Delete",
      ))
    )
      return;
    const error = await deleteCourseItem(
      createSupabaseBrowserClient(),
      item.id,
    );
    if (error) setResult({ ok: false, text: error.message });
    else onDeleted();
  }

  return (
    <div className="flex flex-col gap-3 text-sm">
      {dialog}
      <div className="grid grid-cols-[minmax(0,2fr)_minmax(0,1fr)] gap-3">
        <label className="flex flex-col gap-1">
          <span className="text-sage-dingin">Type</span>
          <select
            value={kind}
            onChange={(e) => setKind(e.target.value as CourseItemKind)}
            className={inputClass}
          >
            {COURSE_ITEM_KINDS.map((k) => (
              <option key={k} value={k}>
                {COURSE_ITEM_LABELS[k]}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-sage-dingin">Number</span>
          <input
            value={seq}
            inputMode="numeric"
            onChange={(e) => setSeq(e.target.value)}
            className={inputClass}
          />
        </label>
      </div>
      <label className="flex flex-col gap-1">
        <span className="text-sage-dingin">Label (optional)</span>
        <input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          className={inputClass}
        />
      </label>
      <div className="grid grid-cols-2 gap-3">
        <label className="flex flex-col gap-1">
          <span className="text-sage-dingin">Latitude</span>
          <input
            value={lat}
            inputMode="decimal"
            onChange={(e) => setLat(e.target.value)}
            className={inputClass}
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-sage-dingin">Longitude</span>
          <input
            value={lon}
            inputMode="decimal"
            onChange={(e) => setLon(e.target.value)}
            className={inputClass}
          />
        </label>
      </div>
      <div className="flex justify-between gap-2">
        <button type="button" onClick={remove} className={dangerButtonClass}>
          Delete
        </button>
        <button
          type="button"
          onClick={save}
          disabled={busy}
          className={primaryButtonClass}
        >
          Save object
        </button>
      </div>
      <StatusMessage result={result} />
    </div>
  );
}
