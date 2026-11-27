"use client";

import { useLive } from "@/lib/live/store";

import { DisplayForm } from "./DisplayForm";
import { sectionClass } from "./styles";

// Lintasan default di peta dan urutan tampilan 7 fase misi.
export function DisplaySettings() {
  const appState = useLive((s) => s.appState);
  if (!appState) {
    return (
      <section className={sectionClass}>
        <p className="text-sage-dingin text-sm">Loading…</p>
      </section>
    );
  }
  // key: form diisi ulang bila app_state berubah dari tempat lain
  return <DisplayForm key={appState.updated_at} appState={appState} />;
}
