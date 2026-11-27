// Catch-up: ambil data yang terlewat saat Realtime terputus atau tab tertidur.
import {
  fetchCaptures,
  fetchEventsAfter,
  fetchTelemetryAfter,
  type Supabase,
} from "@/lib/queries";

import { useLive } from "./store";

export async function catchUp(
  supabase: Supabase,
  runId: string,
): Promise<void> {
  const s = useLive.getState();
  if (s.run?.id !== runId) return;
  const lastEventId = s.events.reduce((max, e) => Math.max(max, e.id), 0);

  const [telemetry, events, captures] = await Promise.all([
    fetchTelemetryAfter(supabase, runId, s.telemetryMaxId),
    fetchEventsAfter(supabase, runId, lastEventId),
    fetchCaptures(supabase, runId),
  ]);

  // Run bisa sudah berganti selama request berjalan.
  if (useLive.getState().run?.id !== runId) return;
  const store = useLive.getState();
  store.addTelemetry(telemetry);
  store.addEvents(events);
  store.setCaptures(captures);
}
