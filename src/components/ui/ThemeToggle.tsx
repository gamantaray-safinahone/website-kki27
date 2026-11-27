"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

// Tombol tema gaya 2026: ikon Sun/Moon bertumpuk dengan animasi.
// Ikon dipilih lewat CSS (light:), jadi tidak ada beda tampilan server/client.
export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  return (
    <button
      type="button"
      aria-label="Toggle light or dark theme"
      className="group text-sage-dingin hover:text-lime-neon focus-visible:outline-lime-neon relative flex size-10 items-center justify-center transition-colors duration-500 focus-visible:outline-2"
      onClick={() => setTheme(resolvedTheme === "light" ? "dark" : "light")}
    >
      <Sun
        aria-hidden
        className="light:rotate-90 light:scale-0 light:opacity-0 absolute size-6 scale-100 rotate-0 opacity-100 transition-all duration-500 group-hover:rotate-[360deg]"
      />
      <Moon
        aria-hidden
        className="light:rotate-0 light:scale-100 light:opacity-100 light:group-hover:-rotate-12 absolute size-6 scale-0 -rotate-90 opacity-0 transition-all duration-500"
      />
    </button>
  );
}
