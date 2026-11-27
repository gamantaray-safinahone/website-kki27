import type { ReactNode } from "react";

export type StatTone = "normal" | "warning" | "critical";

const TONE_CLASSES: Record<StatTone, string> = {
  normal: "text-kapur-muda",
  warning: "text-amber-400 light:text-amber-700",
  critical: "text-red-400 light:text-red-700",
};

export function StatTile({
  label,
  value,
  sub,
  tone = "normal",
  className = "",
}: {
  label: ReactNode;
  value: ReactNode;
  sub?: ReactNode;
  tone?: StatTone;
  className?: string;
}) {
  return (
    <div className={`tall:py-3.5 min-w-0 px-3 py-2 ${className}`}>
      <p className="text-sage-dingin tall:text-sm flex items-center gap-1.5 text-xs font-semibold">
        {label}
      </p>
      <p
        className={`tall:mt-1 tall:text-[1.3rem] mt-0.5 truncate text-lg tracking-tight tabular-nums ${TONE_CLASSES[tone]}`}
      >
        {value}
      </p>
      {sub && (
        <p className="text-sage-dingin truncate text-xs tabular-nums">{sub}</p>
      )}
    </div>
  );
}
