import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

// Panel standar dashboard
export function Card({
  title,
  icon: Icon,
  action,
  children,
  className = "",
}: {
  title: string;
  icon: LucideIcon;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`border-border bg-surface-strong flex min-h-0 flex-col border shadow-[0_0_0_1px_var(--border)_inset] ${className}`}
    >
      <header className="border-border tall:px-5 tall:py-3.5 flex shrink-0 flex-wrap items-center justify-between gap-x-3 gap-y-2 border-b px-4 py-2.5">
        <h2 className="text-kapur-muda tall:text-[1.05rem] flex shrink-0 items-center gap-2.5 text-base font-medium tracking-wide">
          <Icon className="text-lime-neon size-4 shrink-0" aria-hidden />
          {title}
        </h2>
        {action}
      </header>
      {children}
    </section>
  );
}
