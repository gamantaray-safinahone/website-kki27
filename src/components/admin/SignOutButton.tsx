"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";

import { signOutAdmin } from "@/lib/queries";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function SignOutButton() {
  const router = useRouter();

  async function onClick() {
    await signOutAdmin(createSupabaseBrowserClient());
    router.replace("/admin/login");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className="text-sage-dingin hover:text-lime-neon flex items-center gap-1.5 text-sm"
    >
      <LogOut className="size-4" aria-hidden />
      Sign out
    </button>
  );
}
