"use client";

import { useMemo } from "react";

import { Card } from "@/components/ui/Card";
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

const STATUS_STYLES: Record<PhaseStatus, string> = {
  pending: "border-neutral-500/30 text-neutral-500",
  active: "border-blue-500 bg-blue-500/10 text-blue-600 animate-pulse",
  done: "border-green-600 bg-green-600/10 text-green-700 dark:text-green-400",
};

export function PhaseList() {
  const events = useLive((s) => s.events);
  const phaseOrder = useLive((s) => s.appState?.phase_order);

  const phases = useMemo(() => orderPhases(phaseOrder), [phaseOrder]);
  const states = useMemo(() => latestPhaseStates(events), [events]);

  return (
    <Card title="Mission" action={<RunTimer />}>
      <ol className="space-y-1.5">
        {phases.map((phase, index) => {
          const state = states[phase];
          const status: PhaseStatus = state?.status ?? "pending";
          const detail = state ? describeDetail(phase, state.detail) : null;
          return (
            <li key={phase} className="flex items-center gap-3">
              <span className="w-5 text-right font-mono text-xs text-neutral-500">
                {index + 1}
              </span>
              <span className="flex-1 font-medium xl:text-lg">
                {PHASE_LABELS[phase]}
                {detail && (
                  <span className="ml-2 text-sm text-neutral-500">
                    {detail}
                  </span>
                )}
              </span>
              <span
                className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${STATUS_STYLES[status]}`}
              >
                {STATUS_LABELS[status]}
              </span>
            </li>
          );
        })}
      </ol>
    </Card>
  );
}
