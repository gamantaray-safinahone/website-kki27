import Link from "next/link";

import { ThemeToggle } from "@/components/ui/ThemeToggle";

import { SignOutButton } from "./SignOutButton";

const LINKS = [
  { href: "/admin", label: "Live run" },
  { href: "/admin/runs", label: "Runs" },
  { href: "/admin/course", label: "Course" },
  { href: "/", label: "Dashboard ↗" },
] as const;

// Navigasi admin. Di HP: judul + tema + sign out di baris atas, link halaman
// di baris bawah (4 kolom sama lebar). Di layar lebar semuanya satu baris.
export function AdminHeader() {
  return (
    <header className="border-border flex flex-col gap-3 border-b pb-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center justify-between gap-4 sm:contents">
        <span className="text-kapur-muda font-bold whitespace-nowrap sm:order-1">
          Safinah One · Admin
        </span>
        <div className="flex items-center gap-4 sm:order-3">
          <ThemeToggle />
          <SignOutButton />
        </div>
      </div>
      <nav className="grid grid-cols-4 gap-1 text-sm sm:order-2 sm:mr-auto sm:ml-6 sm:flex sm:gap-5">
        {LINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="text-sage-dingin hover:text-lime-neon border-border border py-1.5 text-center whitespace-nowrap sm:border-0 sm:py-0"
          >
            {link.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
