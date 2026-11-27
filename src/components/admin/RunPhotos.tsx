"use client";

/* eslint-disable @next/next/no-img-element -- thumbnail dari Supabase Storage, sengaja <img> */
import { useCallback, useEffect, useState } from "react";

import { formatWibTime } from "@/lib/format";
import {
  capturePublicUrl,
  deleteCapture,
  fetchCaptures,
  setCaptureHidden,
  type Capture,
} from "@/lib/queries";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

import { useConfirm } from "./useConfirm";
import { StatusMessage, type ActionResult } from "./StatusMessage";
import { buttonClass, dangerButtonClass } from "./styles";

// Foto satu run: sembunyikan/tampilkan atau hapus (file lalu baris).
export function RunPhotos({ runId }: { runId: string }) {
  const [photos, setPhotos] = useState<Capture[] | null>(null);
  const [result, setResult] = useState<ActionResult>(null);
  const { confirm, dialog } = useConfirm();
  const supabase = createSupabaseBrowserClient();

  const load = useCallback(async () => {
    try {
      setPhotos(await fetchCaptures(createSupabaseBrowserClient(), runId));
    } catch (error) {
      setResult({ ok: false, text: (error as Error).message });
    }
  }, [runId]);

  useEffect(() => {
    let cancelled = false;
    fetchCaptures(createSupabaseBrowserClient(), runId)
      .then((rows) => !cancelled && setPhotos(rows))
      .catch(
        (error: Error) =>
          !cancelled && setResult({ ok: false, text: error.message }),
      );
    return () => {
      cancelled = true;
    };
  }, [runId]);

  async function toggle(photo: Capture) {
    const error = await setCaptureHidden(supabase, photo.id, !photo.hidden);
    if (error) setResult({ ok: false, text: error.message });
    else await load();
  }

  async function remove(photo: Capture) {
    if (
      !(await confirm(
        `Delete this ${photo.slot} photo and its files? This cannot be undone.`,
        "Delete photo",
      ))
    )
      return;
    const error = await deleteCapture(supabase, photo);
    if (error) setResult({ ok: false, text: error.message });
    else await load();
  }

  if (photos === null)
    return <p className="text-sage-dingin text-sm">Loading photos…</p>;
  if (photos.length === 0)
    return <p className="text-sage-dingin text-sm">No photos in this run.</p>;

  return (
    <div className="flex flex-col gap-2">
      {dialog}
      <StatusMessage result={result} />
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {photos.map((photo) => (
          <li
            key={photo.id}
            className="border-border bg-surface flex flex-col gap-2 border p-2"
          >
            <a
              href={capturePublicUrl(supabase, photo.storage_path)}
              target="_blank"
              rel="noreferrer"
              className="block aspect-video overflow-hidden bg-black/30"
            >
              <img
                src={capturePublicUrl(
                  supabase,
                  photo.thumb_path ?? photo.storage_path,
                )}
                alt={`${photo.slot} photo`}
                loading="lazy"
                className={`h-full w-full object-cover ${photo.hidden ? "opacity-30" : ""}`}
              />
            </a>
            <p className="text-xs">
              <span className="font-semibold">{photo.slot}</span>{" "}
              <span className="text-sage-dingin">
                {formatWibTime(photo.captured_at)}
              </span>
              {photo.hidden && (
                <span className="ml-1 text-amber-500">Hidden</span>
              )}
            </p>
            <div className="flex gap-1.5">
              <button
                type="button"
                onClick={() => toggle(photo)}
                className={`${buttonClass} flex-1`}
              >
                {photo.hidden ? "Unhide" : "Hide"}
              </button>
              <button
                type="button"
                onClick={() => remove(photo)}
                className={dangerButtonClass}
              >
                Delete
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
