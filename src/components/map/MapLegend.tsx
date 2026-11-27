/* eslint-disable @next/next/no-img-element -- ikon kecil statis yang sama dengan marker Leaflet */
import { useState, type ReactNode } from "react";

// Legenda kecil di kanan bawah peta, dua kolom. Bisa diciutkan (<details> bawaan browser).
// Terbuka otomatis di layar lebar (TV/laptop); di HP tertutup supaya tidak menutupi peta.
// Komponen ini hanya dirender di browser (lewat LeafletMap, ssr: false), jadi aman membaca window.

const ITEMS: { label: string; swatch: ReactNode }[] = [
  {
    label: "Red buoy",
    swatch: <img src="/merah.png" alt="" width={12} height={12} />,
  },
  {
    label: "Green buoy",
    swatch: <img src="/hijau.png" alt="" width={12} height={12} />,
  },
  {
    label: "Docking ball",
    swatch: <img src="/bulat_biru.svg" alt="" width={12} height={12} />,
  },
  {
    label: "Start / Finish",
    swatch: (
      <span className="border border-white bg-[#0f172a] px-0.5 text-[7px] leading-tight font-extrabold text-white">
        S
      </span>
    ),
  },
  {
    label: "Surface box",
    swatch: (
      <span className="size-3 border-2 border-[#16a34a] bg-[#16a34a]/25" />
    ),
  },
  {
    label: "Underwater box",
    swatch: (
      <span className="size-3 border-2 border-[#2563eb] bg-[#2563eb]/25" />
    ),
  },
  {
    label: "Boat (heading)",
    swatch: <img src="/kapalasli3.png" alt="" width={9} height={15} />,
  },
  {
    label: "Trail",
    swatch: (
      <span className="w-5 border-t-[3px] border-dashed border-[#dc2626]" />
    ),
  },
  {
    label: "COG",
    swatch: (
      <span className="bg-white px-0.5 py-1">
        <span className="block w-4 border-t-2 border-dashed border-[#0f172a]" />
      </span>
    ),
  },
];

export function MapLegend() {
  const [open, setOpen] = useState(
    () => window.matchMedia("(min-width: 1280px)").matches,
  );
  return (
    <details
      open={open}
      onToggle={(event) => setOpen(event.currentTarget.open)}
      className="border-border bg-surface-strong text-kapur-muda absolute right-3 bottom-12 z-[1000] border px-2.5 py-1.5 text-[11px] shadow-lg"
    >
      <summary className="cursor-pointer font-semibold tracking-wide select-none">
        Legend
      </summary>
      <ul className="mt-1 grid grid-cols-2 gap-x-3 gap-y-0.5">
        {ITEMS.map(({ label, swatch }) => (
          <li
            key={label}
            className="flex items-center gap-1.5 whitespace-nowrap"
          >
            <span className="flex w-5 shrink-0 items-center justify-center">
              {swatch}
            </span>
            {label}
          </li>
        ))}
      </ul>
    </details>
  );
}
