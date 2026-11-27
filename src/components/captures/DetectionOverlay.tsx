import type { Json } from "@/types/database.types";

// Hasil deteksi dari Pi: [{"cls": "green_box", "conf": 0.91, "bbox": [x, y, w, h]}],
// bbox relatif 0–1 terhadap foto web (docs/DATA_CONTRACT.md bagian Foto).
type Detection = {
  cls: string;
  conf: number | null;
  bbox: [number, number, number, number];
};

function parseDetections(value: Json | null): Detection[] {
  if (!Array.isArray(value)) return [];
  const result: Detection[] = [];
  for (const item of value) {
    if (!item || typeof item !== "object" || Array.isArray(item)) continue;
    const { cls, conf, bbox } = item;
    if (
      Array.isArray(bbox) &&
      bbox.length === 4 &&
      bbox.every((n) => typeof n === "number")
    ) {
      result.push({
        cls: typeof cls === "string" ? cls : "object",
        conf: typeof conf === "number" ? conf : null,
        bbox: bbox as [number, number, number, number],
      });
    }
  }
  return result;
}

// Kotak deteksi di atas foto. Wadahnya harus seukuran foto (position: relative).
export function DetectionOverlay({ detection }: { detection: Json | null }) {
  const boxes = parseDetections(detection);
  if (boxes.length === 0) return null;
  return (
    <div className="pointer-events-none absolute inset-0" aria-hidden>
      {boxes.map(({ cls, conf, bbox: [x, y, w, h] }, index) => (
        <div
          key={index}
          className="border-lime-neon absolute border-2"
          style={{
            left: `${x * 100}%`,
            top: `${y * 100}%`,
            width: `${w * 100}%`,
            height: `${h * 100}%`,
          }}
        >
          <span className="bg-lime-neon text-on-accent absolute bottom-full left-0 px-1 text-[11px] font-semibold whitespace-nowrap">
            {cls}
            {conf != null && ` ${Math.round(conf * 100)}%`}
          </span>
        </div>
      ))}
    </div>
  );
}
