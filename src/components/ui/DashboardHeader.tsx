/* eslint-disable @next/next/no-img-element -- logo kecil statis; tidak memakai optimasi gambar Vercel */
import { ConnectionBadge } from "@/components/status/ConnectionBadge";
import { WibClock } from "@/components/status/WibClock";

import { ThemeToggle } from "./ThemeToggle";

// header: logo + judul di kiri; motto tim di tengah; status koneksi, tema,
// dan jam WIB di kanan. Di HP motto turun ke baris paling bawah.
export function DashboardHeader() {
  return (
    <header className="border-border tall:pb-4 relative flex shrink-0 flex-wrap items-center justify-between gap-x-6 gap-y-2 border-b pb-3">
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

      {/* Di layar lebar diletakkan tepat di tengah header (absolute), tidak
          ikut bergeser walau lebar sisi kiri dan kanan berbeda. */}
      <p className="text-sage-dingin tall:text-base order-last w-full text-center text-sm font-medium tracking-wide italic lg:absolute lg:top-1/2 lg:left-1/2 lg:w-auto lg:-translate-x-1/2 lg:-translate-y-1/2">
        Doa Ibu Bersama Tuhan
      </p>

      <div className="flex items-center gap-3 sm:gap-6">
        <ConnectionBadge />
        <ThemeToggle />
        <WibClock />
      </div>
    </header>
  );
}
