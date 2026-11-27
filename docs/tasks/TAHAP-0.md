# Tahap 0 — Fondasi

**Tujuan:** repo Next.js yang bersih, terhubung ke Supabase project tim dengan skema v2, lulus CI, dan ter-deploy di Vercel. Belum ada fitur dashboard.

**Folder repo:** `/home/fazli/safinah1/web-kki27`

**Sudah ada dari paket kit (jangan diubah):** `AGENTS.md`, `CLAUDE.md`, `docs/`, `supabase/migrations/20261127000000_init.sql`.

**Tidak dikerjakan di tahap ini:** peta, Realtime, store Zustand, halaman admin, simulator. Itu Tahap 1 ke atas.

Label langkah:

- **[AGENT]** dikerjakan agent.
- **[MANUSIA]** agent berhenti, menjelaskan langkahnya, lalu menunggu manusia menulis "lanjut". Jangan meminta password, token, atau key ditempel di chat.

Semua langkah di bawah sudah diuji di Linux dengan create-next-app 16.4.6 dan Supabase CLI 3.4.0 (27 November 2026).

---

## 1. [AGENT] Cek prasyarat

```bash
cd /home/fazli/safinah1/web-kki27
node -v      # minimal v20.9; disarankan v24
npm -v
git --version
```

Bila Node di bawah 20.9, berhenti dan minta manusia memasang Node 24 (misalnya lewat nvm).

## 2. [AGENT] Buat kerangka Next.js

create-next-app menolak folder yang sudah berisi `AGENTS.md`, `CLAUDE.md`, atau `supabase/`. Jadi kerangka dibuat di folder sementara, lalu disalin tanpa menimpa file kit.

```bash
rm -rf /tmp/web-kki27
npx --yes create-next-app@16.4.6 /tmp/web-kki27 \
  --ts --tailwind --eslint --app --src-dir --import-alias "@/*" \
  --use-npm --disable-git --no-agent-feedback --skip-install --yes
cp -r --update=none /tmp/web-kki27/. .
rm -rf /tmp/web-kki27
```

Cek: `AGENTS.md` masih berisi aturan proyek Safinah One (tidak tertimpa), dan `package.json` memakai nama `web-kki27`.

Catatan: kerangka bawaan sudah mengaktifkan `cacheComponents` dan `partialPrefetching` di `next.config.ts`. Biarkan apa adanya.

## 3. [AGENT] Pasang dependensi

```bash
npm install
npm install --save-exact @supabase/supabase-js@2.119.2 @supabase/ssr@0.12.7
npm install --save-dev --save-exact supabase@3.4.0 prettier@3.10.1 prettier-plugin-tailwindcss@0.8.1
npx supabase --version   # harus 3.4.0
```

## 4. [AGENT] Bersihkan contoh bawaan

```bash
rm -f public/file.svg public/globe.svg public/next.svg public/vercel.svg public/window.svg
```

Ganti isi tiga file berikut.

`src/app/layout.tsx` (tanpa web font, supaya ringan di koneksi lemah):

```tsx
import type { Metadata } from "next";

import "./globals.css";

export const metadata: Metadata = {
  title: "Safinah One · Live Monitoring",
  description:
    "Live position, speed, mission progress and imaging results of the Safinah One ASV (Gamantaray UGM) at KKI 2027.",
};

// Sengaja memakai font sistem (tanpa web font) supaya ringan di koneksi lemah.
export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="flex min-h-full flex-col font-sans">{children}</body>
    </html>
  );
}
```

`src/app/globals.css`:

```css
@import "tailwindcss";

:root {
  --background: #ffffff;
  --foreground: #171717;
}

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
}

@media (prefers-color-scheme: dark) {
  :root {
    --background: #0a0a0a;
    --foreground: #ededed;
  }
}

body {
  background: var(--background);
  color: var(--foreground);
}
```

`src/app/page.tsx`:

```tsx
import { Suspense } from "react";

import { DatabaseStatus } from "@/components/status/DatabaseStatus";

export default function HomePage() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 p-6">
      <header>
        <h1 className="text-2xl font-semibold">
          Safinah One · Live Monitoring
        </h1>
        <p className="text-sm text-neutral-500">
          KKI 2027 · ASV · Gamantaray UGM
        </p>
      </header>

      {/* Data dibaca saat request, jadi wajib di dalam Suspense (Cache Components). */}
      <Suspense
        fallback={
          <p className="text-sm text-neutral-500">Checking database…</p>
        }
      >
        <DatabaseStatus />
      </Suspense>

      <p className="text-sm text-neutral-500">
        The live dashboard is under construction.
      </p>
    </main>
  );
}
```

## 5. [AGENT] File konfigurasi

`.nvmrc`:

```text
24
```

`.env.example`:

```bash
# Salin file ini menjadi .env.local, lalu isi dari
# Supabase Dashboard > Project Settings > API Keys.
# HANYA URL dan publishable key. Secret key (sb_secret_...) tidak boleh ada di repo web.
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_xxx
```

Tambahkan di akhir `.gitignore` (baris `.env*` bawaan akan mengabaikan `.env.example` kalau tidak dikecualikan):

```gitignore

# file contoh env boleh di-commit
!.env.example

# supabase cli
supabase/.temp/
supabase/.branches/
```

`.prettierrc.json`:

```json
{
  "plugins": ["prettier-plugin-tailwindcss"]
}
```

`.prettierignore`:

```text
.next
node_modules
package-lock.json
next-env.d.ts
/supabase
src/types/database.types.ts
*.md
```

`/supabase` memakai garis miring di depan supaya hanya folder `supabase/` di root yang diabaikan; tanpa garis miring, `src/lib/supabase/` ikut diabaikan sehingga formatnya tidak pernah dicek.

Di `package.json`, ganti blok `scripts` dan tambahkan `engines` (dependensi biarkan seperti hasil langkah 3):

```json
"scripts": {
  "dev": "next dev",
  "build": "next build",
  "start": "next start",
  "lint": "eslint",
  "typecheck": "next typegen && tsc --noEmit",
  "format": "prettier --write .",
  "format:check": "prettier --check .",
  "check": "npm run lint && npm run typecheck && npm run format:check && npm run build",
  "db:push": "supabase db push --remote",
  "db:status": "supabase migration list --remote",
  "db:types": "supabase gen types --lang typescript --remote --schema public > src/types/database.types.ts"
},
"engines": {
  "node": ">=20.9.0"
}
```

`next typegen` diperlukan sebelum `tsc` karena tipe `LayoutProps` dibuat oleh Next.js.

## 6. [AGENT] Inisialisasi Supabase CLI

```bash
npx supabase init
```

Perintah ini membuat `supabase/config.jsonc` (CLI 3 memakai `.jsonc`, bukan `.toml`) dan membiarkan folder `migrations/` yang sudah ada. Jangan mengubah `config.jsonc`; file itu hanya untuk Supabase lokal yang tidak kita pakai.

## 7. [AGENT] Kode koneksi Supabase

`src/lib/env.ts`:

```ts
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
```

`src/lib/supabase/client.ts`:

```ts
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
```

`src/lib/supabase/server.ts`:

```ts
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
```

`src/components/status/DatabaseStatus.tsx`:

```tsx
import { createSupabaseServerClient } from "@/lib/supabase/server";

// Pemeriksaan Tahap 0: membuktikan migrasi terpasang dan publik bisa membaca.
// Komponen ini diganti dashboard live di Tahap 1.
export async function DatabaseStatus() {
  const supabase = await createSupabaseServerClient();

  const [state, runs] = await Promise.all([
    supabase.from("app_state").select("active_lintasan, live_run_id").single(),
    supabase.from("runs").select("id", { count: "exact", head: true }),
  ]);

  if (state.error || runs.error) {
    return (
      <p className="rounded-md border border-red-500/40 p-3 text-sm text-red-600">
        Database error: {(state.error ?? runs.error)?.message}
      </p>
    );
  }

  return (
    <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-1 rounded-md border border-neutral-500/30 p-4 text-sm">
      <dt className="text-neutral-500">Database</dt>
      <dd className="font-medium text-green-600">Connected</dd>
      <dt className="text-neutral-500">Active course</dt>
      <dd>{state.data.active_lintasan ?? "Not set"}</dd>
      <dt className="text-neutral-500">Runs recorded</dt>
      <dd>{runs.count ?? 0}</dd>
    </dl>
  );
}
```

`src/types/database.types.ts` belum ada sampai langkah 9, jadi typecheck baru bisa lulus setelah langkah itu.

## 8. [MANUSIA] Hubungkan ke Supabase project tim

Agent berhenti di sini dan menampilkan langkah ini ke manusia.

1. Buka Supabase Dashboard > Project Settings > API Keys. Salin **Project URL** dan **publishable key**. Buat `.env.local` dari `.env.example` lalu isi keduanya:

   ```bash
   cp .env.example .env.local
   ```

2. Di terminal folder repo:

   ```bash
   npx supabase login
   npx supabase link --project-ref <project-ref>
   npm run db:push
   ```

   `<project-ref>` adalah bagian depan Project URL (`https://<project-ref>.supabase.co`). `link` dan `db:push` mungkin meminta password database project. `db:push` harus menerapkan satu migrasi: `20261127000000_init.sql`.

3. Di Supabase Dashboard:
   - Authentication > Sign In / Providers: matikan **Allow new users to sign up**.
   - Authentication > Users > Add user: buat akun admin (email + password, centang auto confirm).
   - SQL Editor, jalankan untuk setiap admin:

     ```sql
     insert into public.app_admins (user_id)
     select id from auth.users where email = '<email-admin>';
     ```

4. Tulis "lanjut" ke agent.

## 9. [AGENT] Buat tipe database

```bash
npm run db:types
npx supabase migration list --remote
```

Cek: `src/types/database.types.ts` berisi tabel `app_state`, `courses`, `course_items`, `runs`, `telemetry`, `mission_events`, `captures`, view `mission_status`, dan fungsi `get_run_series`. Migrasi `20261127000000` tercatat di kolom lokal dan remote.

## 10. [AGENT] GitHub Actions

`.github/workflows/ci.yml`:

```yaml
name: CI

on:
  pull_request:
  push:
    branches: [main]

jobs:
  check:
    runs-on: ubuntu-latest
    # Nilai palsu: build tidak menghubungi Supabase, hanya butuh variabelnya ada.
    env:
      NEXT_PUBLIC_SUPABASE_URL: https://example.supabase.co
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: sb_publishable_ci_placeholder
      NEXT_TELEMETRY_DISABLED: 1
    steps:
      - uses: actions/checkout@v5
      - uses: actions/setup-node@v5
        with:
          node-version-file: .nvmrc
          cache: npm
      - run: npm ci
      - run: npm run lint
      - run: npm run typecheck
      - run: npm run format:check
      - run: npm run build
      - name: Pastikan tidak ada secret key Supabase di repo
        run: |
          if git grep -nE "sb_secret_[A-Za-z0-9]{8,}"; then
            echo "Ditemukan secret key. Hapus dari repo dan cabut key itu di dashboard Supabase."
            exit 1
          fi
```

`.github/workflows/keepalive.yml`:

```yaml
name: Keep Supabase awake

# Project Supabase gratis dijeda bila sepi seminggu. Workflow ini membaca
# satu baris tiap 6 jam. Isi secret SUPABASE_URL dan SUPABASE_PUBLISHABLE_KEY
# di GitHub: Settings > Secrets and variables > Actions.
on:
  schedule:
    - cron: "17 */6 * * *"
  workflow_dispatch:

jobs:
  ping:
    runs-on: ubuntu-latest
    steps:
      - name: Baca app_state
        env:
          SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          SUPABASE_PUBLISHABLE_KEY: ${{ secrets.SUPABASE_PUBLISHABLE_KEY }}
        run: |
          curl --fail --silent --show-error \
            "$SUPABASE_URL/rest/v1/app_state?select=id" \
            -H "apikey: $SUPABASE_PUBLISHABLE_KEY"
```

## 11. [AGENT] README.md

Tulis ulang `README.md` dalam Bahasa Indonesia sederhana. Isinya, berurutan:

1. Apa ini: website monitoring live Safinah One untuk KKI 2027; `/` dipakai publik dan layar panitia.
2. Stack dan versi (ringkas dari `AGENTS.md`).
3. Prasyarat: Node 24 (`.nvmrc`), npm, akses ke project Supabase tim.
4. Menjalankan lokal: `npm ci`, salin `.env.example` ke `.env.local`, `npm run dev`.
5. Tabel perintah npm dengan penjelasan satu baris per perintah.
6. Database: cara membuat migrasi baru dan memperbarui tipe; peringatan bahwa Supabase CLI 3 default ke lokal sehingga selalu `--remote`.
7. Deploy: Vercel otomatis dari branch `main`; env yang wajib diisi.
8. Aturan penting: tidak ada secret key di repo, tidak ada endpoint tulis, semua teks UI Bahasa Inggris.
9. Tautan ke `docs/ARCHITECTURE.md`, `docs/DATA_CONTRACT.md`, `docs/tasks/README.md`.

Jangan menyalin isi docs ke README; cukup tautkan.

## 12. [AGENT] Cek lokal

```bash
npm run format
npm run check
npm run dev
```

Buka http://localhost:3000. Harus tampil: **Database: Connected**, **Active course: A**, **Runs recorded: 0**.

Cek RLS dengan publishable key (dari folder repo):

```bash
set -a; source .env.local; set +a

# Baca: harus berhasil dan mengembalikan [{"active_lintasan":"A"}]
curl -s "$NEXT_PUBLIC_SUPABASE_URL/rest/v1/app_state?select=active_lintasan" \
  -H "apikey: $NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"; echo

# Tulis: harus DITOLAK dengan kode 401 atau 403
curl -s -o /dev/null -w "%{http_code}\n" -X POST \
  "$NEXT_PUBLIC_SUPABASE_URL/rest/v1/runs" \
  -H "apikey: $NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY" \
  -H "Content-Type: application/json" -d '{"source":"admin"}'

# Tidak ada secret key di repo: harus mencetak "aman"
git grep -nE "sb_secret_[A-Za-z0-9]{8,}" || echo "aman"
```

Bila tulis berhasil (kode 201), berhenti dan laporkan ke manusia: RLS tidak terpasang dengan benar.

## 13. [AGENT] Commit pertama

```bash
git init -b main          # lewati bila .git sudah ada
git add -A
git status                # .env.local, node_modules, .next, supabase/.temp TIDAK boleh muncul
git commit -m "Tahap 0: fondasi Next.js 16 + Supabase skema v2"
```

## 14. [MANUSIA] GitHub dan Vercel (akun tim)

1. Buat repo di GitHub organisasi tim, lalu:

   ```bash
   git remote add origin <url-repo>
   git push -u origin main
   ```

2. GitHub repo > Settings > Secrets and variables > Actions: tambahkan secret `SUPABASE_URL` dan `SUPABASE_PUBLISHABLE_KEY` (untuk `keepalive.yml`). Jalankan workflow "Keep Supabase awake" sekali lewat tombol Run workflow.
3. Vercel (akun tim) > Add New Project > import repo. Tambahkan environment variable `NEXT_PUBLIC_SUPABASE_URL` dan `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` untuk Production dan Preview, lalu Deploy.
4. Supabase Dashboard > Authentication > URL Configuration: isi **Site URL** dengan alamat `https://<nama>.vercel.app` (dipakai login admin di Tahap 3).
5. Tulis "lanjut" ke agent beserta alamat Vercel-nya.

## 15. [AGENT] Cek akhir

- Buka alamat Vercel: tampilan sama dengan lokal (Connected, course A, 0 runs).
- Tab Actions di GitHub: workflow CI hijau.
- Laporkan ke manusia: alamat Vercel, hasil `npm run check`, hasil cek RLS, dan hal yang belum beres (bila ada).

## Kriteria selesai Tahap 0

- [ ] `npm run check` lulus di lokal dan di CI.
- [ ] Migrasi `20261127000000_init.sql` terpasang di project tim; `database.types.ts` dihasilkan dari project itu.
- [ ] Publik bisa membaca, publishable key tidak bisa menulis.
- [ ] Sign-up publik mati, minimal satu admin terdaftar di `app_admins`.
- [ ] Situs `*.vercel.app` menampilkan status database.
- [ ] README ditulis ulang; tidak ada file contoh bawaan atau secret key di repo.
