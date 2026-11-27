"use client";

import { Battery, BatteryLow, BatteryWarning, Compass } from "lucide-react";

import { DataAge } from "@/components/status/DataAge";
import { Card } from "@/components/ui/Card";
import { formatCoordDeg, formatDeg, formatNumber } from "@/lib/format";
import { useLive } from "@/lib/live/store";

import { StatTile, type StatTone } from "./StatTile";

const BATTERY_WARNING_PCT = 30;
const BATTERY_CRITICAL_PCT = 15;

// Ambang baterai
function batteryState(pct: number | null | undefined): {
  tone: StatTone;
  text: string;
} | null {
  if (pct == null) return null;
  if (pct <= BATTERY_CRITICAL_PCT)
    return { tone: "critical", text: "Critical" };
  if (pct <= BATTERY_WARNING_PCT) return { tone: "warning", text: "Low" };
  return { tone: "normal", text: "OK" };
}

// Navigation Data
export function TelemetryPanel() {
  const t = useLive((s) => s.latest);

  const battery = batteryState(t?.battery_pct);
  const BatteryIcon =
    battery?.tone === "critical"
      ? BatteryWarning
      : battery?.tone === "warning"
        ? BatteryLow
        : Battery;
  const volts =
    t?.battery_v != null ? `${formatNumber(t.battery_v, 2)} V` : null;
  const amps =
    t?.battery_a != null ? `${formatNumber(t.battery_a, 1)} A` : null;

  const cell = "border-b border-border";
  const left = `${cell} border-r`;

  return (
    <Card title="Navigation Data" icon={Compass} className="shrink-0">
      <div className="grid grid-cols-2">
        <StatTile
          className={left}
          label="Latitude"
          value={formatCoordDeg(t?.lat)}
        />
        <StatTile
          className={cell}
          label="Longitude"
          value={formatCoordDeg(t?.lon)}
        />
        <StatTile
          className={left}
          label="SoG"
          value={t?.sog_ms != null ? `${formatNumber(t.sog_ms, 1)} m/s` : "—"}
        />
        <StatTile className={cell} label="CoG" value={formatDeg(t?.cog_deg)} />
        <StatTile
          className={left}
          label="Heading"
          value={formatDeg(t?.heading_deg)}
        />
        <StatTile
          className={`${cell} bg-foreground/5`}
          tone={battery?.tone}
          label={
            <>
              <BatteryIcon className="text-lime-neon size-4" aria-hidden />
              Battery
            </>
          }
          value={
            t?.battery_pct != null ? (
              <>
                {Math.round(t.battery_pct)}%
                <span className="ml-2 text-xs font-semibold tracking-wide uppercase">
                  {battery?.text}
                </span>
              </>
            ) : (
              (volts ?? "—")
            )
          }
          sub={
            t?.battery_pct != null && (volts || amps)
              ? [volts, amps].filter(Boolean).join(" · ")
              : amps
          }
        />
      </div>
      <p className="text-sage-dingin tall:px-4 tall:py-2 px-3 py-1.5 text-xs">
        <DataAge />
      </p>
    </Card>
  );
}
