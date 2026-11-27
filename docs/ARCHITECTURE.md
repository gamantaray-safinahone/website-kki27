# Arsitektur website monitoring

Satu aplikasi Next.js dengan area publik dan admin. Semua data live masuk lewat satu `LiveProvider` ke satu store, dengan paling banyak dua channel Realtime per tab.

## Alur data

```text
 KAPAL (internet lewat router 4G)
 ┌──────────────────────────────┐   run_id (ROS 2)   ┌──────────────────────────────┐
 │ Intel NUC 12                 │ ─────────────────▶ │ Raspberry Pi 4B              │
 │ Pixhawk 6C → MAVROS          │                    │ 4 kamera: SL, SR, UL, UR     │
 │ state machine misi           │                    │ capture_uploader             │
 │ web_bridge                   │                    │ antrean foto di SD card      │
 └──────────────┬───────────────┘                    └──────────────┬───────────────┘
                │ REST, secret key "nuc"                            │ Storage + REST, key "pi"
                │ run, telemetri 1 Hz, event                        │ foto, lalu baris captures
                ▼                                                   ▼
 SUPABASE (Singapore, paket gratis)
 ┌──────────────────┐   ┌──────────────────┐   ┌──────────────────┐   ┌──────────────────┐
 │ Postgres + RLS   │ ─▶│ Realtime         │   │ Storage          │   │ Auth             │
 │ publik: SELECT   │   │ postgres_changes │   │ bucket captures  │   │ login admin      │
 └────────┬─────────┘   └────────┬─────────┘   └────────┬─────────┘   └────────┬─────────┘
          │ REST: snapshot,      │ 2 channel per tab    │ URL publik           │ sesi login
          │ catch-up, polling    │                      │                      │
          ▼                      ▼                      ▼                      ▼
 BROWSER
   LiveProvider ──▶ store useLive (Zustand) ──▶ komponen        halaman admin (tulis lewat RLS)
```

NUC dan Pi hanya menulis, browser publik hanya membaca, dan admin menulis lewat sesi login yang dijaga RLS. Website tidak pernah mengirim perintah ke kapal.

## Halaman

| Route | Isi | Akses |
| --- | --- | --- |
| `/` | Dashboard live untuk publik sekaligus layar panitia (gaya dashboard KKI 2026, acuan `docs/ui-reference-2026.md`): peta, posisi/SoG/CoG/heading/baterai, 7 fase dengan timer run, 3 panel kamera dengan riwayat foto, indikator koneksi | Publik |
| `/runs` | Daftar run: tanggal, lintasan, label, resmi, durasi | Publik |
| `/runs/[runId]` | Replay: slider waktu, kecepatan putar 1–10×, grafik SOG, titik event di peta dan grafik | Publik |
| `/runs/[runId]/photos` | Galeri per slot: waktu, posisi, kotak deteksi | Publik |
| `/admin/login` | Login email + password (Supabase Auth) | Publik |
| `/admin` | Run live: label, tandai resmi, akhiri; lintasan aktif; urutan fase | Admin |
| `/admin/course` | Editor lintasan A/B: isi koordinat pusat, geser buoy/waypoint, tombol "move to boat position" | Admin |
| `/admin/runs` | Hapus run beserta fotonya, sembunyikan foto gagal | Admin |

## Struktur folder

```text
web-kki27/
├─ src/
│  ├─ app/
│  │  ├─ layout.tsx            # tema (next-themes), font Inter
│  │  ├─ error.tsx, not-found.tsx
│  │  ├─ page.tsx              # dashboard live (publik + layar panitia)
│  │  ├─ runs/page.tsx
│  │  ├─ runs/[runId]/page.tsx          # replay
│  │  ├─ runs/[runId]/photos/page.tsx   # galeri
│  │  └─ admin/
│  │     ├─ login/page.tsx
│  │     └─ (protected)/      # layout.tsx cek login + app_admins
│  │        ├─ page.tsx
│  │        ├─ course/page.tsx
│  │        └─ runs/page.tsx
│  ├─ components/
│  │  ├─ map/        MissionMap, LeafletMap, BoatMarker, TrailLayer, CourseLayer, GridLayer,
│  │  │              MapControls, MapLegend
│  │  ├─ telemetry/  TelemetryPanel, StatTile
│  │  ├─ mission/    PhaseList, RunTimer
│  │  ├─ captures/   LatestCaptures, CaptureCard, CaptureStrip, CaptureLightbox,
│  │  │              DetectionOverlay, CaptureGallery
│  │  ├─ status/     ConnectionBadge, DataAge, RunInfo, WibClock
│  │  ├─ replay/     ReplayPlayer, TimeSlider, SogChart
│  │  ├─ admin/      LoginForm, RunControls, CourseEditor
│  │  └─ ui/         Card, DashboardHeader, DashboardFooter, ThemeToggle, PanelBoundary,
│  │                 Badge, Button
│  ├─ lib/
│  │  ├─ supabase/   client.ts, server.ts, proxy.ts
│  │  ├─ live/       store.ts, LiveProvider.tsx, channels.ts, catchup.ts, useNow.ts
│  │  ├─ env.ts      # validasi variabel env publik
│  │  ├─ queries.ts  # semua query Supabase di satu file
│  │  ├─ courseView.ts  # lintasan yang sedang dilihat (peta + kamera), state tampilan lokal
│  │  ├─ mission.ts  # daftar fase, label UI (Inggris), warna status
│  │  ├─ geo.ts      # grid, offset meter ke lat/lon, sudut
│  │  └─ format.ts   # satuan, jam WIB, "12 s ago"
│  ├─ types/database.types.ts   # hasil npm run db:types, jangan diedit
│  └─ proxy.ts      # Next.js 16: pengganti middleware.ts (Tahap 3)
├─ supabase/        migrations/, config.jsonc, snippets/uji-manual.sql (uji dashboard lewat SQL Editor)
├─ docs/            ARCHITECTURE.md, DATA_CONTRACT.md, tasks/
├─ .github/workflows/  ci.yml, keepalive.yml
├─ .env.example     # hanya URL dan publishable key
└─ README.md
```

## Aturan data live

1. Satu Supabase client di browser dan satu store Zustand `useLive`. Komponen membaca lewat selector; tidak ada komponen yang subscribe sendiri.
2. `LiveProvider` membuka dua channel: `config` (app_state, courses, course_items, runs) dan `run:<id>` (insert telemetry, mission_events, captures dengan filter `run_id=eq.<id>`, plus update captures).
3. Saat `app_state.live_run_id` berubah, provider menutup channel run lama, memuat snapshot run baru (`get_run_series`, event, foto terakhir per slot), lalu membuka channel baru. Retry di lapangan langsung tampil sebagai run baru.
4. Catch-up: setiap channel kembali `SUBSCRIBED` dan setiap tab kembali terlihat, ambil baris dengan `id` lebih besar dari yang sudah ada. Gabung berdasarkan `id`, urutkan berdasarkan `t`, karena backlog kapal bisa tiba terlambat.
5. Fallback: bila Realtime tidak tersambung lebih dari 10 detik, catch-up dijalankan tiap 3 detik sampai pulih. Badge menampilkan "Polling". Saat tidak ada run yang diikuti, status Feed mengikuti channel `config` (Live atau Reconnecting).
6. Umur data dihitung dari saat sampel terakhir tiba di browser, supaya tidak terpengaruh jam perangkat penonton yang meleset. Label di UI: Online di bawah 5 detik, Delayed 5–15 detik, Offline di atas 15 detik.
7. Peta diperbarui lewat ref Leaflet (posisi, rotasi ikon, `addLatLng`), bukan render ulang React per sampel. Marker digeser halus selama 1 detik agar 1 Hz terlihat mulus.
8. Status fase hanya `pending`, `active`, `done`. Fase yang belum punya event ditampilkan sebagai pending. Urutan fase mengikuti `app_state.phase_order`.

## Komponen utama

- Header (`DashboardHeader`): logo + "Safinah One", lalu `ConnectionBadge` (status kapal dan Feed), tombol tema, dan `WibClock` (jam `HH.MM.SS WIB` dihitung dengan zona Asia/Jakarta, bukan zona perangkat).
- `MissionMap` (panel Real-Time Map) dimuat hanya di client. Header: info run (`RunInfo`) dan pilihan "Lintasan A | Lintasan B" yang hanya mengganti tampilan lokal di tab itu: peta dan Camera Feeds ikut berganti (`useViewLintasan` di `lib/courseView.ts`; default: lintasan run yang diikuti, lalu `app_state.active_lintasan`). Overlay: badge lintasan + fullscreen di kanan atas, `MapControls` (Kapal, Arena, Reset) di kiri bawah, `MapLegend`, skala, dan atribusi OSM. Isinya tile OSM dengan pilihan citra satelit, overlay OpenSeaMap, grid dari konfigurasi lintasan (default 6 × 6 sel @ 5 m) berlabel di tengah sel (huruf = baris dari bawah, angka = kolom dari kiri, misalnya `C3`), buoy 14 px, kotak imaging 1,5 m, jejak merah putus-putus, dan ikon kapal `kapalasli.png` yang berputar sesuai heading plus garis COG. Reset hanya membersihkan jejak di layar; data tidak dihapus. Peta tidak digeser saat data baru masuk, hanya saat geometri grid berubah. Selama koordinat lintasan kosong, peta berpusat pada posisi kapal.
- `TelemetryPanel` (Navigation Data) menampilkan Latitude/Longitude 6 desimal, SoG, CoG, heading, baterai (% · V · A, ambang 30 % dan 15 % ditandai warna dan teks), dan umur data (`DataAge`).
- `PhaseList` (Mission Log) menampilkan 7 fase bernomor 01–07 sesuai `app_state.phase_order`: aktif berlatar lime, selesai diberi centang dan jam, pending tidak diredupkan, plus detail (misalnya Gate 4 / 10). `RunTimer` di pojok header menghitung sejak fase start aktif.
- `LatestCaptures` (Camera Feeds) menampilkan 3 panel untuk lintasan yang sedang dilihat, dari atas: slot surface lintasan, slot surface lainnya, lalu slot underwater lintasan dengan foto permukaannya sebagai gambar kecil di pojok. Lintasan A = SR, SL, UL; lintasan B = SL, SR, UR. Urutan diturunkan dari awalan S/U di `courses.imaging_slots`, jadi urutan isi kolom itu tidak berpengaruh. Panel milik lintasan (dua slot di `imaging_slots`) diberi border lime. Setiap panel punya strip riwayat (thumbnail, terbaru di kiri); klik membuka `CaptureLightbox` (dialog, ESC, fokus terkunci, ←/→, foto permukaan berdampingan, posisi/SoG/CoG, kotak deteksi).
- `PanelBoundary` membungkus tiap panel, jadi satu panel error tidak mematikan peta.

## Ringan dan aman

- uPlot dan editor admin dimuat hanya di halamannya. Galeri memakai thumbnail 320 px dengan lazy loading; foto penuh dibuka saat diklik.
- Jejak 1200 titik dari `get_run_series` sekitar 65 KB sebelum gzip. Grid, buoy, dan jejak tetap tergambar walau tile peta gagal dimuat.
- Font Inter di-host sendiri oleh next/font (browser tidak menghubungi Google), tanpa web font lain.
- Env web hanya berisi URL dan publishable key. Tidak ada secret key di laptop tim web.
- `proxy.ts` menyegarkan sesi dan mengarahkan `/admin` ke login. Layout admin mengecek `app_admins` di server, dan RLS tetap penjaga terakhir. Tidak ada endpoint API buatan sendiri.
- Tema gelap (default) dan terang, pilihan disimpan di browser. Di layar ≥ 1280 px tiga kolom `340px | peta | 380px` yang muat satu layar tanpa scroll: spasi padat di layar pendek (laptop 1366 × 768) dan longgar di layar tinggi (variant `tall:`, tinggi ≥ 50rem). Di bawah 1280 px panel ditumpuk: peta, Navigation + Mission Log, lalu kamera. Semua teks UI berbahasa Inggris, kecuali istilah lomba (Lintasan A/B, Kapal/Arena/Reset, WIB).

## Kuota Supabase gratis yang perlu dijaga

| Kuota | Batas | Dampak ke desain |
| --- | --- | --- |
| Pesan Realtime per detik | 100 (dihitung per penonton) | Telemetri 1 Hz, cukup untuk sekitar 90 penonton bersamaan |
| Koneksi Realtime bersamaan | 200 | Dua channel per tab, satu koneksi WebSocket |
| Pesan Realtime per bulan | 2 juta | Satu run 20 menit dengan 60 penonton ≈ 72 ribu pesan |
| Ukuran database | 500 MB | Telemetri 1 Hz ≈ 1 MB per jam kapal berjalan |
| Storage | 1 GB | Foto web + thumbnail ≈ 300 KB per foto; hapus run uji yang tidak perlu |
| Egress | 5 GB + 5 GB cached per bulan | Thumbnail dulu; live cam hanya bila muat |
| Jeda otomatis | Project dijeda bila sepi seminggu | `keepalive.yml` membaca satu baris tiap 6 jam |
