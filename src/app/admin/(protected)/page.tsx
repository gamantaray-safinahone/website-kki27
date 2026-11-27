import { DisplaySettings } from "@/components/admin/DisplaySettings";
import { FollowedRun } from "@/components/admin/FollowedRun";
import { RecentRuns } from "@/components/admin/RecentRuns";
import { PanelBoundary } from "@/components/ui/PanelBoundary";
import { LiveProvider } from "@/lib/live/LiveProvider";

// /admin: kontrol run live. Data live lewat LiveProvider yang sama dengan
// dashboard, jadi halaman ini tidak membuka channel Realtime sendiri.
export default function AdminPage() {
  return (
    <LiveProvider>
      <main className="grid gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <div className="flex flex-col gap-6">
          <PanelBoundary name="Followed run">
            <FollowedRun />
          </PanelBoundary>
          <PanelBoundary name="Recent runs">
            <RecentRuns />
          </PanelBoundary>
        </div>
        <PanelBoundary name="Dashboard display">
          <DisplaySettings />
        </PanelBoundary>
      </main>
    </LiveProvider>
  );
}
