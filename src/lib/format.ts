// Format angka untuk tampilan. Semua teks UI berbahasa Inggris.

const KNOTS_PER_MS = 1.943844;

export function formatNumber(
  value: number | null | undefined,
  digits = 1,
): string {
  return value == null || Number.isNaN(value) ? "—" : value.toFixed(digits);
}

export function formatKnots(speedMs: number | null | undefined): string {
  return speedMs == null ? "—" : (speedMs * KNOTS_PER_MS).toFixed(1);
}

export function formatDeg(deg: number | null | undefined): string {
  return deg == null ? "—" : `${Math.round(deg) % 360}°`;
}

export function formatCoord(value: number | null | undefined): string {
  return value == null ? "—" : value.toFixed(6);
}

// "3 s ago", "2 min ago", "1 h ago"
export function formatAge(ms: number): string {
  const s = Math.max(0, Math.round(ms / 1000));
  if (s < 60) return `${s} s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m} min ago`;
  return `${Math.floor(m / 60)} h ago`;
}

// 754 detik -> "12:34"
export function formatDuration(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function formatClock(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleTimeString("en-GB", { hour12: false });
}
