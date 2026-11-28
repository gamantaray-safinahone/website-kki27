-- Contoh isi Mission Log dan Camera Feeds, untuk melihat tampilan dashboard.
-- Jalankan per bagian di Supabase SQL Editor. Bagian 3 menghapus semuanya.
--
-- Foto: baris captures di bawah hanya menunjuk ke path di bucket "captures".
-- Supaya gambarnya muncul, unggah gambar apa saja (jpg) lewat Dashboard >
-- Storage > captures ke path yang sama persis. Tanpa itu panel tetap terisi
-- (kode slot, jam, riwayat) tetapi gambarnya kosong.
--   runs/00000000-0000-4000-8000-000000000102/SR/1.jpg
--   runs/00000000-0000-4000-8000-000000000102/SR/2.jpg
--   runs/00000000-0000-4000-8000-000000000102/SL/1.jpg
--   runs/00000000-0000-4000-8000-000000000102/UL/1.jpg
--   runs/00000000-0000-4000-8000-000000000102/UL/surface-1.jpg
--   runs/00000000-0000-4000-8000-000000000102/UR/1.jpg
--   runs/00000000-0000-4000-8000-000000000102/UR/surface-1.jpg


-- ---------------------------------------------------------------------
-- 1. Run contoh dan event misi (Mission Log)
--    Hasil: preparation-floating ball set done, imaging active, sisanya pending.
-- ---------------------------------------------------------------------
delete from public.runs where id = '00000000-0000-4000-8000-000000000102';

insert into public.runs (id, lintasan, source, status, label, started_at)
values ('00000000-0000-4000-8000-000000000102', 'A', 'sim', 'live', 'Preview',
        now() - interval '6 minutes');

update public.app_state
set live_run_id = '00000000-0000-4000-8000-000000000102'
where id;

insert into public.mission_events (run_id, t, phase, status, detail) values
  ('00000000-0000-4000-8000-000000000102', now() - interval '6 minutes',  'preparation',       'active', null),
  ('00000000-0000-4000-8000-000000000102', now() - interval '5 minutes',  'preparation',       'done',   null),
  ('00000000-0000-4000-8000-000000000102', now() - interval '5 minutes',  'start',             'active', null),
  ('00000000-0000-4000-8000-000000000102', now() - interval '4 minutes',  'start',             'done',   null),
  ('00000000-0000-4000-8000-000000000102', now() - interval '4 minutes',  'floating_ball_set', 'active', null),
  ('00000000-0000-4000-8000-000000000102', now() - interval '2 minutes',  'floating_ball_set', 'done',   null),
  ('00000000-0000-4000-8000-000000000102', now() - interval '2 minutes',  'surface_imaging',   'active', null),
  ('00000000-0000-4000-8000-000000000102', now() - interval '2 minutes',  'underwater_imaging','active', null),
  ('00000000-0000-4000-8000-000000000102', now() - interval '1 minute',   'surface_imaging',   'done',   '{"slot": "SR"}');


-- ---------------------------------------------------------------------
-- 2. Foto contoh (Camera Feeds)
--    Lintasan A: SR (2 foto, ada riwayat), SL, UL + foto permukaan.
--    Lintasan B: UR + foto permukaan (pilih "B" di peta untuk melihatnya).
-- ---------------------------------------------------------------------
insert into public.captures (run_id, slot, storage_path, captured_at, lat, lon,
                             surface_path, detection)
values
  ('00000000-0000-4000-8000-000000000102', 'SR',
   'runs/00000000-0000-4000-8000-000000000102/SR/1.jpg',
   now() - interval '90 seconds', -7.7705, 110.3779, null,
   '[{"cls": "green_box", "conf": 0.91, "bbox": [0.35, 0.30, 0.25, 0.30]}]'),
  ('00000000-0000-4000-8000-000000000102', 'SR',
   'runs/00000000-0000-4000-8000-000000000102/SR/2.jpg',
   now() - interval '60 seconds', -7.7706, 110.3780, null, null),
  ('00000000-0000-4000-8000-000000000102', 'SL',
   'runs/00000000-0000-4000-8000-000000000102/SL/1.jpg',
   now() - interval '80 seconds', -7.7705, 110.3779, null, null),
  ('00000000-0000-4000-8000-000000000102', 'UL',
   'runs/00000000-0000-4000-8000-000000000102/UL/1.jpg',
   now() - interval '70 seconds', -7.7705, 110.3779,
   'runs/00000000-0000-4000-8000-000000000102/UL/surface-1.jpg', null),
  ('00000000-0000-4000-8000-000000000102', 'UR',
   'runs/00000000-0000-4000-8000-000000000102/UR/1.jpg',
   now() - interval '50 seconds', -7.7705, 110.3779,
   'runs/00000000-0000-4000-8000-000000000102/UR/surface-1.jpg', null);


-- ---------------------------------------------------------------------
-- 3. Pembersih: berhenti mengikuti run contoh dan hapus datanya
--    Event dan baris foto ikut terhapus (on delete cascade). File yang
--    diunggah ke Storage dihapus manual dari folder runs/...0102.
-- ---------------------------------------------------------------------
update public.app_state
set live_run_id = null
where live_run_id = '00000000-0000-4000-8000-000000000102';

delete from public.runs where id = '00000000-0000-4000-8000-000000000102';
