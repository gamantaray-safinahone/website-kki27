// Format angka dan waktu untuk tampilan. Semua teks UI berbahasa Inggris.

// Jam lomba selalu WIB, apa pun zona waktu perangkat penonton.
const WIB_TIME_ZONE = "Asia/Jakarta";

const wibTime = new Intl.DateTimeFormat("en-GB", {
  timeZone: WIB_TIME_ZONE,
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hourCycle: "h23",
});

const wibDate = new Intl.DateTimeFormat("en-GB", {
  timeZone: WIB_TIME_ZONE,
  day: "numeric",
  month: "long",
  year: "numeric",
});

export function formatNumber(
  value: number | null | undefined,
  digits = 1,
): string {
  return value == null || Number.isNaN(value) ? "—" : value.toFixed(digits);
}

// Sudut bulat tiga digit: 45.4 -> "045°"
export function formatDeg(deg: number | null | undefined): string {
  if (deg == null || Number.isNaN(deg)) return "—";
  return `${String(Math.round(deg) % 360).padStart(3, "0")}°`;
}

// Koordinat 6 desimal (±0,1 m). 4 desimal hanya ±11 m, terlalu kasar untuk area 30 m.
export function formatCoord(value: number | null | undefined): string {
  return value == null || Number.isNaN(value) ? "—" : value.toFixed(6);
}

// Koordinat dengan tanda derajat: -7.770500°
export function formatCoordDeg(value: number | null | undefined): string {
  const text = formatCoord(value);
  return text === "—" ? text : `${text}°`;
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

// Jam WIB dengan pemisah titik: "14.05.33". Menerima milidetik atau teks ISO.
export function formatWibTime(
  value: number | string | null | undefined,
): string {
  if (value == null) return "—";
  const ms = typeof value === "string" ? Date.parse(value) : value;
  if (Number.isNaN(ms)) return "—";
  return wibTime.format(ms).replaceAll(":", ".");
}

// Tanggal WIB: "27 November 2026"
export function formatWibDate(ms: number): string {
  return wibDate.format(ms);
}
