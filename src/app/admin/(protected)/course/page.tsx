import { CourseEditor } from "@/components/admin/CourseEditor";
import { PanelBoundary } from "@/components/ui/PanelBoundary";
import { LiveProvider } from "@/lib/live/LiveProvider";

// /admin/course: editor lintasan A/B. LiveProvider memberi data lintasan dan
// posisi kapal terakhir (untuk "Use boat position").
export default function AdminCoursePage() {
  return (
    <LiveProvider>
      <main>
        <PanelBoundary name="Course editor">
          <CourseEditor />
        </PanelBoundary>
      </main>
    </LiveProvider>
  );
}
