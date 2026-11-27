// Semua query Supabase ada di file ini. Komponen tidak memanggil Supabase langsung.
import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  Database,
  Tables,
  TablesInsert,
  TablesUpdate,
} from "@/types/database.types";

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
  // id terbesar diambil PALING DULU. Baris yang masuk setelahnya akan diambil lagi oleh catch-up; duplikatnya dibuang store berdasarkan waktu sampel (t).
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

// Foto per run jumlahnya kecil, jadi diambil ulang semua (sekaligus menangkap perubahan `hidden` dari admin).
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

// ── Admin ─────────────────────────────────────────────────────────────────
// Penulisan admin berjalan dengan sesi login; RLS yang menentukan boleh tidaknya.

// Apakah user yang login terdaftar di app_admins (null = belum login)
// (RLS hanya mengizinkan membaca baris milik sendiri).
export async function fetchAdminStatus(
  supabase: Supabase,
): Promise<{ isAdmin: boolean } | null> {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return null;
  const { data, error } = await supabase
    .from("app_admins")
    .select("user_id")
    .eq("user_id", auth.user.id)
    .maybeSingle();
  if (error) throw error;
  return { isAdmin: data !== null };
}

export async function signInAdmin(
  supabase: Supabase,
  email: string,
  password: string,
) {
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  return error;
}

export async function signOutAdmin(supabase: Supabase) {
  const { error } = await supabase.auth.signOut();
  return error;
}

// Run terbaru (untuk memilih run yang diikuti dashboard).
export async function fetchRecentRuns(supabase: Supabase, limit = 10) {
  const { data, error } = await supabase
    .from("runs")
    .select("*")
    .order("started_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data;
}

export async function updateAppState(
  supabase: Supabase,
  patch: TablesUpdate<"app_state">,
) {
  const { error } = await supabase
    .from("app_state")
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("id", true);
  return error;
}

export async function updateRun(
  supabase: Supabase,
  id: string,
  patch: Pick<TablesUpdate<"runs">, "label" | "notes">,
) {
  const { error } = await supabase.from("runs").update(patch).eq("id", id);
  return error;
}

// Cadangan bila NUC mati dan run tertinggal live (end_reason "manual").
export async function endRunManually(supabase: Supabase, id: string) {
  const { error } = await supabase
    .from("runs")
    .update({
      status: "aborted",
      ended_at: new Date().toISOString(),
      end_reason: "manual",
    })
    .eq("id", id)
    .eq("status", "live");
  return error;
}

// ── Admin: arsip run ──────────────────────────────────────────────────────

export const RUNS_PAGE_SIZE = 20;

export type RunWithPhotoCount = Run & { photoCount: number };

// Satu halaman daftar run (terbaru dulu) beserta jumlah fotonya.
export async function fetchRunsPage(
  supabase: Supabase,
  page: number,
): Promise<{ runs: RunWithPhotoCount[]; total: number }> {
  const from = page * RUNS_PAGE_SIZE;
  const { data, error, count } = await supabase
    .from("runs")
    .select("*, captures(count)", { count: "exact" })
    .order("started_at", { ascending: false })
    .range(from, from + RUNS_PAGE_SIZE - 1);
  if (error) throw error;
  const runs = data.map(({ captures, ...run }) => ({
    ...run,
    photoCount: captures[0]?.count ?? 0,
  }));
  return { runs, total: count ?? runs.length };
}

export async function setCaptureHidden(
  supabase: Supabase,
  id: number,
  hidden: boolean,
) {
  const { error } = await supabase
    .from("captures")
    .update({ hidden })
    .eq("id", id);
  return error;
}

// Semua file satu foto (asli, thumbnail, dan pasangan permukaannya).
function captureFiles(capture: Capture): string[] {
  return [
    capture.storage_path,
    capture.thumb_path,
    capture.surface_path,
    capture.surface_thumb_path,
  ].filter((path): path is string => Boolean(path));
}

// Hapus file foto dulu, baru barisnya (bila file gagal dihapus, baris tetap ada
// supaya bisa diulang).
export async function deleteCapture(supabase: Supabase, capture: Capture) {
  const { error: storageError } = await supabase.storage
    .from("captures")
    .remove(captureFiles(capture));
  if (storageError) return storageError;
  const { error } = await supabase
    .from("captures")
    .delete()
    .eq("id", capture.id);
  return error;
}

// Semua path file di runs/<runId>/ (folder slot dibaca satu per satu).
export async function listRunFiles(
  supabase: Supabase,
  runId: string,
): Promise<string[]> {
  const bucket = supabase.storage.from("captures");
  const paths: string[] = [];
  const pending = [`runs/${runId}`];
  while (pending.length > 0) {
    const folder = pending.pop() as string;
    for (let offset = 0; ; offset += 1000) {
      const { data, error } = await bucket.list(folder, {
        limit: 1000,
        offset,
      });
      if (error) throw error;
      for (const entry of data) {
        // Folder tidak punya id; file punya.
        if (entry.id === null) pending.push(`${folder}/${entry.name}`);
        else paths.push(`${folder}/${entry.name}`);
      }
      if (data.length < 1000) break;
    }
  }
  return paths;
}

// Hapus run beserta semua file Storage-nya. Baris run (telemetri, event, foto
// ikut lewat cascade) hanya dihapus bila semua file sudah terhapus.
export async function deleteRunWithFiles(
  supabase: Supabase,
  runId: string,
  paths: string[],
) {
  for (let i = 0; i < paths.length; i += 100) {
    const { error } = await supabase.storage
      .from("captures")
      .remove(paths.slice(i, i + 100));
    if (error) return error;
  }
  const { error } = await supabase
    .from("runs")
    .delete()
    .eq("id", runId)
    .neq("status", "live");
  return error;
}

// ── Admin: editor lintasan ────────────────────────────────────────────────

export async function updateCourse(
  supabase: Supabase,
  lintasan: string,
  patch: TablesUpdate<"courses">,
) {
  const { error } = await supabase
    .from("courses")
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("lintasan", lintasan);
  return error;
}

export async function insertCourseItem(
  supabase: Supabase,
  item: TablesInsert<"course_items">,
) {
  const { error } = await supabase.from("course_items").insert(item);
  return error;
}

export async function updateCourseItem(
  supabase: Supabase,
  id: number,
  patch: TablesUpdate<"course_items">,
) {
  const { error } = await supabase
    .from("course_items")
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq("id", id);
  return error;
}

export async function deleteCourseItem(supabase: Supabase, id: number) {
  const { error } = await supabase.from("course_items").delete().eq("id", id);
  return error;
}
