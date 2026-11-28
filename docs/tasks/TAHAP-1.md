# Tahap 1 — Dashboard live (MVP)

**Tujuan:** halaman `/` menampilkan data kapal secara live: peta (grid, buoy, kotak imaging, jejak, ikon kapal yang berputar), panel telemetri, 7 fase misi dengan timer, foto terbaru per slot, dan indikator koneksi. Data uji dimasukkan manual lewat Supabase SQL Editor dengan `supabase/snippets/uji-manual.sql`, mengikuti kontrak di `docs/DATA_CONTRACT.md`.

**Folder repo:** `/home/fazli/safinah1/web-kki27`

**Tidak dikerjakan di tahap ini:** halaman admin, riwayat run, replay, galeri.

Label langkah sama seperti Tahap 0: **[AGENT]** dikerjakan agent, **[MANUSIA]** agent berhenti dan menunggu manusia menulis "lanjut".

Semua file di paket ini sudah diuji di sandbox (27 November 2026):

- `npm run check` lulus (lint, typecheck, format, build).
- `supabase/snippets/uji-manual.sql` (ditambahkan di repo, bukan dari paket) dijalankan per bagian di Postgres 16 lokal yang memakai migrasi `20261127000000_init.sql` asli: telemetri berjarak tepat 1 detik, tanpa duplikat, dan tidak pernah di masa depan; semua fase berpindah sampai Done; run ditutup; bagian pembersih menghapus semua data uji.
- Logika store lulus 21 pemeriksaan (duplikat, data terlambat, ganti run, fase, foto).
- Dashboard dibuka di Chrome (1920×1080, HP 390 px, mode gelap) tanpa error. Realtime tidak bisa diuji di sandbox; yang teruji di sana adalah jalur cadangan polling. Realtime diuji di langkah 7 dengan Supabase asli.

---

## Isi paket

| File | Fungsi |
| --- | --- |
| `src/lib/queries.ts` | Semua query Supabase dan tipe baris (`Telemetry`, `Run`, …) |
| `src/lib/mission.ts` | Daftar fase, status, slot, label UI (Inggris), status terakhir per fase |
| `src/lib/geo.ts` | Geser titik dalam meter, garis grid lintasan |
| `src/lib/format.ts` | Format angka, sudut, "12 s ago", durasi |
| `src/lib/live/store.ts` | Store Zustand `useLive`: satu-satunya sumber data dashboard |
| `src/lib/live/LiveProvider.tsx` | Satu-satunya pembuka Realtime: muat data, langganan, catch-up, polling cadangan |
| `src/lib/live/channels.ts` | Dua channel: `config` dan `run:<id>` |
| `src/lib/live/catchup.ts` | Mengambil data yang terlewat setelah sambungan pulih atau tab aktif lagi |
| `src/lib/live/useNow.ts` | Jam yang berdetak tiap detik untuk "X s ago" dan timer |
| `src/components/map/*` | `MissionMap` (memuat Leaflet hanya di browser), `LeafletMap`, `GridLayer`, `CourseLayer`, `TrailLayer`, `BoatMarker` |
| `src/components/telemetry/*` | `TelemetryPanel`, `StatTile` |
| `src/components/mission/*` | `PhaseList`, `RunTimer` |
| `src/components/captures/*` | `LatestCaptures`, `CaptureCard` |
| `src/components/status/*` | `ConnectionBadge`, `DataAge`, `RunInfo` |
| `src/components/ui/*` | `Card`, `PanelBoundary` (error boundary), `ThemeToggle` |
| `src/app/layout.tsx`, `page.tsx`, `globals.css` | Tema terang/gelap, susunan dashboard, animasi ikon kapal |

Ditambahkan di repo, bukan dari paket: `supabase/snippets/uji-manual.sql`, SQL untuk menguji dashboard per bagian di SQL Editor (langkah 7). File ini tidak dijalankan otomatis.

Perbedaan kecil dari rancangan awal:

- Peta memakai Leaflet langsung tanpa react-leaflet. Layer diperbarui lewat objek Leaflet, bukan render ulang React tiap detik, jadi react-leaflet tidak memberi manfaat.
- Data uji tidak dikirim lewat skrip di laptop. Supaya tidak ada secret key di laptop tim web, data uji dimasukkan lewat SQL Editor dengan `supabase/snippets/uji-manual.sql`.
- Peta menyesuaikan zoom ke grid lintasan (`fitBounds`). Kolom `courses.zoom` belum dipakai.

---

## 1. [AGENT] Cek prasyarat

```bash
cd /home/fazli/safinah1/web-kki27
git status                 # harus bersih
node -v                    # minimal v20.9; disarankan v24
```

Bila Node di bawah v20.9, berhenti dan minta manusia merapikan PATH supaya Node 24 dari nvm yang dipakai.

## 2. [AGENT] Pasang dependensi

```bash
npm install --save-exact zustand@5.1.0 leaflet@1.9.4 next-themes@0.4.6
npm install --save-dev --save-exact @types/leaflet@1.9.23
```

## 3. [MANUSIA] Ekstrak paket

Dari root repo:

```bash
cd /home/fazli/safinah1/web-kki27
unzip -o ~/Downloads/web-kki27-kit-tahap1.zip
```

`-o` menimpa `src/app/layout.tsx`, `page.tsx`, dan `globals.css` dari Tahap 0. Itu memang disengaja.

## 4. [AGENT] Rapikan setelah ekstrak

```bash
rm src/components/status/DatabaseStatus.tsx   # pemeriksaan Tahap 0, sudah diganti dashboard
git status
```

Cek: tidak ada file lain dari Tahap 0 yang terhapus.

## 5. [AGENT] Perbarui dokumen

1. `AGENTS.md`, tabel stack: ganti baris "Leaflet / react-leaflet (mulai Tahap 1)" menjadi `Leaflet (tanpa react-leaflet) | 1.9.4`, ganti baris Zustand menjadi `Zustand | 5.1.0`, dan tambahkan baris `next-themes (tema terang/gelap) | 0.4.6`.
2. `AGENTS.md`, bagian Keamanan: hapus poin 2 (pengecualian secret key di laptop), lalu ubah poin 1 menjadi: secret key tidak boleh ada di kode aplikasi, di file `.env` mana pun di laptop tim web, atau di repo.
3. `docs/ARCHITECTURE.md`:
   - struktur folder: `components/map/` tambahkan `LeafletMap`; `components/status/` tambahkan `RunInfo`; `lib/live/` tambahkan `useNow.ts`; baris `supabase/` tambahkan `snippets/uji-manual.sql`;
   - bagian "Ringan dan aman": env web hanya berisi URL dan publishable key, dan tidak ada secret key di laptop tim web.
4. `docs/DATA_CONTRACT.md`:
   - bagian "Koneksi": secret key per perangkat hanya `nuc` dan `pi`;
   - bagian "Antrean dan retry", tambahkan satu poin: "Setelah kiriman berhasil, hapus sampel dari antrean berdasarkan objeknya, bukan dengan `pop()`. Selama menunggu jaringan, sampel baru bisa sudah masuk ke ujung antrean, dan `pop()` akan membuang sampel yang belum terkirim."
5. `README.md`, bagian Database: tambahkan cara memakai `supabase/snippets/uji-manual.sql`, dengan peringatan "jangan dijalankan saat lomba".

## 6. [AGENT] Cek kode

```bash
npm run format
npm run check
```

Bila typecheck gagal di file paket, bandingkan dengan `src/types/database.types.ts` milik project. Kode paket diuji dengan tipe yang meniru `supabase gen types`; selisih kecil (misalnya nama helper `Tables`) cukup disesuaikan di `src/lib/queries.ts`. Jangan mengubah logika store atau provider tanpa melapor.

## 7. [MANUSIA + AGENT] Uji dengan Supabase asli

Terminal:

```bash
npm run dev
```

Buka http://localhost:3000. Lalu buka Supabase Dashboard > SQL Editor dan tempel isi `supabase/snippets/uji-manual.sql`. Jalankan **satu bagian setiap kali**: sorot bagian itu, lalu klik Run. Jangan menjalankan seluruh file sekaligus, karena bagian 5 (pembersih) akan ikut jalan. Setiap bagian punya catatan "Di dashboard:" tentang apa yang seharusnya terlihat tanpa reload.

Urutan: bagian 0 (lintasan contoh, cukup sekali) → 1 (run uji) → 2 (telemetri, ulangi kira-kira tiap 10 detik) → 3a sampai 3i (event misi, berurutan) → 4 (akhiri run).

- [ ] Setelah bagian 1: header menampilkan "Course A · Manual test".
- [ ] Setelah bagian 2: kanan atas **Boat: Online**, **Feed: Live** (bukan Polling), "Last data" 0–2 s.
- [ ] Peta menyesuaikan ke grid 6 × 6; terlihat 10 pasang buoy (merah di kanan, hijau di kiri), kotak imaging biru dan hijau, Start, dan Finish.
- [ ] Bagian 2 diulang: ikon kapal bergerak halus dan berputar sesuai arah; jejak oranye bertambah; garis putus-putus menunjukkan COG.
- [ ] Bagian 3a sampai 3i: fase berubah dari Pending ke Active ke Done, timer berjalan sejak 3b (Start aktif) dan berhenti di 3i.
- [ ] Setelah bagian 4: badge **Run ended**.
- [ ] Mode gelap bisa dinyalakan dan dimatikan.

Panel Imaging tetap "No photo yet" karena foto butuh file di Storage. Foto diuji saat integrasi Pi di Tahap 2.

Uji ketahanan (inilah kriteria selesai Tahap 1):

- [ ] Saat run masih live (sebelum bagian 4), berhenti menjalankan bagian 2: badge berubah ke Delayed setelah 5 detik, lalu Offline setelah 15 detik. Jalankan bagian 2 lagi: kembali Online dan jejak menyambung tanpa garis lurus yang melompat.
- [ ] Chrome DevTools > Network > throttling "3G": halaman tetap terbuka dalam beberapa detik, dan data dari bagian 2 terus masuk.
- [ ] Buka di HP, kunci layar sekitar 1 menit sambil menjalankan bagian 2 dan 3d beberapa kali, lalu buka lagi: data mengejar sendiri tanpa reload.
- [ ] Jendela Chrome 1920×1080 (layar TV panitia): seluruh dashboard terlihat tanpa scroll.
- [ ] Lintasan B: di bagian 1, ganti `'A'` menjadi `'B'` pada `insert into public.runs`, lalu jalankan bagian 1. Label menjadi "Course B" dan slot foto besar menjadi SL dan UR. Grid tidak tampil karena lintasan B belum punya koordinat, jadi peta berpusat pada kapal.

Kelengkapan data dari kapal sungguhan (tanpa celah dan tanpa dobel, termasuk saat internet putus) diuji di Tahap 2.

Selesai menguji, jalankan bagian 5 (dan 5b bila bagian 0 dipakai). Tulis "lanjut" ke agent beserta hasil cek, termasuk yang gagal.

## 8. [AGENT] Laporan dan commit

Laporkan hasil langkah 6 dan 7, termasuk hal yang berbeda dari dokumen ini. Commit hanya bila manusia memintanya, misalnya `git commit -m "Tahap 1: dashboard live, store, peta"`.

## 9. [MANUSIA] Bersihkan data uji (bila perlu)

Run uji dari `supabase/snippets/uji-manual.sql` memakai `source = 'sim'`. Run seperti ini tidak pernah diikuti dashboard secara otomatis; bagian 1 yang mengarahkan dashboard ke sana secara manual. Sebelum dashboard dipakai untuk uji kapal sungguhan, jalankan bagian 5 (dan 5b bila bagian 0 dipakai) dari file itu.

Bila masih ada sisa run uji lain atau lintasan contoh, bersihkan semuanya:

```sql
-- berhenti mengikuti run uji
update app_state set live_run_id = null;

-- hapus semua run uji beserta telemetri, event, dan baris fotonya
delete from runs where source = 'sim';

-- opsional: kosongkan lintasan contoh
delete from course_items where lintasan in ('A', 'B');
update courses set center_lat = null, center_lon = null;
```

`uji-manual.sql` tidak mengunggah foto, jadi tidak ada file di Storage yang perlu dihapus.

---

## Catatan desain (untuk dibaca tim)

- **Satu sumber data.** Semua data live masuk ke `useLive`. Komponen hanya membaca lewat selector; hanya `LiveProvider` yang membuka Realtime. Dua channel per tab: `config` dan `run:<id>`.
- **Peta tidak dirender ulang tiap detik.** `TrailLayer` dan `BoatMarker` membaca store lewat `useLive.subscribe` dan memperbarui objek Leaflet langsung. Jejak digambar ulang penuh hanya bila `trailRevision` berubah (run baru atau data terlambat yang harus disisipkan).
- **Duplikat dibuang berdasarkan `t`.** Waktu sampel unik per run di database, jadi data yang datang dua kali (snapshot dan catch-up, atau retry kapal) tidak menggandakan jejak.
- **Catch-up dan polling.** Setiap Realtime tersambung (lagi) atau tab aktif lagi, provider mengambil baris dengan `id` lebih besar dari yang sudah ada. Bila Realtime putus lebih dari 10 detik, catch-up dijalankan tiap 3 detik dan badge menampilkan "Polling".
- **Umur data dari jam browser.** Setelah data live pertama tiba, "Last data" dihitung dari saat data tiba di browser, sehingga jam HP penonton yang meleset tidak berpengaruh.
- **Data uji lewat SQL Editor.** Tidak ada secret key di laptop tim web, jadi data uji dimasukkan lewat `supabase/snippets/uji-manual.sql`. Aturan untuk `web_bridge` dan `capture_uploader` (header, kunci idempoten, urutan foto: file dulu, baris kemudian; antrean "terbaru dulu, backlog menyusul"; cara menghapus dari antrean) beserta contoh kodenya ada di `docs/DATA_CONTRACT.md`.
