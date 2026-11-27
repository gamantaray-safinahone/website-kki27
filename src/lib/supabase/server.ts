import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import { env } from "@/lib/env";
import type { Database } from "@/types/database.types";

// Klien Supabase untuk Server Component, Server Action, dan Route Handler.
// Membaca sesi login admin dari cookie; untuk pengunjung publik tidak ada sesi
// sehingga query berjalan sebagai role anon (hanya SELECT).
export async function createSupabaseServerClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    env.supabaseUrl,
    env.supabasePublishableKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Server Component tidak boleh menulis cookie. Aman diabaikan:
            // penyegaran sesi akan ditangani proxy.ts di Tahap 3.
          }
        },
      },
    },
  );
}
