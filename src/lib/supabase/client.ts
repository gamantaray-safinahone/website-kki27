import { createBrowserClient } from "@supabase/ssr";

import { env } from "@/lib/env";
import type { Database } from "@/types/database.types";

// Klien Supabase untuk komponen client ("use client").
// @supabase/ssr otomatis memakai satu instance yang sama di browser.
export function createSupabaseBrowserClient() {
  return createBrowserClient<Database>(
    env.supabaseUrl,
    env.supabasePublishableKey,
  );
}
