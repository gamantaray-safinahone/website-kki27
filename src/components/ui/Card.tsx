import type { ReactNode } from "react";

export function Card({
  title,
  action,
  children,
  className = "",
}: {
  title: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-xl border border-neutral-500/25 bg-white/60 p-4 dark:bg-neutral-900/60 ${className}`}
    >
      <header className="mb-3 flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold tracking-wide text-neutral-500 uppercase">
          {title}
        </h2>
        {action}
      </header>
      {children}
    </section>
  );
}
