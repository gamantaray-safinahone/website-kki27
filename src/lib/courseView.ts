// Lintasan yang sedang DILIHAT di dashboard (peta dan Camera Feeds memakai nilai
// yang sama). Ini state tampilan lokal per tab, bukan data live: tidak ditulis ke
// database dan tidak memengaruhi penonton lain.
import { create } from "zustand";

import { useLive } from "@/lib/live/store";

type Choice = { key: string; lintasan: string };

const useChoice = create<{
  choice: Choice | null;
  setChoice: (choice: Choice) => void;
}>()((set) => ({
  choice: null,
  setChoice: (choice) => set({ choice }),
}));

// Default: lintasan run yang diikuti, lalu lintasan aktif di app_state, lalu A.
// Pilihan manual kembali ke default saat run atau default-nya berganti.
export function useViewLintasan(): [string, (lintasan: string) => void] {
  const runId = useLive((s) => s.run?.id ?? null);
  const runLintasan = useLive((s) => s.run?.lintasan ?? null);
  const activeLintasan = useLive((s) => s.appState?.active_lintasan ?? null);
  const choice = useChoice((s) => s.choice);
  const setChoice = useChoice((s) => s.setChoice);

  const fallback = runLintasan ?? activeLintasan ?? "A";
  const key = `${runId ?? "none"}:${fallback}`;
  const lintasan = choice && choice.key === key ? choice.lintasan : fallback;
  return [lintasan, (value) => setChoice({ key, lintasan: value })];
}
