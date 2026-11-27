# Urutan tahap

Bulan adalah perkiraan, dihitung mundur dari jadwal KKI 2026 (video kemajuan 1 Agustus, final 14–17 September). File `TAHAP-<n>.md` ditambahkan saat tahap itu dimulai.

| Tahap | Isi | Perkiraan | Selesai bila |
| --- | --- | --- | --- |
| 0 · Fondasi | Repo, migrasi v2, CI, deploy Vercel, README | Des 2026 | Situs `*.vercel.app` ter-deploy, migrasi terpasang, CI hijau, README jelas |
| 1 · Dashboard live (MVP) | LiveProvider + store, peta (grid, buoy, jejak, ikon berputar), panel telemetri, 7 fase, foto terbaru, indikator koneksi, tema, uji manual lewat SQL Editor (`supabase/snippets/uji-manual.sql`) | Des 2026–Jan 2027 | Data uji 1 sampel per detik dari `uji-manual.sql` mulus di HP dengan throttling 3G dan terbaca jelas di layar TV 1080p; menutup lalu membuka tab tidak meninggalkan celah jejak |
| **G1 · MVP siap uji** | | | Data uji mulus di HP 3G |
| 2 · Integrasi kapal (tim ROS, paralel) | `web_bridge` di NUC, `capture_uploader` di Pi, uji kolam lalu waduk | Jan–Mar 2027 | Satu run nyata 20 menit dengan internet dicabut 2 menit, tanpa sampel, event, atau foto yang hilang atau dobel |
| 3 · Admin | Login, editor lintasan (termasuk koordinat pusat), kontrol run, sembunyikan/hapus foto, hapus run beserta file | Feb 2027 | User non-admin ditolak di UI dan RLS; hapus run tidak menyisakan file di Storage |
| 4 · Riwayat, galeri, replay | Daftar run, slider waktu, grafik SOG, titik event, galeri per slot | Mar 2027 | Replay run 20 menit lancar di HP; galeri hanya memuat thumbnail sampai diklik |
| **G2 · Kontrak terbukti** | | | Hasil uji lapangan Tahap 2 lulus |
| 5 · Hardening | Uji 60 tab bersamaan, fallback polling, runbook hari lomba, cek kuota | Apr–Mei 2027 | 60 tab penonton 20 menit tanpa putus; runbook dicoba penuh sekali |
| 6 · Live cam (opsional) | Snapshot tiap 5 detik, maks 30 KB, dibatasi kuota egress | Jun–Jul 2027 | Egress muat: 60 penonton × 30 KB tiap 5 detik ≈ 430 MB per run dari kuota 5 GB per bulan |
| **G3 · Fitur dibekukan** | | Agu 2027 | Setelah ini hanya perbaikan bug |
