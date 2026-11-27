// Hasil aksi admin: "Saved" atau pesan error dari Supabase.
export type ActionResult = { ok: boolean; text: string } | null;

export function StatusMessage({ result }: { result: ActionResult }) {
  if (!result) return null;
  return (
    <p
      role={result.ok ? "status" : "alert"}
      className={`text-sm ${result.ok ? "text-lime-neon" : "text-red-500"}`}
    >
      {result.text}
    </p>
  );
}
