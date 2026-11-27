"use client";

import { useNow } from "@/lib/live/useNow";

// Footer gaya 2026. Tahun dihitung di browser: Cache Components melarang
// membaca waktu sekarang saat halaman di-prerender di server.
export function DashboardFooter() {
  const now = useNow();
  const year = now ? new Date(now).getFullYear() : null;
  return (
    <footer className="border-border text-sage-dingin tall:mt-5 tall:pt-4 tall:text-sm mt-3 shrink-0 border-t pt-2 text-center text-xs font-medium tracking-wide">
      Copyright &copy; {year && `${year} `}Safinah One Gamantaray Universitas
      Gadjah Mada
    </footer>
  );
}
