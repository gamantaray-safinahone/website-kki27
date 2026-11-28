-- =====================================================================
-- Uji manual dashboard lewat Supabase SQL Editor (tanpa kapal, tanpa simulator)
--
-- File ini TIDAK dijalankan otomatis: bukan migrasi dan bukan seed.
--
-- Cara pakai:
--   1. Buka dashboard: `npm run dev` lalu http://localhost:3000, atau situs Vercel.
--   2. Buka Supabase Dashboard > SQL Editor, tempel seluruh isi file ini.
--   3. Sorot SATU bagian (dari judul bagian sampai sebelum judul berikutnya),
--      lalu klik Run. SQL Editor hanya menjalankan teks yang disorot.
--      Jangan menjalankan seluruh file sekaligus: bagian 5 (pembersih)
--      akan ikut jalan dan semua data uji langsung hilang lagi.
--   4. Setiap bagian menulis "Di dashboard:" = yang seharusnya terlihat
--      tanpa reload. Bila tidak berubah, Realtime atau dashboard bermasalah.
--   5. Selesai menguji, jalankan bagian 5.
--
-- JANGAN dijalankan saat lomba: bagian 1 membuat dashboard publik
-- mengikuti run uji ini.
--
-- SQL Editor berjalan sebagai role postgres sehingga melewati RLS.
-- Ini tidak mengubah RLS: publik tetap hanya bisa membaca.
--
-- Semua bagian memakai satu run uji dengan id tetap:
--   00000000-0000-4000-8000-000000000101
-- =====================================================================


-- ---------------------------------------------------------------------
-- 0. (Opsional) Koordinat dan objek contoh untuk lintasan A
--    Hanya mengisi bila lintasan A masih kosong; data asli tidak ditimpa.
--    Pusat contoh -7.7705, 110.3779, grid tidak diputar (grid_bearing_deg = 0).
--    Objek contoh diberi label 'manual-test' supaya mudah dihapus di bagian 5.
--    Di dashboard: grid 6 x 6, Start, Finish, 10 pasang buoy (merah di kanan,
--    hijau di kiri), kotak imaging biru dan hijau, 3 bola docking biru.
-- ---------------------------------------------------------------------
update public.courses
set center_lat = -7.7705, center_lon = 110.3779
where lintasan = 'A' and center_lat is null;

insert into public.course_items (lintasan, kind, seq, label, lat, lon)
select 'A', o.kind, o.seq, 'manual-test',
       c.center_lat + o.y / 111320.0,
       c.center_lon + o.x / (111320.0 * cos(radians(c.center_lat)))
from public.courses c
cross join (
  -- x = meter ke timur, y = meter ke utara, dihitung dari pusat lintasan
  values ('start', 1, 0.0, -14.0),
         ('finish', 1, 0.0, 14.0),
         ('imaging_underwater', 1, 9.0, 11.0),
         ('imaging_surface', 1, -9.0, 11.0),
         ('buoy_blue', 1, -0.3, 14.4),
         ('buoy_blue', 2, 0.0, 14.4),
         ('buoy_blue', 3, 0.3, 14.4)
  union all
  -- 10 gerbang zig-zag, jarak 2 m ke utara; merah di kanan, hijau di kiri
  select 'buoy_red', g + 1, (case when g % 2 = 0 then -2.5 else 2.5 end) + 1.5, -10.0 + g * 2
  from generate_series(0, 9) as g
  union all
  select 'buoy_green', g + 1, (case when g % 2 = 0 then -2.5 else 2.5 end) - 1.5, -10.0 + g * 2
  from generate_series(0, 9) as g
) as o(kind, seq, x, y)
where c.lintasan = 'A'
  and c.center_lat is not null
  and not exists (select 1 from public.course_items i where i.lintasan = 'A');


-- ---------------------------------------------------------------------
-- 1. Buat run uji dan minta dashboard mengikutinya
--    Menjalankan ulang bagian ini = mulai dari awal (run uji lama dihapus dulu).
--    Di dashboard: "Course A · Manual test · Simulator", Boat: Waiting for data.
-- ---------------------------------------------------------------------
delete from public.runs where id = '00000000-0000-4000-8000-000000000101';

insert into public.runs (id, lintasan, source, status, label)
values ('00000000-0000-4000-8000-000000000101', 'A', 'sim', 'live', 'Manual test');

update public.app_state
set live_run_id = '00000000-0000-4000-8000-000000000101'
where id;


-- ---------------------------------------------------------------------
-- 2. Telemetri: sampai 10 sampel, satu per detik (boleh dijalankan berulang kali)
--    Sampel dibuat untuk 10 detik terakhir, berakhir di detik sekarang.
--    Detik yang sudah punya sampel dilewati, jadi bila dijalankan lagi kurang
--    dari 10 detik kemudian, hanya detik yang baru yang ditambah. Waktu sampel
--    tidak pernah di masa depan dan jejak tidak pernah mundur.
--    Jalankan kira-kira tiap 10 detik supaya waktu sampel tidak berlubang.
--    Kapal maju 0,5 m per sampel menyusuri zig-zag gerbang, dari Start
--    (y = -14 m) sampai Finish (y = 14 m): sekitar 6 kali dijalankan.
--    Setelah sampai Finish, kapal diam (SOG 0, HOLD).
--    Di dashboard: Boat: Online, Feed: Live, ikon kapal bergeser dan berputar,
--    jejak bertambah, angka SOG/COG/heading/baterai berubah. Tunggu lebih dari
--    5 detik tanpa menjalankan apa pun: badge berubah ke Delayed, lalu Offline
--    setelah 15 detik.
-- ---------------------------------------------------------------------
with
prev as (
  -- jumlah sampel dan waktu sampel terakhir run uji
  select count(*) as done, max(t) as last_t
  from public.telemetry
  where run_id = '00000000-0000-4000-8000-000000000101'
),
center as (
  -- pusat lintasan A; bila masih kosong, pakai pusat contoh bagian 0
  select coalesce(center_lat, -7.7705) as lat, coalesce(center_lon, 110.3779) as lon
  from public.courses
  where lintasan = 'A'
),
samples as (
  -- t = setiap detik bulat dalam 10 detik terakhir yang belum punya sampel
  -- k = nomor sampel sejak awal run (0, 1, 2, ...), menentukan posisi kapal
  select prev.done + row_number() over (order by g.t) - 1 as k, g.t
  from prev,
       generate_series(date_trunc('second', now()) - interval '9 seconds',
                       date_trunc('second', now()),
                       interval '1 second') as g(t)
  where prev.last_t is null or g.t > prev.last_t
),
route as (
  -- y = posisi ke utara (maju 0,5 m per sampel), x = posisi ke timur
  -- dxdy = kemiringan jalur (meter ke timur per meter ke utara), untuk heading
  select k, t, y, y < 14 as moving,
         case
           when y < -10 then -2.5 * (y + 14) / 4             -- dari Start ke gerbang 1
           when y <= 8 then -2.5 * cos(pi() * (y + 10) / 2)  -- zig-zag lewat tengah gerbang
           else 2.5 * (14 - y) / 6                           -- dari gerbang 10 ke Finish
         end as x,
         case
           when y < -10 then -2.5 / 4
           when y <= 8 then 2.5 * pi() / 2 * sin(pi() * (y + 10) / 2)
           else -2.5 / 6
         end as dxdy
  from (select k, t, least(-14 + 0.5 * k, 14.0) as y from samples) as s
)
insert into public.telemetry (
  run_id, t, lat, lon, sog_ms, cog_deg, heading_deg,
  battery_v, battery_a, battery_pct, fcu_mode, armed, fcu_connected,
  gps_fix, gps_sats, mission_state, docking_phase
)
select
  '00000000-0000-4000-8000-000000000101',
  r.t,
  round((c.lat + r.y / 111320.0)::numeric, 7),
  round((c.lon + r.x / (111320.0 * cos(radians(c.lat))))::numeric, 7),
  case when r.moving then round((0.5 * sqrt(1 + r.dxdy * r.dxdy))::numeric, 2) else 0 end,
  case when r.moving then round((h.heading + 2) % 360, 1) end,   -- COG null saat diam
  round(h.heading, 1),
  round(16.4 - 0.002 * r.k, 2),
  case when r.moving then 6.2 else 0.8 end,
  greatest(round(82 - 0.05 * r.k, 1), 0),
  case when r.moving then 'AUTO' else 'HOLD' end,
  r.moving,
  true,
  3,
  14,
  case
    when r.y < -10 then 'START'
    when r.y <= 8 then 'GATE_NAV'
    when r.y < 14 then 'DOCKING'
    else 'FINISHED'
  end,
  case when r.y > 8 and r.y < 14 then 'APPROACH' end
from route r
cross join center c
-- heading = arah jalur dari utara, searah jarum jam, [0, 360)
cross join lateral (
  select (degrees(atan2(r.dxdy, 1)) + 360)::numeric % 360 as heading
) as h
on conflict (run_id, t) do nothing;


-- ---------------------------------------------------------------------
-- 3. Event misi: jalankan 3a sampai 3i satu per satu, berurutan
--    Urutan imaging mengikuti app_state.phase_order bawaan
--    (underwater dulu, lalu surface). Slot foto lintasan A: UL dan SR.
-- ---------------------------------------------------------------------

-- 3a. Persiapan dimulai (kapal mengirim ini saat run dibuat)
--     Di dashboard: Preparation = Active, fase lain Pending.
insert into public.mission_events (run_id, t, phase, status)
values ('00000000-0000-4000-8000-000000000101', now(), 'preparation', 'active');

-- 3b. Persiapan selesai, start aktif
--     Di dashboard: Preparation = Done, Start = Active, timer mulai berjalan.
insert into public.mission_events (run_id, t, phase, status) values
  ('00000000-0000-4000-8000-000000000101', now(), 'preparation', 'done'),
  ('00000000-0000-4000-8000-000000000101', now(), 'start', 'active');

-- 3c. Start selesai, masuk gerbang
--     Di dashboard: Start = Done, Floating Ball Set = Active.
insert into public.mission_events (run_id, t, phase, status, detail) values
  ('00000000-0000-4000-8000-000000000101', now(), 'start', 'done', null),
  ('00000000-0000-4000-8000-000000000101', now(), 'floating_ball_set', 'active', null);

-- 3d. (Dihapus: hitungan gerbang tidak dilaporkan kapal.)

-- 3e. Semua gerbang selesai, underwater imaging aktif
--     Di dashboard: Floating Ball Set = Done, Underwater Imaging = Active.
insert into public.mission_events (run_id, t, phase, status, detail) values
  ('00000000-0000-4000-8000-000000000101', now(), 'floating_ball_set', 'done', null),
  ('00000000-0000-4000-8000-000000000101', now(), 'underwater_imaging', 'active', null);

-- 3f. Underwater imaging selesai, surface imaging aktif
--     Di dashboard: Underwater Imaging = Done ("Slot UL"), Surface Imaging = Active.
--     Tidak ada foto: panel Imaging tetap kosong (foto butuh file di Storage).
insert into public.mission_events (run_id, t, phase, status, detail) values
  ('00000000-0000-4000-8000-000000000101', now(), 'underwater_imaging', 'done',
   '{"slot": "UL"}'),
  ('00000000-0000-4000-8000-000000000101', now(), 'surface_imaging', 'active', null);

-- 3g. Surface imaging selesai, docking aktif
--     Di dashboard: Surface Imaging = Done ("Slot SR"), Docking = Active.
insert into public.mission_events (run_id, t, phase, status, detail) values
  ('00000000-0000-4000-8000-000000000101', now(), 'surface_imaging', 'done',
   '{"slot": "SR"}'),
  ('00000000-0000-4000-8000-000000000101', now(), 'docking', 'active', null);

-- 3h. Docking selesai, finish aktif
--     Di dashboard: Docking = Done, Finish = Active.
insert into public.mission_events (run_id, t, phase, status) values
  ('00000000-0000-4000-8000-000000000101', now(), 'docking', 'done'),
  ('00000000-0000-4000-8000-000000000101', now(), 'finish', 'active');

-- 3i. Finish selesai
--     Di dashboard: semua fase Done, timer berhenti.
insert into public.mission_events (run_id, t, phase, status)
values ('00000000-0000-4000-8000-000000000101', now(), 'finish', 'done');


-- ---------------------------------------------------------------------
-- 4. Akhiri run uji (seperti kapal setelah finish)
--    Di dashboard: Boat: Run ended.
-- ---------------------------------------------------------------------
update public.runs
set status = 'ended', ended_at = now(), end_reason = 'finish'
where id = '00000000-0000-4000-8000-000000000101';


-- ---------------------------------------------------------------------
-- 5. Pembersih: berhenti mengikuti run uji dan hapus datanya
--    Telemetri dan event ikut terhapus bersama run (on delete cascade).
--    Di dashboard: Boat: No active run.
-- ---------------------------------------------------------------------
update public.app_state
set live_run_id = null
where live_run_id = '00000000-0000-4000-8000-000000000101';

delete from public.runs where id = '00000000-0000-4000-8000-000000000101';

-- 5b. (Opsional) Hapus lintasan contoh dari bagian 0
--     Koordinat pusat hanya dikosongkan bila masih sama dengan contoh dan
--     tidak ada objek lain di lintasan A.
delete from public.course_items where lintasan = 'A' and label = 'manual-test';

update public.courses
set center_lat = null, center_lon = null
where lintasan = 'A'
  and center_lat = -7.7705 and center_lon = 110.3779
  and not exists (select 1 from public.course_items i where i.lintasan = 'A');
