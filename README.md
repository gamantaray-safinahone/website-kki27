# Safinah One · Website Monitoring KKI 2027

Website untuk memantau kapal ASV **Safinah One** (tim Gamantaray UGM) secara live di Kontes Kapal Indonesia 2027. Halaman `/` dibuka oleh publik dan sekaligus ditampilkan di layar panitia selama run. Data dikirim kapal ke Supabase, lalu website membacanya.

## Stack

| Bagian | Versi |
| --- | --- |
| Next.js (App Router, Turbopack, Cache Components) | 16.4.6 |
| React | 19.3 |
| TypeScript | 5.9 |
| Tailwind CSS | 4.3 |
| @supabase/supabase-js / @supabase/ssr | 2.119.2 / 0.12.7 |
| Supabase CLI (`npx supabase`) | 3.4.0 |
| Node.js | 24 LTS (lihat `.nvmrc`) |

Daftar lengkap dan aturan menaikkan versi ada di [`AGENTS.md`](AGENTS.md).

## Prasyarat

- Node.js 24. Kalau memakai nvm, cukup jalankan `nvm use` di folder repo (versinya dibaca dari `.nvmrc`).
- npm (ikut terpasang bersama Node.js).
- Akses ke project Supabase tim. Minta ke anggota tim yang memegang akun Supabase.

## Menjalankan di laptop

```bash
npm ci
cp .env.example .env.local
npm run dev
```

Isi `.env.local` dengan **Project URL** dan **publishable key** dari Supabase Dashboard > Project Settings > API Keys. Setelah itu buka http://localhost:3000.

## Perintah npm

| Perintah | Fungsi |
| --- | --- |
| `npm run dev` | Menjalankan server lokal di http://localhost:3000. |
| `npm run build` | Membuat versi produksi (sama seperti di Vercel). |
| `npm run start` | Menjalankan hasil `build` di laptop. |
| `npm run lint` | Mencari kesalahan kode dengan ESLint. |
| `npm run typecheck` | Membuat tipe route Next.js lalu mengecek tipe TypeScript. |
| `npm run format` | Merapikan format semua file dengan Prettier. |
| `npm run format:check` | Mengecek format tanpa mengubah file. |
| `npm run check` | Lint, typecheck, cek format, dan build sekaligus. Wajib lulus sebelum commit. |
| `npm run db:push` | Menerapkan migrasi baru ke project Supabase tim. |
| `npm run db:status` | Membandingkan migrasi di laptop dengan yang sudah terpasang di Supabase. |
| `npm run db:types` | Membuat ulang `src/types/database.types.ts` dari skema Supabase. |

## Database

Skema database hanya boleh berubah lewat file migrasi baru:

```bash
npx supabase migration new <nama_perubahan>   # membuat file kosong di supabase/migrations/
# tulis SQL di file baru itu
npm run db:push                               # terapkan ke Supabase tim
npm run db:types                              # perbarui tipe TypeScript
```

- Sekali di awal, jalankan `npx supabase login` lalu `npx supabase link --project-ref <project-ref>`.
- Jangan mengedit migrasi yang sudah di-push. Kalau ada yang salah, buat migrasi baru yang memperbaikinya.
- Jangan mengedit `src/types/database.types.ts` dengan tangan; file itu dibuat oleh `npm run db:types`.

> **Peringatan:** Supabase CLI 3 menjalankan perintah database ke database **lokal** secara default. Tim tidak memakai Supabase lokal, jadi selalu tambahkan `--remote`. Script `db:*` di atas sudah memakainya.

## Deploy

Vercel otomatis men-deploy setiap ada push ke branch `main`. Pull request mendapat deploy preview.

Environment variable yang wajib diisi di Vercel (Production dan Preview):

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

Workflow `keepalive.yml` di GitHub butuh secret `SUPABASE_URL` dan `SUPABASE_PUBLISHABLE_KEY` (Settings > Secrets and variables > Actions) supaya project Supabase gratis tidak dijeda.

## Aturan penting

- **Tidak ada secret key di repo.** Website hanya memakai URL dan publishable key. Secret key (`sb_secret_…`) tidak boleh ada di kode, di `.env.local`, atau di commit. CI akan gagal kalau menemukannya.
- **Tidak ada endpoint tulis.** Jangan membuat Route Handler atau API yang menulis data. Publik hanya membaca, admin menulis lewat sesi login, dan RLS di database menjaga semuanya.
- **Semua teks di UI berbahasa Inggris.** Komentar kode dan dokumen boleh Bahasa Indonesia.

## Dokumen lain

- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md): halaman, struktur folder, aturan data live.
- [`docs/DATA_CONTRACT.md`](docs/DATA_CONTRACT.md): data yang dikirim kapal, satuan, dan siapa menulis apa.
- [`docs/tasks/README.md`](docs/tasks/README.md): urutan tahap pengerjaan dan kriteria selesai.
