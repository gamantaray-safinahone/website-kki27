"use client";

import { useCallback, useEffect, useState } from "react";

import { formatDuration, formatWibDate, formatWibTime } from "@/lib/format";
import {
  RUNS_PAGE_SIZE,
  deleteRunWithFiles,
  fetchRunsPage,
  listRunFiles,
  type RunWithPhotoCount,
} from "@/lib/queries";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

import { RunPhotos } from "./RunPhotos";
import { useConfirm } from "./useConfirm";
import { StatusMessage, type ActionResult } from "./StatusMessage";
import { buttonClass, dangerButtonClass, sectionClass } from "./styles";

// Arsip run: daftar per halaman, buka foto satu run, hapus run beserta file.
export function RunArchive() {
  const [page, setPage] = useState(0);
  const [data, setData] = useState<{
    runs: RunWithPhotoCount[];
    total: number;
  } | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [result, setResult] = useState<ActionResult>(null);
  const { confirm, dialog } = useConfirm();

  const load = useCallback(async (target: number) => {
    try {
      setData(await fetchRunsPage(createSupabaseBrowserClient(), target));
    } catch (error) {
      setResult({ ok: false, text: (error as Error).message });
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetchRunsPage(createSupabaseBrowserClient(), page)
      .then((rows) => !cancelled && setData(rows))
      .catch(
        (error: Error) =>
          !cancelled && setResult({ ok: false, text: error.message }),
      );
    return () => {
      cancelled = true;
    };
  }, [page]);

  async function remove(run: RunWithPhotoCount) {
    const supabase = createSupabaseBrowserClient();
    setBusyId(run.id);
    setResult(null);
    try {
      const paths = await listRunFiles(supabase, run.id);
      const name = run.label ?? run.id.slice(0, 8);
      if (
        !(await confirm(
          `Delete run "${name}" with its telemetry, events, ${run.photoCount} photo rows and ${paths.length} files? This cannot be undone.`,
          "Delete run",
        ))
      )
        return;
      const error = await deleteRunWithFiles(supabase, run.id, paths);
      if (error) {
        setResult({ ok: false, text: error.message });
        return;
      }
      setResult({ ok: true, text: `Run "${name}" deleted.` });
      if (openId === run.id) setOpenId(null);
      await load(page);
    } catch (error) {
      setResult({ ok: false, text: (error as Error).message });
    } finally {
      setBusyId(null);
    }
  }

  const pages = data ? Math.max(1, Math.ceil(data.total / RUNS_PAGE_SIZE)) : 1;

  return (
    <section className={sectionClass}>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h1 className="text-kapur-muda font-semibold">Runs</h1>
        {data && (
          <span className="text-sage-dingin text-sm">{data.total} runs</span>
        )}
      </div>
      <StatusMessage result={result} />

      {data === null ? (
        <p className="text-sage-dingin text-sm">Loading…</p>
      ) : data.runs.length === 0 ? (
        <p className="text-sage-dingin text-sm">No runs yet.</p>
      ) : (
        <ul className="divide-border divide-y text-sm">
          {data.runs.map((run) => {
            const end = run.ended_at ? Date.parse(run.ended_at) : null;
            const duration =
              end !== null
                ? formatDuration(end - Date.parse(run.started_at))
                : "-";
            return (
              <li key={run.id} className="flex flex-col gap-3 py-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-kapur-muda truncate">
                      {run.label ?? run.id.slice(0, 8)}
                    </p>
                    <p className="text-sage-dingin text-xs">
                      {formatWibDate(Date.parse(run.started_at))}{" "}
                      {formatWibTime(run.started_at)} WIB · Course{" "}
                      {run.lintasan ?? "-"} · {run.source} · {run.status}
                      {run.end_reason ? ` (${run.end_reason})` : ""} ·{" "}
                      {duration} · {run.photoCount} photos
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setOpenId(openId === run.id ? null : run.id)
                      }
                      className={buttonClass}
                    >
                      {openId === run.id ? "Close photos" : "Photos"}
                    </button>
                    <button
                      type="button"
                      onClick={() => remove(run)}
                      disabled={run.status === "live" || busyId !== null}
                      title={
                        run.status === "live"
                          ? "End the run first (Live run page)"
                          : undefined
                      }
                      className={dangerButtonClass}
                    >
                      {busyId === run.id ? "Deleting…" : "Delete"}
                    </button>
                  </div>
                </div>
                {openId === run.id && <RunPhotos runId={run.id} />}
              </li>
            );
          })}
        </ul>
      )}

      {pages > 1 && (
        <div className="flex items-center justify-end gap-3 text-sm">
          <button
            type="button"
            disabled={page === 0}
            onClick={() => setPage(page - 1)}
            className={buttonClass}
          >
            Previous
          </button>
          <span className="text-sage-dingin">
            Page {page + 1} / {pages}
          </span>
          <button
            type="button"
            disabled={page + 1 >= pages}
            onClick={() => setPage(page + 1)}
            className={buttonClass}
          >
            Next
          </button>
        </div>
      )}
      {dialog}
    </section>
  );
}
