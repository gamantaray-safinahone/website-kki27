import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { dangerButtonClass, buttonClass } from "./styles";

type Pending = {
  message: string;
  action: string;
  resolve: (ok: boolean) => void;
};

// Dialog konfirmasi di dalam halaman (pengganti window.confirm).
// Pakai: const { confirm, dialog } = useConfirm(); render {dialog};
// lalu `if (!(await confirm("Delete …?", "Delete"))) return;`
export function useConfirm(): {
  confirm: (message: string, action?: string) => Promise<boolean>;
  dialog: ReactNode;
} {
  const ref = useRef<HTMLDialogElement>(null);
  const [pending, setPending] = useState<Pending | null>(null);

  const confirm = useCallback(
    (message: string, action = "Confirm") =>
      new Promise<boolean>((resolve) =>
        setPending({ message, action, resolve }),
      ),
    [],
  );

  useEffect(() => {
    if (pending) ref.current?.showModal();
  }, [pending]);

  const close = (ok: boolean) => {
    pending?.resolve(ok);
    setPending(null);
    ref.current?.close();
  };

  const dialog = (
    <dialog
      ref={ref}
      onCancel={(e) => {
        e.preventDefault();
        close(false);
      }}
      className="border-border bg-surface-strong text-foreground m-auto w-[min(26rem,calc(100%-2rem))] border p-5 backdrop:bg-black/60"
    >
      {pending && (
        <div className="flex flex-col gap-5">
          <p className="text-sm">{pending.message}</p>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => close(false)}
              className={buttonClass}
              autoFocus
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => close(true)}
              className={dangerButtonClass}
            >
              {pending.action}
            </button>
          </div>
        </div>
      )}
    </dialog>
  );

  return { confirm, dialog };
}
