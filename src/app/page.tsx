import { LatestCaptures } from "@/components/captures/LatestCaptures";
import { MissionMap } from "@/components/map/MissionMap";
import { PhaseList } from "@/components/mission/PhaseList";
import { TelemetryPanel } from "@/components/telemetry/TelemetryPanel";
import { DashboardFooter } from "@/components/ui/DashboardFooter";
import { DashboardHeader } from "@/components/ui/DashboardHeader";
import { PanelBoundary } from "@/components/ui/PanelBoundary";
import { LiveProvider } from "@/lib/live/LiveProvider";

export default function HomePage() {
  return (
    <LiveProvider>
      <div className="flex min-h-dvh w-full flex-col overflow-x-hidden xl:h-dvh xl:overflow-hidden">
        <div className="tall:pt-4 tall:pb-3 mx-auto flex w-full max-w-[1920px] flex-1 flex-col px-4 pt-3 pb-2 sm:px-6 xl:min-h-0">
          <DashboardHeader />

          <main className="tall:gap-5 tall:pt-5 flex flex-1 flex-col gap-4 pt-3 xl:min-h-0 xl:flex-row">
            <div className="tall:gap-5 order-2 flex flex-col gap-4 xl:order-1 xl:min-h-0 xl:w-[340px] xl:shrink-0">
              <PanelBoundary name="Navigation Data">
                <TelemetryPanel />
              </PanelBoundary>
              <PanelBoundary name="Mission Log">
                <PhaseList />
              </PanelBoundary>
            </div>

            <div className="order-1 flex min-h-[60vh] flex-col xl:order-2 xl:min-h-0 xl:min-w-0 xl:flex-1">
              <PanelBoundary name="Real-Time Map">
                <MissionMap />
              </PanelBoundary>
            </div>

            <div className="order-3 flex flex-col xl:order-3 xl:min-h-0 xl:w-[380px] xl:shrink-0">
              <PanelBoundary name="Camera Feeds">
                <LatestCaptures />
              </PanelBoundary>
            </div>
          </main>

          <DashboardFooter />
        </div>
      </div>
    </LiveProvider>
  );
}
