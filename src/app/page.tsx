import { Suspense } from "react";

import { DatabaseStatus } from "@/components/status/DatabaseStatus";

export default function HomePage() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 p-6">
      <header>
        <h1 className="text-2xl font-semibold">
          Safinah One · Live Monitoring
        </h1>
        <p className="text-sm text-neutral-500">
          KKI 2027 · ASV · Gamantaray UGM
        </p>
      </header>

      {/* Data dibaca saat request, jadi wajib di dalam Suspense (Cache Components). */}
      <Suspense
        fallback={
          <p className="text-sm text-neutral-500">Checking database…</p>
        }
      >
        <DatabaseStatus />
      </Suspense>

      <p className="text-sm text-neutral-500">
        The live dashboard is under construction.
      </p>
    </main>
  );
}
