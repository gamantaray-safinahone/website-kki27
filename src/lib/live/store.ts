// Store data live (Zustand). SATU-SATUNYA sumber data dashboard.
// Komponen React membaca lewat selector: useLive((s) => s.latest).
// Layer peta membaca lewat useLive.subscribe supaya tidak render ulang tiap detik.
import { create } from "zustand";

import type {
  AppState,
  Capture,
  ConfigSnapshot,
  Course,
  CourseItem,
  MissionEvent,
  Run,
  RunSnapshot,
  Telemetry,
} from "@/lib/queries";

export type TrailPoint = { t: number; lat: number; lon: number };
export type RealtimeStatus =
  "connecting" | "connected" | "reconnecting" | "polling";

type LiveState = {
  configLoaded: boolean;
  appState: AppState | null;
  courses: Record<string, Course>;
  items: Record<number, CourseItem>;

  run: Run | null;
  runLoading: boolean;
  trail: TrailPoint[]; // urut berdasarkan t
  trailRevision: number; // naik bila jejak harus digambar ulang penuh
  latest: Telemetry | null; // sampel dengan t terbesar
  lastArrivalMs: number | null; // kapan sampel terbaru tiba (jam browser)
  telemetryMaxId: number;
  events: MissionEvent[]; // urut berdasarkan t lalu id
  captures: Record<number, Capture>;

  realtime: RealtimeStatus;
  error: string | null;
};

type LiveActions = {
  setConfig: (config: ConfigSnapshot) => void;
  applyAppState: (row: AppState) => void;
  applyCourse: (row: Course) => void;
  applyItem: (row: CourseItem) => void;
  removeItem: (id: number) => void;
  applyRun: (row: Run) => void;
  startRunLoading: () => void;
  loadRun: (snapshot: RunSnapshot | null) => void;
  addTelemetry: (rows: Telemetry[]) => void;
  addEvents: (rows: MissionEvent[]) => void;
  setCaptures: (rows: Capture[]) => void;
  upsertCapture: (row: Capture) => void;
  setRealtime: (status: RealtimeStatus) => void;
  setError: (message: string | null) => void;
};

// Waktu sampel yang sudah diterima, untuk membuang duplikat (t unik per run).
let seenT = new Set<number>();

const emptyRun = {
  run: null,
  trail: [] as TrailPoint[],
  latest: null,
  lastArrivalMs: null,
  telemetryMaxId: 0,
  events: [] as MissionEvent[],
  captures: {} as Record<number, Capture>,
};

function sortEvents(events: MissionEvent[]): MissionEvent[] {
  return events.sort(
    (a, b) => Date.parse(a.t) - Date.parse(b.t) || a.id - b.id,
  );
}

export const useLive = create<LiveState & LiveActions>()((set, get) => ({
  configLoaded: false,
  appState: null,
  courses: {},
  items: {},
  runLoading: false,
  trailRevision: 0,
  realtime: "connecting",
  error: null,
  ...emptyRun,

  setConfig: ({ appState, courses, items }) =>
    set({
      configLoaded: true,
      appState,
      courses: Object.fromEntries(courses.map((c) => [c.lintasan, c])),
      items: Object.fromEntries(items.map((i) => [i.id, i])),
    }),

  applyAppState: (row) => set({ appState: row }),

  applyCourse: (row) =>
    set((s) => ({ courses: { ...s.courses, [row.lintasan]: row } })),

  applyItem: (row) => set((s) => ({ items: { ...s.items, [row.id]: row } })),

  removeItem: (id) =>
    set((s) => {
      const items = { ...s.items };
      delete items[id];
      return { items };
    }),

  applyRun: (row) => {
    if (get().run?.id === row.id) set({ run: row });
  },

  startRunLoading: () => set({ runLoading: true }),

  loadRun: (snapshot) => {
    seenT = new Set();
    if (!snapshot) {
      set((s) => ({
        ...emptyRun,
        runLoading: false,
        trailRevision: s.trailRevision + 1,
      }));
      return;
    }
    const { series } = snapshot;
    const trail: TrailPoint[] = [];
    series.t.forEach((t, i) => {
      seenT.add(t);
      const lat = series.lat[i];
      const lon = series.lon[i];
      if (lat != null && lon != null) trail.push({ t, lat, lon });
    });
    const latest = snapshot.latest;
    if (latest) seenT.add(Date.parse(latest.t));
    set((s) => ({
      run: snapshot.run,
      runLoading: false,
      trail,
      trailRevision: s.trailRevision + 1,
      latest,
      // Sebelum ada data live, umur data dihitung dari jam server (received_at).
      lastArrivalMs: latest ? Date.parse(latest.received_at) : null,
      telemetryMaxId: snapshot.telemetryMaxId,
      events: sortEvents([...snapshot.events]),
      captures: Object.fromEntries(snapshot.captures.map((c) => [c.id, c])),
    }));
  },

  addTelemetry: (rows) => {
    const s = get();
    if (!s.run || rows.length === 0) return;
    let trail = s.trail;
    let latest = s.latest;
    let maxId = s.telemetryMaxId;
    let outOfOrder = false;
    let added = false;

    for (const row of rows) {
      if (row.run_id !== s.run.id) continue;
      maxId = Math.max(maxId, row.id);
      const t = Date.parse(row.t);
      if (seenT.has(t)) continue;
      seenT.add(t);
      added = true;
      if (!latest || t > Date.parse(latest.t)) latest = row;
      if (row.lat == null || row.lon == null) continue;
      const point = { t, lat: row.lat, lon: row.lon };
      if (trail === s.trail) trail = [...s.trail];
      const last = trail[trail.length - 1];
      if (!last || t >= last.t) {
        trail.push(point);
      } else {
        // Backlog kapal tiba terlambat: sisipkan di posisinya, gambar ulang jejak.
        const index = trail.findIndex((p) => p.t > t);
        trail.splice(index, 0, point);
        outOfOrder = true;
      }
    }

    set({
      trail,
      latest,
      telemetryMaxId: maxId,
      trailRevision: outOfOrder ? s.trailRevision + 1 : s.trailRevision,
      lastArrivalMs: added ? Date.now() : s.lastArrivalMs,
    });
  },

  addEvents: (rows) => {
    const s = get();
    if (!s.run) return;
    const known = new Set(s.events.map((e) => e.id));
    const fresh = rows.filter(
      (r) => r.run_id === s.run?.id && !known.has(r.id),
    );
    if (fresh.length > 0) set({ events: sortEvents([...s.events, ...fresh]) });
  },

  setCaptures: (rows) =>
    set({ captures: Object.fromEntries(rows.map((c) => [c.id, c])) }),

  upsertCapture: (row) => {
    if (get().run?.id !== row.run_id) return;
    set((s) => ({ captures: { ...s.captures, [row.id]: row } }));
  },

  setRealtime: (status) => set({ realtime: status }),

  setError: (message) => set({ error: message }),
}));

// ---- Selector turunan (dipakai komponen) ----

// Lintasan yang ditampilkan: lintasan run yang diikuti, atau lintasan aktif.
export function selectCourse(s: LiveState): Course | null {
  const key = s.run?.lintasan ?? s.appState?.active_lintasan ?? null;
  return key ? (s.courses[key] ?? null) : null;
}
