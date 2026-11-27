import { LatestCaptures } from "@/components/captures/LatestCaptures";
import { MissionMap } from "@/components/map/MissionMap";
import { PhaseList } from "@/components/mission/PhaseList";
import { ConnectionBadge } from "@/components/status/ConnectionBadge";
import { RunInfo } from "@/components/status/RunInfo";
import { TelemetryPanel } from "@/components/telemetry/TelemetryPanel";
import { PanelBoundary } from "@/components/ui/PanelBoundary";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { LiveProvider } from "@/lib/live/LiveProvider";

// Dashboard live: dibuka publik dan sekaligus ditampilkan di layar panitia.
// HP: satu kolom. Laptop / TV: peta di kiri, panel di kanan.
export default function HomePage() {
  return (
    <LiveProvider>
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-neutral-500/20 px-4 py-3">
        <div>
          <h1 className="text-xl font-semibold xl:text-2xl">
            Safinah One · Live Monitoring
          </h1>
          <RunInfo />
        </div>
        <div className="flex items-center gap-3">
          <ConnectionBadge />
          <ThemeToggle />
        </div>
      </header>

      <main className="grid flex-1 gap-4 p-4 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <section className="h-[55vh] lg:sticky lg:top-4 lg:h-[calc(100dvh-7rem)] lg:min-h-[480px]">
          <PanelBoundary name="Map">
            <MissionMap />
          </PanelBoundary>
        </section>
        <section className="flex flex-col gap-4">
          <PanelBoundary name="Telemetry">
            <TelemetryPanel />
          </PanelBoundary>
          <PanelBoundary name="Mission">
            <PhaseList />
          </PanelBoundary>
          <PanelBoundary name="Imaging">
            <LatestCaptures />
          </PanelBoundary>
        </section>
      </main>
    </LiveProvider>
  );
}
