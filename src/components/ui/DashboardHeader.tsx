/* eslint-disable @next/next/no-img-element -- logo kecil statis; tidak memakai optimasi gambar Vercel */
import { ConnectionBadge } from "@/components/status/ConnectionBadge";
import { WibClock } from "@/components/status/WibClock";

import { ThemeToggle } from "./ThemeToggle";

// Header gaya 2026: logo + judul di kiri; status koneksi, tema, dan jam WIB di kanan.
export function DashboardHeader() {
  return (
    <header className="border-border tall:pb-4 flex shrink-0 flex-wrap items-center justify-between gap-x-6 gap-y-2 border-b pb-3">
      <div className="tall:gap-5 flex items-center gap-4">
        <img
          src="/logo.png"
          alt=""
          width={903}
          height={363}
          className="tall:w-20 light:brightness-[0.25] light:hue-rotate-[120deg] light:sepia-[0.5] h-auto w-16 drop-shadow-[0_0_8px_rgba(217,242,26,0.3)] transition-[filter] duration-500"
        />
        <h1 className="from-kapur-muda to-sage-dingin tall:text-2xl bg-linear-to-r bg-clip-text text-xl font-bold tracking-tight text-transparent">
          Safinah One
        </h1>
      </div>

      <div className="flex items-center gap-3 sm:gap-6">
        <ConnectionBadge />
        <ThemeToggle />
        <WibClock />
      </div>
    </header>
  );
}
