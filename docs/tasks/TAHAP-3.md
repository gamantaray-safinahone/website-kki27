# Tahap 3 — Panel admin

**Tujuan:** operator web bisa mengatur tampilan dashboard dan arsip run dari halaman `/admin`, tanpa SQL Editor. Admin hanya mengatur tampilan dan arsip: admin tidak pernah mengirim perintah ke kapal dan tidak mengubah telemetri atau event (data kapal adalah catatan resmi).

**Folder repo:** `/home/fazli/safinah1/web-kki27`

**Tidak dikerjakan di tahap ini:** riwayat run publik, replay, galeri (Tahap 4), serta fitur di luar panel admin (mode TV khusus, pengumuman, export CSV).

Label langkah sama seperti tahap sebelumnya: **[AGENT]** dikerjakan agent, **[MANUSIA]** agent berhenti dan menunggu manusia menulis "lanjut".

**Tanpa migrasi baru.** Semua kolom dan policy yang dibutuhkan sudah ada di `20261127000000_init.sql`:

| Kebutuhan | Kolom / policy |
| --- | --- |
| Run yang diikuti dashboard, lintasan default, urutan fase | `app_state.live_run_id`, `active_lintasan`, `phase_order`; policy "admin ubah" |
| Label, catatan, akhiri, hapus run | `runs.label`, `notes`, `status`, `ended_at`, `end_reason`; policy "admin ubah/hapus" |
| Editor lintasan | `courses` (pusat, `imaging_slots`), `course_items`; policy "admin tambah/ubah/hapus" |
| Sembunyikan / hapus foto | `captures.hidden`; policy "admin ubah/hapus"; Storage "admin kelola captures" |
| Cek admin | `app_admins` (baca baris sendiri), `private.is_admin()` di RLS |

Telemetri dan `mission_events` tetap tanpa izin tulis untuk admin (hanya ikut terhapus bila run dihapus).

---

## Aturan tahap ini

- Admin menulis **langsung dari browser** dengan sesi login (`createSupabaseBrowserClient`). Tidak ada Route Handler, API, atau Server Action yang menulis data. RLS adalah penjaga terakhir.
- Semua query baru ditaruh di `src/lib/queries.ts`.
- Halaman admin tidak membuka channel Realtime sendiri. Bila butuh data live (misalnya posisi kapal terakhir), pakai `LiveProvider` + `useLive` yang sama dengan dashboard.
- Komponen admin di `src/components/admin/`. Leaflet di editor lintasan tetap `"use client"` lewat `next/dynamic` dengan `ssr: false`, dan hanya dimuat di halamannya.
- Aksi yang menghapus data selalu memakai dialog konfirmasi yang menyebut apa yang dihapus.
- Teks UI dalam Bahasa Inggris.

---

## 1. [MANUSIA] Akun admin

1. Supabase Dashboard > Authentication > Sign In / Providers: pastikan **Allow new users to sign up** mati.
2. Authentication > Users > Add user: buat akun admin (email + password). Catat UUID-nya.
3. SQL Editor:
   ```sql
   insert into public.app_admins (user_id) values ('<uuid admin>');
   ```
4. Buat juga satu akun **non-admin** (tanpa baris `app_admins`) untuk uji penolakan di langkah 8.

Jangan menempel password di chat. Tulis "lanjut" bila selesai.

## 2. [AGENT] Sesi dan proteksi

- `src/proxy.ts` (Next.js 16, pengganti `middleware.ts`): menyegarkan sesi Supabase lewat `@supabase/ssr` dan mengarahkan `/admin/*` (kecuali `/admin/login`) ke `/admin/login` bila belum login. Logika sesi di `src/lib/supabase/proxy.ts`. Baca panduan proxy di `node_modules/next/dist/docs/` dulu.
- `src/app/admin/login/page.tsx` + `LoginForm`: email + password, pesan error umum ("Invalid email or password"), tanpa pendaftaran.
- `src/app/admin/(protected)/layout.tsx`: Server Component async di dalam `<Suspense>`, mengecek user dan barisnya di `app_admins`. Bukan admin → halaman "Not authorized" + tombol sign out (jangan bocorkan data admin).
- Header admin: link ke `/admin`, `/admin/runs`, `/admin/course`, link kembali ke dashboard, dan tombol sign out.

## 3. [AGENT] `/admin`: kontrol run live

Halaman yang paling dipakai saat lomba.

- **Run yang diikuti dashboard:** tampilkan run di `live_run_id` (label, lintasan, source, status, umur). Tombol:
  - **Follow** pada run lain di daftar run terbaru (mis. 10 terakhir) → set `live_run_id`.
  - **Unfollow** → `live_run_id = null` (dashboard menampilkan "No active run" di antara giliran tim).
  - Normalnya run kapal diikuti otomatis oleh trigger `follow_boat_run`; jelaskan ini singkat di UI.
- **Edit run:** `label`, `notes`.
- **End run (manual):** hanya untuk run `live`. Set `status = 'aborted'`, `ended_at = now()`, `end_reason = 'manual'`. Ini cadangan bila NUC mati dan run tertinggal `live`. Konfirmasi dulu.
- **Default course on map:** pilihan A/B → `active_lintasan`.
- **Phase order:** urutan 7 fase (`phase_order`) dengan tombol naik/turun dan tombol reset ke urutan bawaan. Simpan hanya bila berisi 7 fase yang sama.
- **Status data kapal:** "Last data N s ago" dari `received_at` telemetri terakhir run yang diikuti, supaya operator bisa membedakan sinyal hilang dengan run yang sudah berhenti.

## 4. [AGENT] `/admin/runs`: arsip

- Tabel run terbaru dulu: label, lintasan, source, status, `end_reason`, mulai, durasi, jumlah foto. Pagination sederhana (mis. 20 per halaman).
- Klik run → daftar foto run itu (thumbnail per slot):
  - **Hide / Unhide** foto (`captures.hidden`). Foto tersembunyi tidak tampil di dashboard (sudah difilter `LatestCaptures`).
  - **Delete photo:** hapus file (`storage_path`, `thumb_path`, `surface_path`, `surface_thumb_path` yang terisi) lalu baris `captures`.
- **Delete run beserta file:**
  1. Dialog konfirmasi menyebut label run dan jumlah file.
  2. List semua file di `runs/<run_id>/` (termasuk subfolder slot) dan hapus dari bucket `captures`.
  3. Bila semua file terhapus, baru hapus baris `runs` (telemetri, event, captures ikut terhapus lewat cascade; `live_run_id` otomatis null).
  4. Bila langkah 2 gagal, jangan hapus baris run; tampilkan error supaya bisa diulang.
- Run yang sedang `live` tidak bisa dihapus sebelum diakhiri.

## 5. [AGENT] `/admin/course`: editor lintasan

- Pilih lintasan A/B. Peta Leaflet (komponen `CourseEditor`) memakai layer yang sama dengan dashboard (grid, objek lintasan).
- **Center:** isi lat/lon manual, atau **Use boat position** (lat/lon telemetri terakhir dari `useLive`; tombol mati bila belum ada data).
- **Objek lintasan (`course_items`):** tambah, geser (drag marker), ubah label/urutan, hapus. Simpan per objek; tampilkan status tersimpan/gagal.
- **Imaging slots:** pilih satu slot surface (SL/SR) dan satu slot underwater (UL/UR) → `courses.imaging_slots`.
- Validasi di form sama dengan check constraint database (lat −90..90, lon −180..180, center diisi keduanya atau dikosongkan keduanya).
- Catatan di UI: run yang sudah ada tidak berubah karena memakai `course_snapshot`.

## 6. [AGENT] Query

Tambahkan di `src/lib/queries.ts` (nama bebas, tipe dari `database.types.ts`): baca status admin, daftar run + jumlah foto, update `app_state`, update/akhiri/hapus run, update/hapus captures, list/hapus file Storage per run, CRUD `courses`/`course_items`. Setiap fungsi mengembalikan error Supabase apa adanya supaya UI bisa menampilkannya.

## 7. [AGENT] Dokumen

- `docs/ARCHITECTURE.md`: sesuaikan tabel halaman admin bila ada perbedaan dari rencana.
- `README.md`: cara menambah admin (langkah 1) dan peringatan bahwa sign-up publik harus mati.

## 8. [AGENT + MANUSIA] Cek

- `npm run check` lulus.
- Belum login: `/admin`, `/admin/runs`, `/admin/course` diarahkan ke `/admin/login`.
- Login akun non-admin: muncul "Not authorized", tidak ada data admin. Uji RLS juga di console browser dengan sesi non-admin: update `app_state` dan delete `runs` harus gagal / tidak mengubah baris.
- Login admin dengan data dari `supabase/snippets/contoh-tampilan.sql`:
  - Follow/Unfollow langsung terlihat di dashboard tab lain (Realtime).
  - Label, notes, phase order, default course tersimpan dan tampil di dashboard.
  - End run mengubah status menjadi aborted/manual.
  - Hide foto menghilangkan foto dari Camera Feeds; Unhide mengembalikannya.
  - Delete run: folder `runs/00000000-0000-4000-8000-000000000102/` di Storage kosong dan baris run hilang.
  - Editor lintasan: geser buoy, refresh, posisi tetap; dashboard ikut berubah.
- Layout admin dicek di laptop 1366 px dan HP 390 px, tema terang dan gelap.
- Commit dilakukan manusia.
