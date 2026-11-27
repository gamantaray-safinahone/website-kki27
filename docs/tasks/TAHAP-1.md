# Tahap 1 — Dashboard live (MVP)

**Tujuan:** halaman `/` menampilkan data kapal secara live: peta (grid, buoy, kotak imaging, jejak, ikon kapal yang berputar), panel telemetri, 7 fase misi dengan timer, foto terbaru per slot, dan indikator koneksi. Data uji datang dari simulator kapal yang menulis ke Supabase persis seperti kontrak di `docs/DATA_CONTRACT.md`.

**Folder repo:** `/home/fazli/safinah1/web-kki27`

**Tidak dikerjakan di tahap ini:** halaman admin, riwayat run, replay, galeri.

Label langkah sama seperti Tahap 0: **[AGENT]** dikerjakan agent, **[MANUSIA]** agent berhenti dan menunggu manusia menulis "lanjut".

Semua file di paket ini sudah diuji di sandbox (27 November 2026):

- `npm run check` lulus (lint, typecheck, format, build).
- Simulator dijalankan ke tiruan Supabase yang memakai skema v2 asli: 93 sampel tanpa celah dan tanpa duplikat, 23 event, 2 foto, run ditutup dengan benar, termasuk saat internet "diputus" 15–30 detik.
- Logika store lulus 21 pemeriksaan (duplikat, data terlambat, ganti run, fase, foto).
- Dashboard dibuka di Chrome (1920×1080, HP 390 px, mode gelap) tanpa error. Realtime tidak bisa diuji di sandbox; yang teruji di sana adalah jalur cadangan polling. Realtime diuji di langkah 7 dengan Supabase asli.

---

## Isi paket

| File | Fungsi |
| --- | --- |
| `scripts/simulate-boat.mts` | Kapal palsu. Menulis run, telemetri 1 Hz, event, dan foto PNG lewat HTTP biasa. Sekaligus contoh kode untuk tim ROS |
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

Perbedaan kecil dari rancangan awal:

- Peta memakai Leaflet langsung tanpa react-leaflet. Layer diperbarui lewat objek Leaflet, bukan render ulang React tiap detik, jadi react-leaflet tidak memberi manfaat.
- Simulator berakhiran `.mts` (bukan `.ts`) supaya Node menjalankannya langsung sebagai ES module tanpa alat tambahan.
- Peta menyesuaikan zoom ke grid lintasan (`fitBounds`). Kolom `courses.zoom` belum dipakai.

---

## 1. [AGENT] Cek prasyarat

```bash
cd /home/fazli/safinah1/web-kki27
git status                 # harus bersih
node -v                    # minimal v22.18 (menjalankan .mts langsung); disarankan v24
git check-ignore .env.sim  # harus mencetak ".env.sim" (file tidak ikut commit)
```

`.env.sim` harus berisi dua baris: `SUPABASE_URL=...` dan `SUPABASE_SECRET_KEY=sb_secret_...`. Jangan menampilkan isinya.

Bila Node di bawah v22.18, berhenti dan minta manusia merapikan PATH supaya Node 24 dari nvm yang dipakai.

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

Cek: tidak ada file lain dari Tahap 0 yang terhapus, dan `.env.sim` tidak muncul di `git status`.

Tambahkan script ini ke `package.json`:

```json
"sim": "node --env-file=.env.sim scripts/simulate-boat.mts --follow"
```

## 5. [AGENT] Perbarui dokumen

1. `AGENTS.md`, tabel stack: ganti baris "Leaflet / react-leaflet (mulai Tahap 1)" menjadi `Leaflet (tanpa react-leaflet) | 1.9.4`, ganti baris Zustand menjadi `Zustand | 5.1.0`, dan tambahkan baris `next-themes (tema terang/gelap) | 0.4.6`.
2. `AGENTS.md`, bagian Keamanan poin 2: ganti `scripts/simulate-boat.ts` menjadi `scripts/simulate-boat.mts`.
3. `docs/ARCHITECTURE.md`, struktur folder:
   - `components/map/` tambahkan `LeafletMap`;
   - `components/status/` tambahkan `RunInfo`;
   - `lib/live/` tambahkan `useNow.ts`;
   - `scripts/simulate-boat.ts` menjadi `scripts/simulate-boat.mts`.
4. `docs/DATA_CONTRACT.md`, bagian "Antrean dan retry", tambahkan satu poin:
   "Setelah kiriman berhasil, hapus sampel dari antrean berdasarkan objeknya, bukan dengan `pop()`. Selama menunggu jaringan, sampel baru bisa sudah masuk ke ujung antrean, dan `pop()` akan membuang sampel yang belum terkirim. Bug ini ditemukan saat menguji simulator. Lihat `flush()` di `scripts/simulate-boat.mts`."
5. `README.md`: tambahkan `npm run sim` ke tabel perintah, dengan peringatan "jangan dijalankan saat lomba".

## 6. [AGENT] Cek kode

```bash
npm run format
npm run check
```

Bila typecheck gagal di file paket, bandingkan dengan `src/types/database.types.ts` milik project. Kode paket diuji dengan tipe yang meniru `supabase gen types`; selisih kecil (misalnya nama helper `Tables`) cukup disesuaikan di `src/lib/queries.ts`. Jangan mengubah logika store atau provider tanpa melapor.

## 7. [MANUSIA + AGENT] Uji dengan Supabase asli

Terminal 1:

```bash
npm run dev
```

Terminal 2 (pertama kali, isi koordinat contoh dan buoy untuk lintasan A):

```bash
npm run sim -- --seed-course
```

Simulator berjalan sekitar 95 detik lalu menutup run. Pilihan lain: `--lintasan B`, `--outage 40:30` (internet "putus" di detik 40 selama 30 detik), `--center -7.77,110.37` (titik pusat lain).

Buka http://localhost:3000 dan cek satu per satu:

- [ ] Kanan atas: **Boat: Online**, **Feed: Live** (bukan Polling), "Last data" 0–2 s.
- [ ] Peta menyesuaikan ke grid 6 × 6; terlihat 10 pasang buoy (merah di kanan, hijau di kiri), kotak imaging biru dan hijau, Start, dan Finish.
- [ ] Ikon kapal bergerak halus dan berputar sesuai arah; jejak oranye bertambah; garis putus-putus menunjukkan COG.
- [ ] Panel Mission: fase berubah dari Pending ke Active ke Done, "Gate n / 10" bertambah, timer berjalan sejak Start.
- [ ] Panel Imaging: foto UL (kotak biru) lalu SR (kotak hijau) muncul tanpa reload; klik foto membuka ukuran penuh.
- [ ] Setelah selesai: semua fase Done, badge **Run ended**.
- [ ] Mode gelap bisa dinyalakan dan dimatikan.

Uji ketahanan (inilah kriteria selesai Tahap 1):

- [ ] `npm run sim -- --outage 40:30`: saat "putus", badge berubah ke Delayed lalu Offline. Setelah pulih, kembali Online dan jejak terisi tanpa garis lurus yang melompat.
- [ ] Chrome DevTools > Network > throttling "3G": halaman tetap terbuka dalam beberapa detik dan data terus bergerak.
- [ ] Buka di HP, kunci layar sekitar 1 menit saat simulator berjalan, lalu buka lagi: data mengejar sendiri tanpa reload.
- [ ] Jendela Chrome 1920×1080 (layar TV panitia): seluruh dashboard terlihat tanpa scroll.
- [ ] `npm run sim -- --lintasan B --seed-course`: label "Course B"; slot foto besar menjadi SL dan UR.

Cek celah data di SQL Editor (hasilnya harus 0):

```sql
select count(*) as celah
from (
  select t - lag(t) over (order by t) as jarak
  from telemetry
  where run_id = (select live_run_id from app_state)
) s
where jarak > interval '1.5 s';
```

Tulis "lanjut" ke agent beserta hasil cek, termasuk yang gagal.

## 8. [AGENT] Laporan dan commit

Laporkan hasil langkah 6 dan 7, termasuk hal yang berbeda dari dokumen ini. Commit hanya bila manusia memintanya, misalnya `git commit -m "Tahap 1: dashboard live, simulator, store, peta"`.

## 9. [MANUSIA] Bersihkan data uji (bila perlu)

Run simulator ditandai `source = 'sim'` dan tidak pernah diikuti dashboard secara otomatis, kecuali lewat `--follow` (sudah termasuk di `npm run sim`). Sebelum dashboard dipakai untuk uji kapal sungguhan:

```sql
-- berhenti mengikuti run simulator
update app_state set live_run_id = null;

-- hapus run simulator beserta telemetri, event, dan baris fotonya
delete from runs where source = 'sim';

-- opsional: kosongkan lintasan contoh dari --seed-course
delete from course_items where lintasan in ('A', 'B');
update courses set center_lat = null, center_lon = null;
```

File foto simulator di Storage tidak ikut terhapus oleh SQL. Hapus folder `runs/` yang sesuai lewat Supabase Dashboard > Storage > `captures`. Penghapusan otomatis dibuat di halaman admin (Tahap 3).

---

## Catatan desain (untuk dibaca tim)

- **Satu sumber data.** Semua data live masuk ke `useLive`. Komponen hanya membaca lewat selector; hanya `LiveProvider` yang membuka Realtime. Dua channel per tab: `config` dan `run:<id>`.
- **Peta tidak dirender ulang tiap detik.** `TrailLayer` dan `BoatMarker` membaca store lewat `useLive.subscribe` dan memperbarui objek Leaflet langsung. Jejak digambar ulang penuh hanya bila `trailRevision` berubah (run baru atau data terlambat yang harus disisipkan).
- **Duplikat dibuang berdasarkan `t`.** Waktu sampel unik per run di database, jadi data yang datang dua kali (snapshot dan catch-up, atau retry kapal) tidak menggandakan jejak.
- **Catch-up dan polling.** Setiap Realtime tersambung (lagi) atau tab aktif lagi, provider mengambil baris dengan `id` lebih besar dari yang sudah ada. Bila Realtime putus lebih dari 10 detik, catch-up dijalankan tiap 3 detik dan badge menampilkan "Polling".
- **Umur data dari jam browser.** Setelah data live pertama tiba, "Last data" dihitung dari saat data tiba di browser, sehingga jam HP penonton yang meleset tidak berpengaruh.
- **Simulator adalah contoh kontrak.** Header, kunci idempoten, urutan foto (file dulu, baris kemudian), antrean "terbaru dulu, backlog menyusul", dan cara menghapus dari antrean di `scripts/simulate-boat.mts` sama dengan yang diharapkan dari `web_bridge` dan `capture_uploader`.
