"use client";

import { Card } from "@/components/ui/Card";
import {
  formatCoord,
  formatDeg,
  formatKnots,
  formatNumber,
} from "@/lib/format";
import { useLive } from "@/lib/live/store";

import { StatTile } from "./StatTile";

const GPS_FIX_LABELS = [
  "No GPS",
  "No fix",
  "2D fix",
  "3D fix",
  "DGPS",
  "RTK float",
  "RTK fixed",
];

export function TelemetryPanel() {
  const t = useLive((s) => s.latest);

  return (
    <Card title="Telemetry">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <StatTile
          label="SOG"
          value={formatNumber(t?.sog_ms, 2)}
          unit="m/s"
          sub={`${formatKnots(t?.sog_ms)} kn`}
        />
        <StatTile
          label="COG"
          value={formatDeg(t?.cog_deg)}
          sub="Course over ground"
        />
        <StatTile
          label="Heading"
          value={formatDeg(t?.heading_deg)}
          sub="Compass"
        />
        <StatTile
          label="Battery"
          value={formatNumber(t?.battery_v, 1)}
          unit="V"
          sub={
            t?.battery_pct != null
              ? `${Math.round(t.battery_pct)}% · ${formatNumber(t.battery_a, 1)} A`
              : undefined
          }
        />
        <StatTile
          label="Mode"
          value={t?.fcu_mode ?? "—"}
          sub={t ? (t.armed ? "Armed" : "Disarmed") : undefined}
        />
        <StatTile
          label="GPS"
          value={t?.gps_sats != null ? String(t.gps_sats) : "—"}
          unit="sats"
          sub={
            t?.gps_fix != null
              ? (GPS_FIX_LABELS[t.gps_fix] ?? `Fix ${t.gps_fix}`)
              : undefined
          }
        />
      </div>
      <p className="mt-3 font-mono text-xs text-neutral-500">
        {formatCoord(t?.lat)}, {formatCoord(t?.lon)}
        {t?.mission_state && ` · ${t.mission_state}`}
      </p>
    </Card>
  );
}
