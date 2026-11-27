# Tahap 1B — Tampilan mengikuti dashboard KKI 2026

**Tujuan:** tampilan `/` kembali ke gaya dashboard 2026 (acuan: `docs/ui-reference-2026.md`), dengan dua penambahan: **riwayat foto** dan **3 panel kamera**. Lapisan data Tahap 1 tidak diubah: `src/lib/live/*` dan `src/lib/queries.ts` hanya disentuh untuk kolom foto baru.

**Bukan bagian tahap ini:** halaman admin (Tahap 3), mode edit peta, Set Origin, drag marker.

Label: **[AGENT]** dikerjakan agent, **[MANUSIA]** agent berhenti dan menunggu "lanjut".

## 1. [MANUSIA] Terapkan migrasi

File `supabase/migrations/20261127120000_capture_surface_pair.sql` (dari paket) menambah kolom `surface_path` dan `surface_thumb_path` di `captures`. Kolom ini menyimpan foto permukaan yang diambil bersamaan dengan foto underwater. Foto surface tidak punya pasangan, dan database menolak bila diisi. Migrasi ini sudah diuji di Postgres lokal.

```bash
npm run db:push
```

## 2. [AGENT] Tipe dan dependensi

```bash
npm run db:types
npm install --save-exact lucide-react@latest   # catat versinya di tabel stack AGENTS.md
```

Salin aset dari repo 2026 ke `public/` bila tersedia: `logo.png`, `kapalasli3.png` (ikon kapal). Bila tidak ada, minta ke manusia; jangan membuat gambar pengganti.

## 3. [AGENT] Gaya visual (ikuti `docs/ui-reference-2026.md`)

- Token warna di bagian 2 dokumen acuan dipakai apa adanya di `globals.css`: teal gelap, aksen lime `#d9f21a`, panel bersudut tajam dengan garis ganda, kelas panel dan header panel standar.
- Tema: default gelap; tema terang lewat `next-themes` (tetap dipakai, pilihan tersimpan). Di tema terang, aksen memakai `#15803d` dan teks di atas aksen berwarna putih. Kombinasi ini lolos kontras AA; kombinasi 2026 (`#16a34a` dengan putih) tidak.
- Font: Inter lewat `next/font/google` (subset latin, `display: swap`). Ubah aturan "font sistem" di `AGENTS.md` menjadi "Inter (self-hosted oleh next/font), tanpa web font lain".
- Ikon: lucide-react, semua tombol ikon diberi `aria-label`.
- Teks UI tetap Bahasa Inggris (keputusan proyek). Istilah lomba dan format waktu ikut 2026: "Lintasan A/B", jam `HH.MM.SS WIB` dihitung dengan `timeZone: "Asia/Jakarta"` (bukan zona browser), tanggal `27 November 2026`.

## 4. [AGENT] Layout

Sama dengan bagian 4 dokumen acuan:

- **≥ 1280px:** satu layar tanpa scroll, 3 kolom `340px | flex-1 | 380px`. Kiri: Navigation Data + Mission Log. Tengah: Real-Time Map. Kanan: Camera Feeds (3 panel).
- **< 1280px:** urutan Peta → Navigation + Mission → Kamera, tanpa scroll horizontal.
- Header: logo + "Safinah One", lalu di kanan: status koneksi (pakai `ConnectionBadge` yang ada, gayanya disesuaikan), toggle tema, jam WIB dua baris.
- Footer: `Copyright © {tahun} Safinah One Gamantaray Universitas Gadjah Mada`.

## 5. [AGENT] Komponen

Ganti tampilan komponen Tahap 1 (sumber data tetap `useLive`). Hapus komponen lama yang tidak dipakai lagi; jangan membuat versi kedua.

**Navigation Data** (`components/telemetry/`)
- Grid 2×2: Latitude, Longitude, SoG, CoG; ditambah Heading (wajib menurut aturan lomba) dan baris Battery (% · V · A).
- Lat/Lon memakai **6 desimal**. 4 desimal seperti 2026 hanya presisi ±11 m, terlalu kasar untuk area 30 m.
- SoG `1.2 m/s`, CoG/Heading `045°`.
- Warna ambang baterai: normal / ≤ 30% warning / ≤ 15% kritis, ditambah teks, jangan hanya warna.
- Baris kecil "Updated 2 s ago" dari `DataAge`.

**Mission Log** (`components/mission/`)
- 7 item bernomor 01–07, urutan dari `app_state.phase_order`.
- Item aktif: latar lime. Item selesai: ikon centang + jam selesai. Pending: normal, **tidak diredupkan**.
- Pojok kanan header menampilkan `RunTimer` (pengganti "Tahap 1" yang dulu di-hardcode).
- Detail gerbang "Gate 4 / 10" tetap ada.

**Real-Time Map** (`components/map/`)
- Header panel: segmented "Lintasan A | Lintasan B". Pilihan ini hanya mengganti tampilan lokal dan default-nya lintasan run yang diikuti.
- Overlay kanan atas: badge lintasan + tombol fullscreen.
- Overlay kiri bawah, bergaya gelap: **Kapal** (zoom ke kapal), **Arena** (fit ke grid, pengganti tombol Recenter), **Reset** (bersihkan jejak di layar saja, data tidak dihapus).
- Grid berlabel di tengah sel: huruf = baris dari bawah (A), angka = kolom dari kiri (1), contoh `C3`. Ukuran grid tetap dari `courses` (default 6 × 6 @ 5 m).
- Marker cukup besar untuk proyektor: buoy 12–14 px, kotak imaging 1,5 m. Tambahkan legenda kecil, skala, dan atribusi OSM (wajib).
- Ikon kapal memakai `kapalasli3.png`, diputar sesuai **heading**. Jejak garis lime atau merah putus-putus yang tetap terlihat di tile terang.
- Jangan mereset rotasi atau posisi peta saat data baru masuk.

**Camera Feeds** (`components/captures/`): **3 panel**

| Panel | Isi |
| --- | --- |
| Surface Left (SL) | Foto terbaru SL + strip riwayat |
| Surface Right (SR) | Foto terbaru SR + strip riwayat |
| Underwater | Foto terbaru slot underwater lintasan (A: UL, B: UR; tanpa run: UL/UR terbaru) **beserta foto permukaannya** (`surface_path`) sebagai gambar kecil di pojok (picture-in-picture) + strip riwayat |

- Panel yang dipakai lintasan aktif ditandai border lime; panel lain tetap tampil.
- Setiap panel menampilkan kode slot, label, dan timestamp foto (`14.05.33 WIB`). Empty state: "No photo yet". Underwater tanpa pasangan: "No surface photo".
- **Riwayat:** strip thumbnail horizontal (terbaru di kiri, maksimal 10 terlihat, bisa digeser), foto yang di-`hidden` tidak tampil. Foto baru otomatis menjadi foto utama.
- Klik foto membuka lightbox:
  - `role="dialog"`, `aria-modal`, tutup dengan ESC atau klik backdrop;
  - fokus terkunci di dalam dialog;
  - tombol ←/→ untuk berpindah dalam riwayat slot itu;
  - untuk underwater, foto permukaan tampil berdampingan;
  - menampilkan waktu, posisi, SoG/CoG saat foto diambil, dan kotak deteksi bila ada;
  - bila foto baru masuk saat lightbox terbuka, posisi foto yang sedang dilihat tidak berpindah.
- Thumbnail memakai `thumb_path` / `surface_thumb_path`; foto penuh hanya dimuat di lightbox.

**Lainnya**
- `PanelBoundary` tetap membungkus setiap panel, digayakan sesuai tema.
- Halaman 404 bergaya 2026 (ikon kapal mengambang).
- Hapus `ThemeToggle` dan `RunInfo` bila sudah tergantikan header baru. Info run (label, Official, Simulator) dipindah ke header panel peta.

## 6. [AGENT] Dokumen

- `docs/DATA_CONTRACT.md`, bagian Foto: untuk slot underwater, Pi juga mengunggah foto permukaan yang diambil pada saat yang sama, dengan nama `..._surface.jpg` dan `..._surface_thumb.jpg` di folder yang sama. Kolom `surface_path` / `surface_thumb_path` diisi; slot surface membiarkannya null.
- `docs/ARCHITECTURE.md`: perbarui daftar komponen dan tabel halaman sesuai perubahan.

## 7. [AGENT] Cek

```bash
npm run format
npm run check
```

**[MANUSIA]** Buka di layar 1920×1080, laptop 1366×768, dan HP:

- [ ] Tampilan sesuai acuan 2026; ≥ 1280px muat satu layar.
- [ ] Data live dan riwayat foto bertambah tanpa reload.
- [ ] Lightbox bisa ditutup dengan ESC, ←/→ berpindah foto, dan Tab tidak keluar dari dialog.
- [ ] Tema terang terbaca jelas (item aktif Mission Log tidak pudar).
- [ ] Peta: label grid, legenda, skala, atribusi, dan tombol Kapal/Arena/Reset/Fullscreen berfungsi.

Commit hanya bila manusia meminta.
