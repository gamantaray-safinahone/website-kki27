// Variabel environment publik untuk koneksi Supabase.
// Next.js hanya mengganti process.env.NEXT_PUBLIC_* yang ditulis lengkap,
// jadi jangan membaca lewat process.env[nama].
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabasePublishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabasePublishableKey) {
  throw new Error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY. Copy .env.example to .env.local and fill it in.",
  );
}

// Pengaman: secret key memberi akses penuh dan tidak boleh sampai ke browser.
if (supabasePublishableKey.startsWith("sb_secret_")) {
  throw new Error(
    "A secret key was put in NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY. Use the publishable key (sb_publishable_...).",
  );
}

export const env = { supabaseUrl, supabasePublishableKey };
