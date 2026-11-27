"use client";

import { Check, ListChecks } from "lucide-react";
import { useMemo } from "react";

import { Card } from "@/components/ui/Card";
import { formatWibTime } from "@/lib/format";
import {
  describeDetail,
  latestPhaseStates,
  orderPhases,
  PHASE_LABELS,
  STATUS_LABELS,
  type PhaseStatus,
} from "@/lib/mission";
import { useLive } from "@/lib/live/store";

import { RunTimer } from "./RunTimer";

// Mission Log gaya 2026. Bedanya: tidak diredupkan, fase selesai diberi centang
// dan jam selesai, dan timer run menggantikan teks "Tahap 1" yang dulu di-hardcode.
export function PhaseList() {
  const events = useLive((s) => s.events);
  const phaseOrder = useLive((s) => s.appState?.phase_order);

  const phases = useMemo(() => orderPhases(phaseOrder), [phaseOrder]);
  const states = useMemo(() => latestPhaseStates(events), [events]);

  return (
    <Card
      title="Mission Log"
      icon={ListChecks}
      action={<RunTimer />}
      className="xl:flex-1"
    >
      {/* Item dibagi rata setinggi panel, jadi daftar muat tanpa scroll di layar laptop. */}
      <ol className="divide-border flex min-h-0 flex-1 flex-col divide-y">
        {phases.map((phase, index) => {
          const state = states[phase];
          const status: PhaseStatus = state?.status ?? "pending";
          const detail = state ? describeDetail(phase, state.detail) : null;
          const active = status === "active";
          return (
            <li
              key={phase}
              className={`tall:px-5 tall:text-lg flex min-h-0 items-center gap-3 overflow-hidden px-4 py-1.5 text-sm xl:flex-1 ${
                active ? "bg-lime-neon text-on-accent" : "text-kapur-muda"
              }`}
            >
              {status === "done" ? (
                <Check
                  className="text-lime-neon tall:size-5 size-4 shrink-0"
                  aria-hidden
                />
              ) : (
                <span
                  aria-hidden
                  className={`tall:mx-[5px] mx-[3px] size-2.5 shrink-0 rounded-full ${
                    active ? "bg-on-accent" : "bg-foreground/25"
                  }`}
                />
              )}
              {/* Di layar tinggi detail ("Gate 4 / 10") turun ke baris kedua supaya tidak terpotong. */}
              <span className="min-w-0 flex-1 truncate leading-tight font-medium">
                {PHASE_LABELS[phase]}
                {detail && (
                  <span className="tall:ml-0 tall:block tall:text-sm ml-2 text-xs font-normal opacity-80">
                    {detail}
                  </span>
                )}
              </span>
              <span className="sr-only">{STATUS_LABELS[status]}</span>
              {active && (
                <span
                  aria-hidden
                  className="tall:text-xs shrink-0 text-[10px] font-bold tracking-widest uppercase"
                >
                  Active
                </span>
              )}
              {status === "done" && state && (
                <time
                  dateTime={state.t}
                  className="text-sage-dingin tall:text-sm shrink-0 text-xs tabular-nums"
                >
                  {formatWibTime(state.t)}
                </time>
              )}
              <span className="tall:text-sm w-5 shrink-0 text-right text-xs tabular-nums opacity-70">
                {String(index + 1).padStart(2, "0")}
              </span>
            </li>
          );
        })}
      </ol>
    </Card>
  );
}
