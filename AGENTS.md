# Safinah One — Website Monitoring KKI 2027

Website monitoring live kapal ASV **Safinah One** (tim Gamantaray UGM) untuk Kontes Kapal Indonesia 2027. Halaman `/` dibuka publik dan sekaligus ditampilkan di layar panitia selama run (maksimal 20 menit). Data datang dari kapal (Intel NUC + Raspberry Pi, ROS 2 Jazzy) lewat Supabase.

Baca sebelum menulis kode:

- `docs/ARCHITECTURE.md` — halaman, struktur folder, aturan data live.
- `docs/DATA_CONTRACT.md` — data yang ditulis kapal, satuan, dan siapa menulis apa.
- `docs/tasks/README.md` — urutan tahap dan kriteria selesai.
- `docs/tasks/TAHAP-<n>.md` — instruksi tahap yang sedang dikerjakan.

## Stack (versi dikunci)

| Bagian | Versi |
| --- | --- |
| Next.js (App Router, Turbopack, Cache Components aktif) | 16.4.6 |
| React | 19.3 |
| TypeScript | 5.9 (jangan pindah ke 7.x sebelum create-next-app memakainya) |
| Tailwind CSS | 4.3 |
| @supabase/supabase-js / @supabase/ssr | 2.119.2 / 0.12.7 |
| Supabase CLI (devDependency, `npx supabase`) | 3.4.0 |
| Leaflet / react-leaflet (mulai Tahap 1) | 1.9.4 / 5.0.0 |
| Zustand (mulai Tahap 1) | 5.1 |
| uPlot (mulai Tahap 4) | 1.6 |
| Node.js | 24 LTS (`.nvmrc`), minimal 20.9 |
| Package manager | npm |

Jangan menaikkan versi mayor atau menambah dependensi baru tanpa alasan yang ditulis di pesan commit.

## Perintah

- `npm run dev` — server lokal di http://localhost:3000
- `npm run check` — lint, typecheck, cek format, build. Wajib lulus sebelum commit.
- `npm run format` — rapikan format kode.
- `npm run db:push` — terapkan migrasi baru ke Supabase project tim.
- `npm run db:status` — bandingkan migrasi lokal dan yang sudah terpasang.
- `npm run db:types` — buat ulang `src/types/database.types.ts`.

Supabase CLI 3 menjalankan perintah database ke database **lokal** secara default. Tim tidak memakai Supabase lokal (tanpa Docker), jadi selalu pakai `--remote`. Script npm di atas sudah memakainya.

## Bahasa

- Semua teks yang tampil di UI: **Bahasa Inggris**.
- Nama variabel, fungsi, komponen, dan file: Bahasa Inggris.
- Komentar kode, README, dan isi `docs/`: Bahasa Indonesia yang sederhana. Tim berisi mahasiswa semester awal, jadi tulis supaya mudah dipahami.

## Keamanan (wajib)

1. Aplikasi web hanya memakai `NEXT_PUBLIC_SUPABASE_URL` dan `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. Secret key (`sb_secret_…`) dan service role key tidak boleh ada di kode aplikasi, di `.env.local`, atau di repo.
2. Pengecualian satu-satunya: simulator kapal (`scripts/simulate-boat.ts`, Tahap 1) membaca secret key "sim" dari `.env.sim` yang di-gitignore. File itu tidak pernah dibaca Next.js dan skrip itu tidak pernah di-import aplikasi.
3. Jangan membuat Route Handler atau API yang menulis data. Publik hanya membaca; admin menulis langsung dengan sesi login; RLS di database adalah penjaga terakhir.
4. Jangan pernah melonggarkan RLS: tidak ada policy insert/update/delete untuk `anon`, dan tidak ada `using (true)` untuk operasi tulis.
5. Jangan commit file `.env*` selain `.env.example`.

## Database

- Skema hanya berubah lewat file migrasi baru: `npx supabase migration new <nama>` → tulis SQL → `npm run db:push` → `npm run db:types`.
- Jangan mengedit migrasi yang sudah di-push, termasuk `20261127000000_init.sql`.
- `src/types/database.types.ts` dihasilkan otomatis. Jangan diedit manual.
- Mulai Tahap 1, semua query Supabase ditaruh di `src/lib/queries.ts`, bukan tersebar di komponen.

## Frontend

- Ikuti struktur folder di `docs/ARCHITECTURE.md`. Jangan membuat folder baru di luar itu tanpa alasan.
- Satu sumber data live: `LiveProvider` + store Zustand `useLive`. Komponen tidak boleh membuat channel Realtime sendiri.
- Cache Components aktif. Data dari Supabase dibaca di Server Component async yang dibungkus `<Suspense>`. Jangan memakai `export const dynamic`. Bila ragu, baca panduan di `node_modules/next/dist/docs/`.
- Sesi admin memakai `src/proxy.ts` (Next.js 16 mengganti `middleware.ts` menjadi `proxy.ts`).
- Leaflet hanya berjalan di client: komponen `"use client"` yang dimuat lewat `next/dynamic` dengan `ssr: false`.
- Pakai font sistem, tanpa web font. Foto dari Supabase Storage ditampilkan dengan `<img>` biasa (thumbnail dulu), bukan optimasi gambar Vercel.
- TypeScript strict; hindari `any`. Satu komponen per file, nama file komponen PascalCase.
- Setiap panel dashboard dibungkus `PanelBoundary` (error boundary) supaya satu panel error tidak mematikan peta.

## Kebersihan repo (pelajaran dari KKI 2026)

- Jangan commit file sementara, skrip coba-coba, log, atau hasil build.
- Satu komponen satu versi. Ubah yang sudah ada; jangan membuat `Foo2.tsx` atau `FooNew.tsx`.
- Hapus kode yang tidak dipakai.

## Definisi selesai

- `npm run check` lulus.
- Semua langkah di bagian "Cek" pada file tahap sudah dicoba.
- Docs yang terdampak ikut diperbarui.
- Commit kecil dengan pesan yang jelas.

## Langkah yang dikerjakan manusia

Berhenti dan minta manusia menjalankan sendiri langkah yang butuh login atau password: `npx supabase login`, `npx supabase link`, `npm run db:push`, serta pengaturan di dashboard Supabase, GitHub, dan Vercel. Jangan meminta password, token, atau key ditempel di chat. Tunggu konfirmasi manusia sebelum lanjut.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
