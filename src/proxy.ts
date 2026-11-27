import type { NextRequest } from "next/server";

import { updateSession } from "@/lib/supabase/proxy";

// Next.js 16: proxy.ts menggantikan middleware.ts. Hanya berjalan di /admin,
// jadi dashboard publik tidak ikut memeriksa sesi.
export function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: ["/admin", "/admin/:path*"],
};
