"use client";

import dynamic from "next/dynamic";
import { useCallback, useMemo, useRef, useState } from "react";

import { useLive } from "@/lib/live/store";
import {
  COURSE_ITEM_KINDS,
  COURSE_ITEM_LABELS,
  type CourseItemKind,
} from "@/lib/mission";
import { insertCourseItem, updateCourseItem } from "@/lib/queries";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

import { CourseItemForm } from "./CourseItemForm";
import { CourseSettingsForm } from "./CourseSettingsForm";
import { StatusMessage, type ActionResult } from "./StatusMessage";
import { buttonClass, inputClass, sectionClass } from "./styles";

// Leaflet butuh `window`: peta editor hanya dimuat di browser.
const CourseEditorMap = dynamic(() => import("./CourseEditorMap"), {
  ssr: false,
  loading: () => (
    <div className="text-sage-dingin flex h-full items-center justify-center text-sm">
      Loading map…
    </div>
  ),
});

const LINTASAN = ["A", "B"] as const;

// Editor lintasan A/B: pengaturan lintasan, peta dengan objek yang bisa
// digeser, dan form objek terpilih. Data lewat useLive (Realtime dashboard),
// jadi perubahan langsung tampil di sini dan di dashboard.
export function CourseEditor() {
  const [lintasan, setLintasan] = useState<string>("A");
  const course = useLive((s) => s.courses[lintasan] ?? null);
  const allItems = useLive((s) => s.items);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [newKind, setNewKind] = useState<CourseItemKind>("buoy_red");
  const [result, setResult] = useState<ActionResult>(null);
  const getMapCenter = useRef<(() => { lat: number; lon: number }) | null>(
    null,
  );

  const items = useMemo(
    () =>
      Object.values(allItems)
        .filter((i) => i.lintasan === lintasan)
        .sort((a, b) => a.kind.localeCompare(b.kind) || a.seq - b.seq),
    [allItems, lintasan],
  );
  const selected = items.find((i) => i.id === selectedId) ?? null;

  const onMapReady = useCallback(
    (getCenter: () => { lat: number; lon: number }) => {
      getMapCenter.current = getCenter;
    },
    [],
  );

  const onMove = useCallback(async (id: number, lat: number, lon: number) => {
    setSelectedId(id);
    const error = await updateCourseItem(createSupabaseBrowserClient(), id, {
      lat,
      lon,
    });
    setResult(
      error
        ? { ok: false, text: error.message }
        : { ok: true, text: "Position saved." },
    );
  }, []);

  async function addItem() {
    const center = getMapCenter.current?.();
    if (!center) return;
    const seq =
      Math.max(
        0,
        ...items.filter((i) => i.kind === newKind).map((i) => i.seq),
      ) + 1;
    const error = await insertCourseItem(createSupabaseBrowserClient(), {
      lintasan,
      kind: newKind,
      seq,
      lat: center.lat,
      lon: center.lon,
    });
    setResult(
      error
        ? { ok: false, text: error.message }
        : {
            ok: true,
            text: `${COURSE_ITEM_LABELS[newKind]} ${seq} added at the map center. Drag it into place.`,
          },
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-kapur-muda font-semibold">Course editor</h1>
        <div className="flex gap-1">
          {LINTASAN.map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => {
                setLintasan(key);
                setSelectedId(null);
              }}
              aria-pressed={lintasan === key}
              className={`${buttonClass} ${lintasan === key ? "border-lime-neon text-lime-neon" : ""}`}
            >
              Course {key}
            </button>
          ))}
        </div>
        <span className="text-sage-dingin text-xs">
          Existing runs keep their own copy of the course.
        </span>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <div className="flex flex-col gap-3">
          <div className="border-border relative h-[60vh] min-h-80 border">
            <CourseEditorMap
              course={course}
              items={items}
              selectedId={selectedId}
              onSelect={setSelectedId}
              onMove={onMove}
              onMapReady={onMapReady}
            />
          </div>
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <select
              value={newKind}
              onChange={(e) => setNewKind(e.target.value as CourseItemKind)}
              className={`${inputClass} w-auto`}
            >
              {COURSE_ITEM_KINDS.map((k) => (
                <option key={k} value={k}>
                  {COURSE_ITEM_LABELS[k]}
                </option>
              ))}
            </select>
            <button type="button" onClick={addItem} className={buttonClass}>
              Add at map center
            </button>
          </div>
          <StatusMessage result={result} />
        </div>

        <div className="flex flex-col gap-6">
          <section className={sectionClass}>
            <h2 className="text-kapur-muda font-semibold">
              {selected
                ? `${COURSE_ITEM_LABELS[selected.kind as CourseItemKind] ?? selected.kind} ${selected.seq}`
                : "Object"}
            </h2>
            {selected ? (
              <CourseItemForm
                key={`${selected.id}-${selected.updated_at}`}
                item={selected}
                onDeleted={() => setSelectedId(null)}
              />
            ) : (
              <p className="text-sage-dingin text-sm">
                Click an object on the map or in the list to edit it.
              </p>
            )}
            {items.length > 0 && (
              <ul className="divide-border max-h-56 divide-y overflow-y-auto text-sm">
                {items.map((item) => (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => setSelectedId(item.id)}
                      className={`hover:text-lime-neon w-full py-1.5 text-left ${item.id === selectedId ? "text-lime-neon" : ""}`}
                    >
                      {COURSE_ITEM_LABELS[item.kind as CourseItemKind] ??
                        item.kind}{" "}
                      {item.seq}
                      {item.label ? ` · ${item.label}` : ""}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className={sectionClass}>
            <h2 className="text-kapur-muda font-semibold">
              Course {lintasan} settings
            </h2>
            {course ? (
              <CourseSettingsForm
                key={`${course.lintasan}-${course.updated_at}`}
                course={course}
              />
            ) : (
              <p className="text-sage-dingin text-sm">Loading…</p>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
