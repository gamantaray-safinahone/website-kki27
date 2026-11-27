"use client";

import { useTheme } from "next-themes";

// Tanpa state "mounted": ikon dipilih lewat CSS (dark:), jadi tidak ada beda server/client.
export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  return (
    <button
      type="button"
      aria-label="Toggle dark mode"
      className="rounded-md border border-neutral-500/30 px-2 py-1 text-sm"
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
    >
      <span className="dark:hidden">Dark</span>
      <span className="hidden dark:inline">Light</span>
    </button>
  );
}
