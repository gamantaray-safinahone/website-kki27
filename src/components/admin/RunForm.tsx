import { useState } from "react";

import { updateRun, type Run } from "@/lib/queries";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

import type { ActionResult } from "./StatusMessage";
import { inputClass, primaryButtonClass } from "./styles";

// Label dan catatan satu run.
export function RunForm({
  run,
  onResult,
}: {
  run: Run;
  onResult: (result: ActionResult) => void;
}) {
  const [label, setLabel] = useState(run.label ?? "");
  const [notes, setNotes] = useState(run.notes ?? "");
  const [busy, setBusy] = useState(false);

  async function save() {
    setBusy(true);
    const error = await updateRun(createSupabaseBrowserClient(), run.id, {
      label: label.trim() || null,
      notes: notes.trim() || null,
    });
    setBusy(false);
    onResult(
      error ? { ok: false, text: error.message } : { ok: true, text: "Saved." },
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <label className="flex flex-col gap-1 text-sm">
        <span className="text-sage-dingin">Label</span>
        <input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="Final A - attempt 2"
          className={inputClass}
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        <span className="text-sage-dingin">Notes</span>
        <input
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className={inputClass}
        />
      </label>
      <div className="flex justify-end sm:col-span-2">
        <button
          type="button"
          onClick={save}
          disabled={busy}
          className={primaryButtonClass}
        >
          Save
        </button>
      </div>
    </div>
  );
}
