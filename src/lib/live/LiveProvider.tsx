"use client";

// Satu-satunya tempat yang membuka koneksi Realtime dan mengisi store.
// Alur: muat konfigurasi -> ikuti app_state.live_run_id -> muat snapshot run -> langganan perubahan -> catch-up setiap tersambung ulang atau tab aktif lagi.
import { useEffect, useRef, type ReactNode } from "react";

import { fetchConfig, fetchRunSnapshot } from "@/lib/queries";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

import { catchUp } from "./catchup";
import { subscribeConfig, subscribeRun } from "./channels";
import { useLive, type RealtimeStatus } from "./store";

const POLL_AFTER_MS = 10_000; 
const POLL_EVERY_MS = 3_000;

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export function LiveProvider({ children }: { children: ReactNode }) {
  const liveRunId = useLive((s) => s.appState?.live_run_id ?? null);
  // Status terakhir channel config. Dipakai sebagai status Feed saat tidak ada
  // run yang diikuti, supaya badge tidak tertahan di "Connecting…".
  const configFeed = useRef<RealtimeStatus>("connecting");

  // 1. Konfigurasi global: app_state, lintasan, objek lintasan, perubahan run.
  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    const store = useLive.getState;
    let firstSubscribe = true;

    const loadConfig = () =>
      fetchConfig(supabase)
        .then((config) => {
          store().setConfig(config);
          store().setError(null);
        })
        .catch((error: unknown) => store().setError(errorMessage(error)));

    void loadConfig();
    const channel = subscribeConfig(
      supabase,
      {
        onAppState: (row) => store().applyAppState(row),
        onCourse: (row) => store().applyCourse(row),
        onItem: (row) => store().applyItem(row),
        onItemDeleted: (id) => store().removeItem(id),
        onRun: (row) => store().applyRun(row),
      },
      (status) => {
        configFeed.current =
          status === "SUBSCRIBED" ? "connected" : "reconnecting";
        if (!store().appState?.live_run_id)
          store().setRealtime(configFeed.current);

        // Setelah tersambung ulang, muat ulang konfigurasi yang mungkin terlewat.
        if (status !== "SUBSCRIBED") return;
        if (!firstSubscribe) void loadConfig();
        firstSubscribe = false;
      },
    );

    return () => {
      void supabase.removeChannel(channel);
    };
  }, []);

  // 2. Run yang sedang diikuti dashboard.
  useEffect(() => {
    const store = useLive.getState;
    if (!liveRunId) {
      store().loadRun(null);
      store().setRealtime(configFeed.current);
      return;
    }

    const supabase = createSupabaseBrowserClient();
    const runId = liveRunId;
    let stopped = false;
    let offlineSince: number | null = Date.now();
    let catchUpRunning = false;
    let channel: ReturnType<typeof subscribeRun> | null = null;

    const runCatchUp = async () => {
      if (stopped || catchUpRunning || store().run?.id !== runId) return;
      catchUpRunning = true;
      try {
        await catchUp(supabase, runId);
      } catch (error) {
        store().setError(errorMessage(error));
      } finally {
        catchUpRunning = false;
      }
    };

    store().startRunLoading();
    store().setRealtime("connecting");
    fetchRunSnapshot(supabase, runId)
      .then((snapshot) => {
        if (stopped) return;
        store().loadRun(snapshot);
        channel = subscribeRun(
          supabase,
          runId,
          {
            onTelemetry: (row) => store().addTelemetry([row]),
            onEvent: (row) => store().addEvents([row]),
            onCapture: (row) => store().upsertCapture(row),
          },
          (status) => {
            if (stopped) return;
            if (status === "SUBSCRIBED") {
              offlineSince = null;
              store().setRealtime("connected");
              void runCatchUp();
            } else {
              offlineSince ??= Date.now();
              if (store().realtime !== "polling")
                store().setRealtime("reconnecting");
            }
          },
        );
      })
      .catch((error: unknown) => {
        if (!stopped) store().setError(errorMessage(error));
      });

    // Cadangan bila Realtime lama terputus (misalnya WebSocket diblokir jaringan).
    const watchdog = setInterval(() => {
      if (offlineSince != null && Date.now() - offlineSince > POLL_AFTER_MS) {
        store().setRealtime("polling");
        void runCatchUp();
      }
    }, POLL_EVERY_MS);

    // HP sering menidurkan tab di latar belakang; kejar ketinggalan saat aktif lagi.
    const onVisible = () => {
      if (document.visibilityState === "visible") void runCatchUp();
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      stopped = true;
      clearInterval(watchdog);
      document.removeEventListener("visibilitychange", onVisible);
      if (channel) void supabase.removeChannel(channel);
    };
  }, [liveRunId]);

  return children;
}
