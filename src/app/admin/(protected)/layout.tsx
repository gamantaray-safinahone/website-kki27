import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";

import { AdminHeader } from "@/components/admin/AdminHeader";
import { SignOutButton } from "@/components/admin/SignOutButton";
import { fetchAdminStatus } from "@/lib/queries";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Admin - Safinah One",
  robots: { index: false },
};

// Semua halaman admin (kecuali login) lewat gerbang ini: harus login dan
// terdaftar di app_admins. RLS tetap penjaga terakhir untuk setiap tulisan.
export default function ProtectedAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 p-4 sm:p-6">
      <Suspense
        fallback={<p className="text-sage-dingin text-sm">Checking access…</p>}
      >
        <AdminGate>{children}</AdminGate>
      </Suspense>
    </div>
  );
}

async function AdminGate({ children }: { children: React.ReactNode }) {
  // Selalu dirender per request (sesi login ada di cookie). Tanpa ini Next
  // mencoba prerender dan menemukan Date.now() di dalam klien Supabase.
  await connection();
  const status = await fetchAdminStatus(await createSupabaseServerClient());
  if (!status) redirect("/admin/login");

  if (!status.isAdmin) {
    return (
      <div className="border-border bg-surface-strong mx-auto mt-16 flex max-w-sm flex-col items-center gap-4 border p-6 text-center">
        <h1 className="text-kapur-muda text-xl font-bold">Not authorized</h1>
        <p className="text-sage-dingin text-sm">
          This account is not an admin.
        </p>
        <SignOutButton />
      </div>
    );
  }

  return (
    <>
      <AdminHeader />
      {children}
    </>
  );
}
