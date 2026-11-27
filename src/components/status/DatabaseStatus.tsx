import { createSupabaseServerClient } from "@/lib/supabase/server";

// Pemeriksaan Tahap 0: membuktikan migrasi terpasang dan publik bisa membaca.
// Komponen ini diganti dashboard live di Tahap 1.
export async function DatabaseStatus() {
  const supabase = await createSupabaseServerClient();

  const [state, runs] = await Promise.all([
    supabase.from("app_state").select("active_lintasan, live_run_id").single(),
    supabase.from("runs").select("id", { count: "exact", head: true }),
  ]);

  if (state.error || runs.error) {
    return (
      <p className="rounded-md border border-red-500/40 p-3 text-sm text-red-600">
        Database error: {(state.error ?? runs.error)?.message}
      </p>
    );
  }

  return (
    <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-1 rounded-md border border-neutral-500/30 p-4 text-sm">
      <dt className="text-neutral-500">Database</dt>
      <dd className="font-medium text-green-600">Connected</dd>
      <dt className="text-neutral-500">Active course</dt>
      <dd>{state.data.active_lintasan ?? "Not set"}</dd>
      <dt className="text-neutral-500">Runs recorded</dt>
      <dd>{runs.count ?? 0}</dd>
    </dl>
  );
}
