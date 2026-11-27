"use client";

import { LogIn } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { signInAdmin } from "@/lib/queries";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

// Login admin (email + password). Tidak ada pendaftaran: akun dibuat manual
// di dashboard Supabase dan didaftarkan di app_admins.
export function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(form: FormData) {
    setBusy(true);
    setError(null);
    const failed = await signInAdmin(
      createSupabaseBrowserClient(),
      String(form.get("email") ?? ""),
      String(form.get("password") ?? ""),
    );
    if (failed) {
      // Pesan umum: tidak memberi tahu apakah email terdaftar.
      setError("Invalid email or password.");
      setBusy(false);
      return;
    }
    router.replace("/admin");
    router.refresh();
  }

  const input =
    "border-border bg-surface text-foreground focus:border-lime-neon w-full border px-3 py-2 outline-none";

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        void submit(new FormData(event.currentTarget));
      }}
      className="flex flex-col gap-4"
    >
      <label className="flex flex-col gap-1.5 text-sm">
        <span className="text-sage-dingin">Email</span>
        <input
          name="email"
          type="email"
          autoComplete="username"
          required
          className={input}
        />
      </label>
      <label className="flex flex-col gap-1.5 text-sm">
        <span className="text-sage-dingin">Password</span>
        <input
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className={input}
        />
      </label>
      {error && (
        <p role="alert" className="text-sm text-red-500">
          {error}
        </p>
      )}
      <button
        type="submit"
        disabled={busy}
        className="bg-lime-neon text-on-accent flex items-center justify-center gap-2 px-4 py-2 font-semibold disabled:opacity-50"
      >
        <LogIn className="size-4" aria-hidden />
        {busy ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
