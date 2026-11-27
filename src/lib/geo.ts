// Perhitungan geometri sederhana untuk area kecil (puluhan meter).
// Bumi dianggap datar di sekitar titik pusat; galatnya sangat kecil di skala lintasan.

export type LatLon = { lat: number; lon: number };

const METERS_PER_DEG_LAT = 111_320;

export function metersPerDegLon(lat: number): number {
  return METERS_PER_DEG_LAT * Math.cos((lat * Math.PI) / 180);
}

// Geser titik sejauh east/north meter.
export function offsetMeters(
  origin: LatLon,
  east: number,
  north: number,
): LatLon {
  return {
    lat: origin.lat + north / METERS_PER_DEG_LAT,
    lon: origin.lon + east / metersPerDegLon(origin.lat),
  };
}

// Geser titik sejauh `distance` meter ke arah `bearingDeg` (0 = utara, searah jarum jam).
export function destination(
  origin: LatLon,
  bearingDeg: number,
  distance: number,
): LatLon {
  const rad = (bearingDeg * Math.PI) / 180;
  return offsetMeters(
    origin,
    distance * Math.sin(rad),
    distance * Math.cos(rad),
  );
}

export function normalizeDeg(deg: number): number {
  return ((deg % 360) + 360) % 360;
}

// Garis-garis grid lintasan: (rows + 1) garis mendatar dan (cols + 1) garis tegak,
// diputar sebesar bearingDeg di sekitar pusat.
export function gridLines(
  center: LatLon,
  rows: number,
  cols: number,
  cellM: number,
  bearingDeg: number,
): LatLon[][] {
  const width = cols * cellM;
  const height = rows * cellM;
  const rad = (bearingDeg * Math.PI) / 180;
  // x = timur lokal grid, y = utara lokal grid; diputar searah jarum jam.
  const toLatLon = (x: number, y: number) =>
    offsetMeters(
      center,
      x * Math.cos(rad) + y * Math.sin(rad),
      -x * Math.sin(rad) + y * Math.cos(rad),
    );

  const lines: LatLon[][] = [];
  for (let r = 0; r <= rows; r++) {
    const y = -height / 2 + r * cellM;
    lines.push([toLatLon(-width / 2, y), toLatLon(width / 2, y)]);
  }
  for (let c = 0; c <= cols; c++) {
    const x = -width / 2 + c * cellM;
    lines.push([toLatLon(x, -height / 2), toLatLon(x, height / 2)]);
  }
  return lines;
}
