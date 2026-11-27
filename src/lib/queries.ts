// Semua query Supabase ada di file ini. Komponen tidak memanggil Supabase langsung.
import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database, Tables } from "@/types/database.types";

export type Supabase = SupabaseClient<Database>;
export type AppState = Tables<"app_state">;
export type Course = Tables<"courses">;
export type CourseItem = Tables<"course_items">;
export type Run = Tables<"runs">;
export type Telemetry = Tables<"telemetry">;
export type MissionEvent = Tables<"mission_events">;
export type Capture = Tables<"captures">;

// Hasil RPC get_run_series: satu array per kolom, t dalam milidetik epoch.
export type RunSeries = {
  t: number[];
  lat: (number | null)[];
  lon: (number | null)[];
  sog: (number | null)[];
  cog: (number | null)[];
  hdg: (number | null)[];
};

export type ConfigSnapshot = {
  appState: AppState;
  courses: Course[];
  items: CourseItem[];
};

export type RunSnapshot = {
  run: Run;
  series: RunSeries;
  latest: Telemetry | null;
  telemetryMaxId: number;
  events: MissionEvent[];
  captures: Capture[];
};

const PAGE_SIZE = 1000; // batas baris per request Data API

export async function fetchConfig(supabase: Supabase): Promise<ConfigSnapshot> {
  const [state, courses, items] = await Promise.all([
    supabase.from("app_state").select("*").single(),
    supabase.from("courses").select("*").order("lintasan"),
    supabase.from("course_items").select("*").order("kind").order("seq"),
  ]);
  if (state.error) throw state.error;
  if (courses.error) throw courses.error;
  if (items.error) throw items.error;
  return { appState: state.data, courses: courses.data, items: items.data };
}

export async function fetchRunSnapshot(
  supabase: Supabase,
  runId: string,
): Promise<RunSnapshot> {
  // id terbesar diambil PALING DULU. Baris yang masuk setelahnya akan diambil lagi
  // oleh catch-up; duplikatnya dibuang store berdasarkan waktu sampel (t).
  const maxId = await supabase
    .from("telemetry")
    .select("id")
    .eq("run_id", runId)
    .order("id", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (maxId.error) throw maxId.error;

  const [run, series, latest, events, captures] = await Promise.all([
    supabase.from("runs").select("*").eq("id", runId).single(),
    supabase.rpc("get_run_series", { p_run_id: runId }),
    supabase
      .from("telemetry")
      .select("*")
      .eq("run_id", runId)
      .order("t", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase.from("mission_events").select("*").eq("run_id", runId).order("t"),
    supabase
      .from("captures")
      .select("*")
      .eq("run_id", runId)
      .order("captured_at"),
  ]);
  if (run.error) throw run.error;
  if (series.error) throw series.error;
  if (latest.error) throw latest.error;
  if (events.error) throw events.error;
  if (captures.error) throw captures.error;

  return {
    run: run.data,
    series: series.data as unknown as RunSeries,
    latest: latest.data,
    telemetryMaxId: maxId.data?.id ?? 0,
    events: events.data,
    captures: captures.data,
  };
}

// Telemetri yang masuk setelah id tertentu, diambil per halaman 1000 baris.
export async function fetchTelemetryAfter(
  supabase: Supabase,
  runId: string,
  afterId: number,
): Promise<Telemetry[]> {
  const rows: Telemetry[] = [];
  let cursor = afterId;
  for (;;) {
    const { data, error } = await supabase
      .from("telemetry")
      .select("*")
      .eq("run_id", runId)
      .gt("id", cursor)
      .order("id")
      .limit(PAGE_SIZE);
    if (error) throw error;
    rows.push(...data);
    if (data.length < PAGE_SIZE) return rows;
    cursor = data[data.length - 1].id;
  }
}

export async function fetchEventsAfter(
  supabase: Supabase,
  runId: string,
  afterId: number,
): Promise<MissionEvent[]> {
  const { data, error } = await supabase
    .from("mission_events")
    .select("*")
    .eq("run_id", runId)
    .gt("id", afterId)
    .order("id");
  if (error) throw error;
  return data;
}

// Foto per run jumlahnya kecil, jadi diambil ulang semua (sekaligus menangkap
// perubahan `hidden` dari admin).
export async function fetchCaptures(
  supabase: Supabase,
  runId: string,
): Promise<Capture[]> {
  const { data, error } = await supabase
    .from("captures")
    .select("*")
    .eq("run_id", runId)
    .order("captured_at");
  if (error) throw error;
  return data;
}

export function capturePublicUrl(supabase: Supabase, path: string): string {
  return supabase.storage.from("captures").getPublicUrl(path).data.publicUrl;
}
