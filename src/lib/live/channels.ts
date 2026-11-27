// Langganan Realtime. Hanya dipanggil dari LiveProvider: paling banyak dua channel per tab.
import type { RealtimeChannel } from "@supabase/supabase-js";

import type {
  AppState,
  Capture,
  Course,
  CourseItem,
  MissionEvent,
  Run,
  Supabase,
  Telemetry,
} from "@/lib/queries";

// Status dari supabase-js: SUBSCRIBED, TIMED_OUT, CLOSED, CHANNEL_ERROR.
export type ChannelStatusHandler = (status: string) => void;

// Nama channel dibuat unik per pemasangan supaya mount ulang (React Strict Mode, pindah halaman) tidak bentrok dengan channel lama yang sedang ditutup.
function uniqueName(prefix: string): string {
  return `${prefix}:${Math.random().toString(36).slice(2, 10)}`;
}

export function subscribeConfig(
  supabase: Supabase,
  handlers: {
    onAppState: (row: AppState) => void;
    onCourse: (row: Course) => void;
    onItem: (row: CourseItem) => void;
    onItemDeleted: (id: number) => void;
    onRun: (row: Run) => void;
  },
  onStatus: ChannelStatusHandler,
): RealtimeChannel {
  return supabase
    .channel(uniqueName("config"))
    .on<AppState>(
      "postgres_changes",
      { event: "UPDATE", schema: "public", table: "app_state" },
      (payload) => handlers.onAppState(payload.new),
    )
    .on<Course>(
      "postgres_changes",
      { event: "*", schema: "public", table: "courses" },
      (payload) => {
        if (payload.eventType !== "DELETE") handlers.onCourse(payload.new);
      },
    )
    .on<CourseItem>(
      "postgres_changes",
      { event: "*", schema: "public", table: "course_items" },
      (payload) => {
        if (payload.eventType === "DELETE") {
          if (payload.old.id != null) handlers.onItemDeleted(payload.old.id);
        } else {
          handlers.onItem(payload.new);
        }
      },
    )
    .on<Run>(
      "postgres_changes",
      { event: "*", schema: "public", table: "runs" },
      (payload) => {
        if (payload.eventType !== "DELETE") handlers.onRun(payload.new);
      },
    )
    .subscribe((status) => onStatus(status));
}

export function subscribeRun(
  supabase: Supabase,
  runId: string,
  handlers: {
    onTelemetry: (row: Telemetry) => void;
    onEvent: (row: MissionEvent) => void;
    onCapture: (row: Capture) => void;
  },
  onStatus: ChannelStatusHandler,
): RealtimeChannel {
  const filter = `run_id=eq.${runId}`;
  return supabase
    .channel(uniqueName(`run:${runId}`))
    .on<Telemetry>(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "telemetry", filter },
      (payload) => handlers.onTelemetry(payload.new),
    )
    .on<MissionEvent>(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "mission_events", filter },
      (payload) => handlers.onEvent(payload.new),
    )
    .on<Capture>(
      "postgres_changes",
      { event: "*", schema: "public", table: "captures", filter },
      (payload) => {
        if (payload.eventType !== "DELETE") handlers.onCapture(payload.new);
      },
    )
    .subscribe((status) => onStatus(status));
}
