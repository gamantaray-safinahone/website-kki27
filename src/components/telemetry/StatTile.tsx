import type { ReactNode } from "react";

// Satu angka besar dengan label dan satuan. Ukuran huruf membesar di layar lebar (TV panitia).
export function StatTile({
  label,
  value,
  unit,
  sub,
}: {
  label: string;
  value: string;
  unit?: string;
  sub?: ReactNode;
}) {
  return (
    <div className="rounded-lg border border-neutral-500/20 p-3">
      <p className="text-xs font-medium tracking-wide text-neutral-500 uppercase">
        {label}
      </p>
      <p className="mt-1 font-mono text-2xl font-semibold tabular-nums xl:text-4xl">
        {value}
        {unit && (
          <span className="ml-1 text-base font-normal text-neutral-500">
            {unit}
          </span>
        )}
      </p>
      {sub && <p className="mt-0.5 text-xs text-neutral-500">{sub}</p>}
    </div>
  );
}
