Blok 1 — Dokumentasi Referensi UI/UX

# Referensi UI/UX: Dashboard Monitoring ASV Safinah One (KKI 2026)

Dokumen ini merekam tampilan dan interaksi website monitoring KKI 2026 (dashboard v2)
sebagai acuan untuk website KKI 2027. Sumber: kode `src/components/dashboard-v2/*`,
`src/app/globals.css`, `src/app/layout.tsx`, dan desain Figma awal `FINAL.png`.

---

## 0. Konteks pemakaian

- **Pengguna utama:** juri, penonton, dan tim (mode *viewer*), serta operator tim (mode *admin*).
- **Perangkat:** laptop atau monitor ground station, proyektor di area lomba, dan HP.
- **Sifat:** dashboard *single-screen* real-time. Di layar ≥1280px seluruh dashboard muat
  satu layar tanpa scroll. Di layar kecil panel ditumpuk dan halaman bisa di-scroll.
- **Route:** `/` untuk viewer (read-only) dan `/admin-safinah-secret` untuk admin (bisa edit peta).
  UI keduanya sama, hanya kontrol admin yang muncul atau hilang.

## 1. Prinsip visual

1. Tema **gelap maritim**: teal sangat gelap, aksen **lime neon** untuk elemen aktif.
2. Panel **bersudut tajam** (tanpa rounded) dengan efek garis ganda (border + inset shadow), bergaya instrumen atau HUD.
3. Hierarki sederhana: label kecil berwarna sage, nilai besar berwarna kapur (putih kehijauan).
4. Lime hanya dipakai untuk: ikon judul panel, item aktif, tombol lintasan aktif, badge, dan border kartu terpilih.
5. Peta memakai latar terang (tile OSM + grid tipis) supaya kontras dengan chrome yang gelap.

## 2. Design tokens (salin apa adanya)

```css
/* globals.css — Tailwind v4 */
@import "tailwindcss";

:root {                       /* DARK (default) */
  --background: #03161a;
  --foreground: #d8e6dd;
  --hijau-tua: #1a3a38;
  --teal-gelap: #061e22;
  --midnight-hitam: #01090b;
  --sage-dingin: #6b8478;     /* label, teks sekunder */
  --kapur-muda: #d8e6dd;      /* teks utama / nilai */
  --lime-neon: #d9f21a;       /* aksen */
  --surface: rgba(6, 30, 34, 0.9);
  --surface-strong: rgba(1, 9, 11, 0.96);  /* latar panel */
  --border: rgba(107, 132, 120, 0.28);
}

.light-mode {                 /* LIGHT (toggle, class di <body>) */
  --background: #f1f5f9;
  --foreground: #0f172a;
  --hijau-tua: #e2e8f0;
  --teal-gelap: #f8fafc;
  --midnight-hitam: #ffffff;
  --sage-dingin: #475569;
  --kapur-muda: #0f172a;
  --lime-neon: #16a34a;       /* aksen jadi hijau */
  --surface: #ffffff;
  --surface-strong: #ffffff;
  --border: rgba(15, 23, 42, 0.1);
}

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-hijau-tua: var(--hijau-tua);
  --color-teal-gelap: var(--teal-gelap);
  --color-midnight-hitam: var(--midnight-hitam);
  --color-sage-dingin: var(--sage-dingin);
  --color-kapur-muda: var(--kapur-muda);
  --color-lime-neon: var(--lime-neon);
  --color-surface: var(--surface);
  --color-surface-strong: var(--surface-strong);
  --color-border: var(--border);
  --font-sans: var(--font-inter);
  --font-mono: var(--font-geist-mono);
}

body {
  background:
    radial-gradient(circle at top left, rgba(26,58,56,0.8), transparent 32%),
    radial-gradient(circle at top right, rgba(217,242,26,0.12), transparent 20%),
    linear-gradient(180deg, var(--teal-gelap) 0%, var(--background) 48%, var(--midnight-hitam) 100%);
  color: var(--foreground);
  font-family: var(--font-sans);
  min-height: 100vh;
}
body.light-mode { background: var(--background); }

::selection { background: rgba(217,242,26,0.25); color: var(--kapur-muda); }
/* Scrollbar tipis 5px, thumb sage 40%, hover lime */
::-webkit-scrollbar { width: 5px; height: 5px; }
::-webkit-scrollbar-thumb { background: rgba(107,132,120,0.4); border-radius: 10px; }
::-webkit-scrollbar-thumb:hover { background: var(--lime-neon); }
* { scrollbar-width: thin; scrollbar-color: rgba(107,132,120,0.4) transparent; }
```

**Kelas panel standar** (dipakai semua panel):
`border border-border bg-surface-strong shadow-[0_0_0_1px_var(--border)_inset]`

**Kelas header panel standar:**
`flex items-center gap-2.5 border-b border-border px-5 py-4 text-[1.05rem] font-medium tracking-wide text-kapur-muda`
+ ikon lucide `h-4 w-4 text-lime-neon`.

## 3. Tipografi

| Peran | Font / kelas |
|---|---|
| Font utama | **Inter** (`next/font/google`, variabel `--font-inter`) |
| Monospace | **Geist Mono** (`--font-geist-mono`), saat ini hanya di halaman 404 |
| Judul brand | `text-2xl font-bold tracking-tight`, gradient `from-kapur-muda to-sage-dingin` (bg-clip-text) |
| Judul panel | `text-[1.05rem] font-medium tracking-wide` |
| Label metrik | `text-sm font-semibold text-sage-dingin` |
| Nilai metrik | `text-2xl tracking-tight text-kapur-muda` |
| Item Mission Log | `text-lg`, label `font-medium`, nomor `text-sm opacity-70` |
| Badge di peta | `text-xs font-bold tracking-widest` |
| Judul kartu kamera | `text-sm font-semibold tracking-[0.16em]` |

## 4. Layout

Desktop (≥ 1280px / `xl`), satu layar penuh tanpa scroll:

```
┌───────────────────────────────────────────────────────────────────────────┐
│ [logo] Safinah One                         [☀/☾] [role*]    14.05.33 WIB    │
│                                                             27 November 2026│
├───────────────┬─────────────────────────────────────────────┬───────────────┤
│ Navigation    │ Real-Time Map   [Set Origin*] │ [A] [B]      │ Camera Feeds  │
│ Data          │ ┌─────────────────────────────────────────┐ │ (Lintasan A)  │
│ Lat  │ Lon    │ │                     [Lintasan A] [⛶]    │ │ ┌───────────┐ │
│ SoG  │ CoG    │ │       grid 5×5 + buoy + kapal + jejak    │ │ │  foto 1   │ │
│ Battery %  V  │ │                                          │ │ └───────────┘ │
├───────────────┤ │ ┌───────┐                                │ │ ┌───────────┐ │
│ Mission Log   │ │ │ Kapal │                                │ │ │  foto 2   │ │
│ ● Prepare ███ │ │ │ Arena │                                │ │ └───────────┘ │
│ ● Start       │ │ │ Reset │                                │ │               │
│ ● ...         │ │ └───────┘                                │ │               │
├───────────────┴─────────────────────────────────────────────┴───────────────┤
│        Copyright © {tahun} Safinah One Gamantaray Universitas Gadjah Mada     │
└───────────────────────────────────────────────────────────────────────────┘
     340px                         flex-1                          340px
 (* = hanya admin / bila tidak dikunci route)
```

- Wrapper: `max-w-[1920px] mx-auto px-5 sm:px-6 lg:px-7 pt-4 pb-5`. Pada `xl`: `h-screen w-screen overflow-hidden`.
│                                                             27 November 2026│
├───────────────┬─────────────────────────────────────────────┬───────────────┤
│ Navigation    │ Real-Time Map   [Set Origin*] │ [A] [B]      │ Camera Feeds  │
│ Data          │ ┌─────────────────────────────────────────┐ │ (Lintasan A)  │
│ Lat  │ Lon    │ │                     [Lintasan A] [⛶]    │ │ ┌───────────┐ │
│ SoG  │ CoG    │ │       grid 5×5 + buoy + kapal + jejak    │ │ │  foto 1   │ │
│ Battery %  V  │ │                                          │ │ └───────────┘ │
├───────────────┤ │ ┌───────┐                                │ │ ┌───────────┐ │
│ Mission Log   │ │ │ Kapal │                                │ │ │  foto 2   │ │
│ ● Prepare ███ │ │ │ Arena │                                │ │ └───────────┘ │
│ ● Start       │ │ │ Reset │                                │ │               │
│ ● ...         │ │ └───────┘                                │ │               │
├───────────────┴─────────────────────────────────────────────┴───────────────┤
│        Copyright © {tahun} Safinah One Gamantaray Universitas Gadjah Mada     │
└───────────────────────────────────────────────────────────────────────────┘
     340px                         flex-1                          340px
 (* = hanya admin / bila tidak dikunci route)
```

- Wrapper: `max-w-[1920px] mx-auto px-5 sm:px-6 lg:px-7 pt-4 pb-5`. Pada `xl`: `h-screen w-screen overflow-hidden`.
- Kolom: `flex-col xl:flex-row gap-5 pt-5`. Kiri dan kanan `xl:w-[340px] shrink-0`, tengah `flex-1`.
- **Urutan di mobile (< 1280px):** 1) Peta (`min-h-[500px]`), 2) Navigation + Mission Log, 3) Camera Feeds.
- Footer: `mt-5 border-t border-border pt-4 text-center text-sm font-medium tracking-wide text-sage-dingin`.

## 5. Spesifikasi komponen

### 5.1 Header (`dashboard-header.tsx`)
- Kiri: logo `/logo.png` (kotak 64×48, glow lime `drop-shadow-[0_0_8px_rgba(217,242,26,0.3)]`).
  Di light mode logo diberi filter `brightness-[0.25] sepia-[0.5] hue-rotate-[120deg]`. Di sebelahnya judul "Safinah One".
- Kanan:
  - Tombol tema: ikon Sun/Moon bertumpuk dengan animasi rotate/scale 500ms. Hover berwarna lime, dan Sun berputar 360° saat hover.
  - Tombol role (Shield/Eye + "Admin Mode"/"Viewer Mode"), **disembunyikan** jika role dikunci oleh route.
  - Jam: baris 1 berisi waktu `HH.MM.SS WIB` (`text-sm tracking-wider text-kapur-muda`),
    baris 2 berisi tanggal locale `id-ID` (`27 November 2026`, `text-xs text-sage-dingin`). Update setiap 1 detik.
- Border bawah `border-b border-border pb-4`.

### 5.2 Navigation Data (`navigation-panel-v2.tsx`)
- Header: ikon Compass + "Navigation Data".
- Grid 2×2 `divide-x divide-y divide-border`, sel `px-4 py-5`:
  - Latitude → `-6.8954°` (4 desimal + °)
  - Longitude → `107.1608°`
  - SoG → `1.2 m/s` (1 desimal)
  - CoG → `045°` (bulat, 3 digit dengan leading zero)
  - Data kosong ditampilkan sebagai `—`
- Baris baterai `col-span-2 bg-foreground/5`: kiri ikon Battery + "Battery Level" → `87%` (text-2xl),
  kanan ikon Zap + "Voltage" → `15.82 V` (text-xl).

### 5.3 Mission Log (`navigation-panel-v2.tsx`)
- Header: ikon ListChecks + "Mission Log". Di kanan ada teks "Tahap 1" (`text-sm font-semibold text-sage-dingin`).
- 7 item, `divide-y`, list bisa di-scroll:
  `01 Prepare · 02 Start · 03 Floating Ball Set · 04 Underwater Imaging · 05 Surface Imaging · 06 Docking · 07 Finish`
- Item `px-5 py-4 text-lg`: titik bulat 10px, label, dan nomor di kanan.
  - **Aktif:** `bg-lime-neon text-midnight-hitam`, titik `bg-midnight-hitam`.
  - **Tidak aktif:** `text-kapur-muda/92`, titik `bg-foreground/20`, hover `bg-foreground/5`.
  - **Viewer:** tombol disabled, `opacity-60 cursor-not-allowed`.
- Step aktif bergerak otomatis mengikuti status misi dari database (step tertinggi berstatus "proses"/"selesai").

### 5.4 Real-Time Map (`map-panel.tsx` + `MapLeaflet.tsx`)
- Header: ikon Map + "Real-Time Map". Kontrol di kanan:
  - Admin: tombol "Set Origin" (ikon Target, outline). Saat mode edit, muncul "Confirm" (`bg-green-600 text-white`) dan "Cancel" (outline + X).
  - Pemisah vertikal `w-px h-6 bg-foreground/10`.
  - Segmented button **Lintasan A / Lintasan B**: `border px-4 py-1.5`. Yang aktif `border-lime-neon bg-lime-neon text-midnight-hitam`.
- Area peta: `min-h-[400px]`, latar cadangan `#dfeccf`.
- Overlay kanan atas: badge lime "Lintasan A" (`h-8 text-xs font-bold tracking-widest`) dan tombol fullscreen
  putih 32×32 (`rounded-md shadow-lg`, ikon Maximize/Minimize).
- Overlay kiri bawah: kartu putih lebar 130px, isinya 3 baris h-8 (`text-xs font-semibold`) dengan divider:
  **Kapal** (ikon Navigation, zoom ke kapal) · **Arena** (ikon Target, kembali ke center lintasan) · **Reset** (ikon RefreshCw, hapus jejak).
- Isi peta:
  - Tile OpenStreetMap (native zoom 19, di-upscale sampai 22) + overlay OpenSeaMap. Zoom awal 21.
  - Grid 5×5, sel 5 m (total 25×25 m), garis `rgba(0,0,0,0.15)` 1px. Label sel di tengah sel
    (`text-[18px] font-black text-black/30`, contoh "C3"). Lintasan 2 memakai urutan huruf terbalik.
  - Marker: buoy merah/hijau 8px (PNG), buoy docking biru 10px (SVG), Start 34px,
    objek Image Surface/Underwater 10px, pin edit center 24px (`ping.svg`).
  - Kapal: `kapalasli3.png` 50×40, diputar sesuai CoG.
  - Jejak: polyline **merah putus-putus** (weight 1, dash `2,2`).
  - Popup marker: "Start", "Image Surface", "Image Underwater", "Pelampung {color}".
  - Admin bisa menggeser (drag) marker; perubahan langsung disimpan.

### 5.5 Camera Feeds (`camera-feeds-panel-v2.tsx`)
- Header: ikon Video + "Camera Feeds (Lintasan A)".
- Menampilkan 2 kartu sesuai lintasan: A = UL + SR, B = SL + UR. Kartu ditumpuk `gap-px bg-foreground/10`.
- Kartu (berupa tombol): `border px-4 py-3`. Yang terpilih `border-lime-neon`.
  Judul di atas (`text-sm font-semibold tracking-[0.16em] text-kapur-muda/80 mb-8`).
  Area gambar `min-h-56 rounded-md bg-black/20`, foto `object-cover opacity-90`.
- **Empty state:** ikon kamera 64px + label UPPERCASE `tracking-[0.24em]`.
- **Klik kartu** membuka modal fullscreen: `bg-black/80 backdrop-blur-sm`, gambar `max-h-[90vh] border-2 border-lime-neon rounded-lg`,
  tombol close bulat di kanan atas (`bg-black/50`). Klik backdrop juga menutup modal.
- Foto baru langsung menggantikan foto lama di slotnya (real-time).

### 5.6 Halaman 404 (`not-found.tsx`)
- `font-mono`. Ikon Ship 80px dengan animasi `float` 3s (naik-turun ±10px, rotasi ±3°).
- Teks "404" (text-6xl, border kanan) | "Halaman tidak ditemukan."
- Link "Kembali ke Beranda" bergaris bawah (`underline-offset-8`), hover lime.

## 6. Interaksi dan state

| Elemen | Viewer | Admin |
|---|---|---|
| Lintasan A/B | bisa pilih (lokal) | bisa pilih |
| Kapal / Arena / Reset / Fullscreen | ya | ya |
| Klik foto → modal | ya | ya |
| Drag marker waypoint/buoy | tidak | ya, langsung tersimpan |
| Set Origin lintasan | tidak | ya (Confirm/Cancel) |
| Klik step Mission Log | disabled | hanya mengubah tampilan lokal |
| Toggle tema | ya | ya |

- **Loading:** semua nilai menampilkan `—`, jam menampilkan "Memuat waktu...". Tidak ada skeleton.
- **Error:** tidak ada tampilan error; error hanya muncul di console.
- **Transisi:** `transition-colors` di hover; animasi ikon tema 500ms.

## 7. Microcopy dan format

- Bahasa campuran. Judul panel dalam bahasa Inggris (Navigation Data, Mission Log, Real-Time Map,
  Camera Feeds, Battery Level, Voltage, Set Origin, Confirm, Cancel). Istilah lomba dalam bahasa Indonesia
  (Lintasan A/B, Tahap 1, Kapal, Pelampung, WIB).
- Waktu `HH.MM.SS WIB` (pemisah titik), tanggal `DD NamaBulan YYYY` (locale id-ID).
- Nama slot kamera: SL = Surface Left, UL = Underwater Left, SR = Surface Right, UR = Underwater Right.

## 8. Tema terang
- Diaktifkan dengan class `light-mode` di `<body>`. Default gelap, pilihan tidak disimpan, dan tidak mengikuti setting sistem.
- Aksen berubah menjadi `#16a34a`. **Catatan:** `midnight-hitam` menjadi putih, sehingga item aktif tampil
  sebagai teks putih di atas hijau dengan kontras ±3.3:1 (tidak lolos WCAG AA untuk teks normal).

## 9. Aset (`public/`)
`logo.png` (logo tim), `kapalasli3.png` (ikon kapal), `merah.png`/`hijau.png` (buoy),
`bulat_biru.svg` (buoy docking), `start.png`, `atas.jpeg`/`bawah.png` (objek imaging),
`ping.svg` (pin edit center), `src/app/icon.png` (favicon). Ikon UI memakai **lucide-react**.

## 10. Desain Figma awal (`FINAL.png`) vs implementasi

| Aspek | Figma | Implementasi v2 |
|---|---|---|
| Header kanan | tanggal·jam satu baris + tombol "Refresh" | toggle tema + jam dua baris (tanpa Refresh) |
| Navigation Data | 4 metrik | 4 metrik + baris baterai |
| Urutan misi | ... Surface Imaging → Underwater Imaging ... | Underwater (04) → Surface (05) |
| Peta | badge lintasan kiri atas, jam kanan bawah | badge + fullscreen kanan atas, kontrol kiri bawah, tanpa jam |
| Label grid | huruf = baris (E atas → A bawah), angka = kolom | huruf = kolom, angka = baris (tidak yakin mana yang sesuai aturan lomba) |
| Kamera | **4 slot** selalu tampil; kode slot kiri atas, **timestamp** kanan atas, label di bar bawah, empty state "no camera" (ikon video-off) | 2 slot per lintasan, judul di atas, **tanpa timestamp** |

## 11. Masalah UX yang terlihat (perbaiki di 2027)

1. **Mission Log redup untuk viewer.** `opacity-60` membuat juri melihat daftar pudar, termasuk step aktif (`navigation-panel-v2.tsx`).
2. **"Tahap 1" di-hardcode** dan tidak terhubung ke data.
3. **Tidak ada indikator status koneksi atau sinyal.** Nilai `isSignalLost` sudah dihitung tapi tidak ditampilkan (`map-panel.tsx`).
4. **Tidak ada "terakhir diperbarui"** untuk telemetri maupun foto, sehingga data basi tidak bisa dibedakan dari data baru.
5. **Judul kamera tidak cocok dengan slot.** Contoh: kartu berjudul "Underwater Right (UR)" ternyata menampilkan slot UL (`camera-feeds-panel-v2.tsx`).
6. Hanya foto terbaru per slot yang ditampilkan; **tidak ada riwayat foto**. Modal tidak ikut ter-update jika ada foto baru.
7. **Modal tidak aksesibel:** tidak bisa ditutup dengan ESC, tidak ada `role="dialog"`, dan tidak ada focus trap.
8. **Kontras light mode gagal AA.** Pilihan tema tidak disimpan dan tidak mengikuti `prefers-color-scheme`.
9. **Kontrol peta berwarna putih** sehingga tidak serasi dengan tema gelap. **Atribusi OpenStreetMap dimatikan**
   (`attributionControl: false`), padahal OSM mewajibkan atribusi.
10. **Marker terlalu kecil** (8–10 px) untuk proyektor. Tidak ada legenda peta maupun skala. Popup "Pelampung red" mencampur bahasa.
11. **Rotasi peta di-reset ke 0° setiap ada data baru**, sehingga rotasi manual oleh user (sentuh/drag) langsung hilang.
12. Zoom 21–22 memakai tile yang di-upscale, jadi tampilannya buram.
13. Label jam "WIB" ditempel, padahal waktunya mengikuti zona waktu browser.
14. `<html lang="en">`, padahal konten berbahasa Indonesia campur Inggris.
15. **Aksi admin tanpa konfirmasi, undo, atau notifikasi.** Drag marker langsung tersimpan, dan kegagalan hanya tercatat di console.
16. Loading, kosong, dan error semuanya tampil sebagai "—".
17. Ikon-only button hanya memakai `title`, tanpa `aria-label`. Status aktif hanya dibedakan lewat warna.

## 12. Arah desain 2027 (rekomendasi)

- **Pertahankan:** palet teal gelap + lime, panel bersudut tajam dengan garis ganda, layout 3 kolom
  (data | peta | kamera) yang muat satu layar, format angka, dan urutan misi.
- **Tambahkan:**
  - Status bar berisi Realtime connected/disconnected, umur data terakhir (mis. "2 dtk lalu"), status GPS, dan sinyal hilang.
  - Warna ambang baterai: normal / peringatan / kritis.
  - Timestamp di setiap metrik, foto, dan step misi.
  - Kamera 4 slot ala Figma dengan timestamp, plus strip atau galeri riwayat foto.
  - Legenda peta, skala, tombol north-up, atribusi OSM, dan marker yang lebih besar.
  - Mode "Proyektor/Juri": font lebih besar dan tanpa kontrol admin.
  - Halaman admin terpisah dengan login, konfirmasi, toast sukses/gagal, dan undo.
- **Aksesibilitas:** kontras AA di kedua tema, `aria-label`, modal dengan ESC/focus trap, status tidak hanya dari warna,
  `lang="id"`, dan pilihan tema yang disimpan serta mengikuti setting sistem.
- **Konsistensi bahasa:** pilih satu bahasa utama (disarankan Indonesia), istilah teknis boleh tetap (SoG, CoG).

---