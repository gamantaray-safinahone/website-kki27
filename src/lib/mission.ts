// Daftar fase misi, status, dan slot kamera. Semua label UI ada di sini
// (Bahasa Inggris), supaya komponen tidak menulis teks sendiri-sendiri.

export const PHASES = [
  "preparation",
  "start",
  "floating_ball_set",
  "surface_imaging",
  "underwater_imaging",
  "docking",
  "finish",
] as const;
export type Phase = (typeof PHASES)[number];

export const PHASE_LABELS: Record<Phase, string> = {
  preparation: "Preparation",
  start: "Start",
  floating_ball_set: "Floating Ball Set",
  surface_imaging: "Surface Imaging",
  underwater_imaging: "Underwater Imaging",
  docking: "Docking",
  finish: "Finish",
};

export const PHASE_STATUSES = ["pending", "active", "done"] as const;
export type PhaseStatus = (typeof PHASE_STATUSES)[number];

export const STATUS_LABELS: Record<PhaseStatus, string> = {
  pending: "Pending",
  active: "Active",
  done: "Done",
};

export const SLOTS = ["SL", "SR", "UL", "UR"] as const;
export type Slot = (typeof SLOTS)[number];

export const SLOT_LABELS: Record<Slot, string> = {
  SL: "Surface Left",
  SR: "Surface Right",
  UL: "Underwater Left",
  UR: "Underwater Right",
};

export function isPhase(value: string): value is Phase {
  return (PHASES as readonly string[]).includes(value);
}

export function isPhaseStatus(value: string): value is PhaseStatus {
  return (PHASE_STATUSES as readonly string[]).includes(value);
}

export function isSlot(value: string): value is Slot {
  return (SLOTS as readonly string[]).includes(value);
}

// Urutan tampilan mengikuti app_state.phase_order; fase yang tidak tercantum
// ditaruh di belakang supaya tetap terlihat.
export function orderPhases(
  phaseOrder: readonly string[] | undefined,
): Phase[] {
  const ordered = (phaseOrder ?? []).filter(isPhase);
  return [...ordered, ...PHASES.filter((p) => !ordered.includes(p))];
}

// Status terakhir tiap fase dari daftar event (event sudah urut berdasarkan t).
export type PhaseState = { status: PhaseStatus; detail: unknown; t: string };

export function latestPhaseStates(
  events: readonly {
    phase: string;
    status: string;
    detail: unknown;
    t: string;
  }[],
): Partial<Record<Phase, PhaseState>> {
  const result: Partial<Record<Phase, PhaseState>> = {};
  for (const e of events) {
    if (isPhase(e.phase) && isPhaseStatus(e.status)) {
      result[e.phase] = { status: e.status, detail: e.detail, t: e.t };
    }
  }
  return result;
}

// Teks detail singkat, misalnya "Gate 4 / 10".
export function describeDetail(phase: Phase, detail: unknown): string | null {
  if (!detail || typeof detail !== "object") return null;
  const d = detail as Record<string, unknown>;
  if (phase === "floating_ball_set" && typeof d.gate === "number") {
    return typeof d.total === "number"
      ? `Gate ${d.gate} / ${d.total}`
      : `Gate ${d.gate}`;
  }
  if (typeof d.slot === "string") return `Slot ${d.slot}`;
  return null;
}
