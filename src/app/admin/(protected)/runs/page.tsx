import { RunArchive } from "@/components/admin/RunArchive";
import { PanelBoundary } from "@/components/ui/PanelBoundary";

// /admin/runs: arsip run, sembunyikan/hapus foto, hapus run beserta file.
export default function AdminRunsPage() {
  return (
    <main>
      <PanelBoundary name="Runs">
        <RunArchive />
      </PanelBoundary>
    </main>
  );
}
