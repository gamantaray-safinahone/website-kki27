-- =====================================================================
-- Safinah One — skema database website monitoring KKI 2027 (v2)
--
-- Target  : Supabase (Postgres 17), project tim, region Singapore.
-- Terapkan: npm run db:push   (= supabase db push --remote)
--           Jangan tempel manual di SQL Editor dan jangan edit file ini
--           setelah di-push. Perubahan skema = file migrasi baru.
-- Penjelasan: docs/ARCHITECTURE.md dan docs/DATA_CONTRACT.md
--
-- Siapa menulis apa:
--   NUC  (secret key "nuc") : runs (insert, akhiri), telemetry, mission_events
--   Pi   (secret key "pi")  : Storage bucket captures + tabel captures
--   Admin (login Supabase)  : app_state, courses, course_items,
--                             runs (label/resmi/catatan/akhiri), captures.hidden
--   Publik (publishable key): hanya SELECT
-- =====================================================================


-- ---------------------------------------------------------------------
-- 0. Schema private: fungsi bantu yang TIDAK diekspos lewat Data API
-- ---------------------------------------------------------------------
create schema if not exists private;
grant usage on schema private to authenticated;

-- Mengisi kolom updated_at otomatis setiap baris diubah
create or replace function private.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;


-- ---------------------------------------------------------------------
-- 1. Admin
--    Akun dibuat manual di Authentication > Users (matikan sign-up publik),
--    lalu didaftarkan:  insert into public.app_admins (user_id) values ('<uuid>');
-- ---------------------------------------------------------------------
create table public.app_admins (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

-- Dipakai di policy RLS. Ditaruh di schema private supaya tidak bisa
-- dipanggil sebagai RPC publik.
create or replace function private.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.app_admins where user_id = (select auth.uid())
  );
$$;
revoke all on function private.is_admin() from public;
grant execute on function private.is_admin() to authenticated;


-- ---------------------------------------------------------------------
-- 2. Konfigurasi lintasan (hanya untuk tampilan peta, bukan navigasi kapal)
-- ---------------------------------------------------------------------
create table public.courses (
  lintasan         text primary key check (lintasan in ('A', 'B')),
  -- Boleh null selama lokasi lomba belum diketahui; peta lalu berpusat
  -- pada posisi kapal. Admin mengisinya dari halaman editor lintasan.
  center_lat       double precision check (center_lat between -90 and 90),
  center_lon       double precision check (center_lon between -180 and 180),
  zoom             smallint not null default 19 check (zoom between 10 and 22),
  -- Grid area lomba. KKI 2026: area 30 x 30 m per tim = 6 x 6 sel @ 5 m.
  grid_rows        smallint not null default 6 check (grid_rows between 1 and 20),
  grid_cols        smallint not null default 6 check (grid_cols between 1 and 20),
  grid_cell_m      real     not null default 5 check (grid_cell_m > 0),
  grid_bearing_deg real     not null default 0
                   check (grid_bearing_deg >= 0 and grid_bearing_deg < 360),
  -- Slot kamera yang dipakai lintasan ini. A = {UL,SR}, B = {SL,UR}.
  imaging_slots    text[]   not null
                   check (imaging_slots <@ array['SL', 'SR', 'UL', 'UR']),
  updated_at       timestamptz not null default now(),
  check ((center_lat is null) = (center_lon is null))   -- isi keduanya atau kosongkan keduanya
);

-- Lintasan A dan B dibuat sekarang tanpa koordinat.
insert into public.courses (lintasan, imaging_slots) values
  ('A', array['UL', 'SR']),
  ('B', array['SL', 'UR']);

create table public.course_items (
  id         bigint generated always as identity primary key,
  lintasan   text not null references public.courses(lintasan) on delete cascade,
  kind       text not null check (kind in (
               'start', 'finish',
               'buoy_red', 'buoy_green', 'buoy_blue',
               'imaging_surface', 'imaging_underwater',
               'waypoint'
             )),
  seq        smallint not null default 1,   -- nomor gerbang 1–10 untuk buoy merah/hijau; urutan untuk jenis lain
  label      text,
  lat        double precision not null check (lat between -90 and 90),
  lon        double precision not null check (lon between -180 and 180),
  updated_at timestamptz not null default now(),
  unique (lintasan, kind, seq)
);


-- ---------------------------------------------------------------------
-- 3. Run: satu kali misi diluncurkan dari dermaga (retry = run baru)
--    id dibuat oleh NUC (UUID v4) supaya kapal tetap bisa mencatat
--    walau internet putus saat start.
-- ---------------------------------------------------------------------
create table public.runs (
  id              uuid primary key default gen_random_uuid(),
  lintasan        text references public.courses(lintasan),
  source          text not null default 'boat' check (source in ('boat', 'sim', 'admin')),
  status          text not null default 'live' check (status in ('live', 'ended', 'aborted')),
  label           text,                          -- "Final A - percobaan 2"
  is_official     boolean not null default false,
  started_at      timestamptz not null default now(),
  ended_at        timestamptz,
  end_reason      text,                          -- finish / retry / timeout / manual
  course_snapshot jsonb,                         -- salinan lintasan saat run dibuat (untuk replay)
  notes           text,
  created_at      timestamptz not null default now()
);
create index runs_started_idx on public.runs (started_at desc);


-- ---------------------------------------------------------------------
-- 4. app_state: satu baris konfigurasi global (pengganti courses.is_active)
-- ---------------------------------------------------------------------
create table public.app_state (
  id              boolean primary key default true check (id),   -- memaksa hanya 1 baris
  active_lintasan text default 'A' references public.courses(lintasan), -- lintasan default di peta
  live_run_id     uuid references public.runs(id) on delete set null, -- run yang diikuti dashboard
  -- Urutan tampilan fase misi. Bisa diubah admin kalau TM mengubah urutan.
  phase_order     text[] not null default array[
                    'preparation', 'start', 'floating_ball_set',
                    'underwater_imaging', 'surface_imaging', 'docking', 'finish'
                  ] check (phase_order <@ array[
                    'preparation', 'start', 'floating_ball_set',
                    'underwater_imaging', 'surface_imaging', 'docking', 'finish'
                  ]),
  updated_at      timestamptz not null default now()
);
insert into public.app_state default values;


-- ---------------------------------------------------------------------
-- 5. Telemetri: satu baris per sampel, satu penulis (web_bridge di NUC)
--    Satuan dan sumber tiap field: lihat kontrak data di dokumen rancangan.
-- ---------------------------------------------------------------------
create table public.telemetry (
  id            bigint generated always as identity primary key,
  run_id        uuid not null references public.runs(id) on delete cascade,
  t             timestamptz not null,           -- waktu sampel di kapal (UTC)
  lat           double precision check (lat between -90 and 90),
  lon           double precision check (lon between -180 and 180),
  sog_ms        real,                           -- speed over ground dari GPS, m/s
  cog_deg       real,                           -- course over ground dari GPS, [0,360)
  heading_deg   real,                           -- heading kompas/EKF, [0,360)
  battery_v     real,
  battery_a     real,                           -- positif = arus keluar (discharge)
  battery_pct   real,                           -- 0–100
  fcu_mode      text,                           -- MANUAL / HOLD / AUTO / GUIDED ...
  fcu_connected boolean,
  armed         boolean,
  gps_fix       smallint,                       -- 0–6, MAVLink GPS_FIX_TYPE
  gps_sats      smallint,
  mission_state text,                           -- nama state di state machine NUC
  docking_phase text,
  received_at   timestamptz not null default now(),
  unique (run_id, t)                            -- kunci idempoten: retry tidak menggandakan
);


-- ---------------------------------------------------------------------
-- 6. Event misi: append-only, satu penulis (web_bridge di NUC)
-- ---------------------------------------------------------------------
create table public.mission_events (
  id          bigint generated always as identity primary key,
  run_id      uuid not null references public.runs(id) on delete cascade,
  t           timestamptz not null,
  phase       text not null check (phase in (
                'preparation', 'start', 'floating_ball_set',
                'surface_imaging', 'underwater_imaging',
                'docking', 'finish'
              )),
  status      text not null check (status in ('pending', 'active', 'done')),
  detail      jsonb,                            -- misal {"gate": 4, "total": 10}
  received_at timestamptz not null default now(),
  unique (run_id, phase, t)                     -- kunci idempoten
);

-- Status terakhir per fase per run (untuk SQL dan halaman riwayat).
-- Dashboard live menghitung sendiri dari event karena Realtime tidak
-- mengirim perubahan view.
create view public.mission_status
with (security_invoker = true) as
select distinct on (run_id, phase)
  run_id, phase, status, detail, t
from public.mission_events
order by run_id, phase, t desc, id desc;


-- ---------------------------------------------------------------------
-- 7. Foto imaging: satu penulis (uploader di Raspberry Pi)
--    Urutan kirim: upload file (dan thumbnail) dulu, baru insert baris.
-- ---------------------------------------------------------------------
create table public.captures (
  id           bigint generated always as identity primary key,
  run_id       uuid not null references public.runs(id) on delete cascade,
  slot         text not null check (slot in ('SL', 'SR', 'UL', 'UR')),
  storage_path text not null unique,            -- juga kunci idempoten
  thumb_path   text,
  captured_at  timestamptz not null,
  lat          double precision check (lat between -90 and 90),
  lon          double precision check (lon between -180 and 180),
  sog_ms       real,
  cog_deg      real,
  heading_deg  real,
  detection    jsonb,                           -- [{"cls","conf","bbox":[x,y,w,h]}], bbox 0–1
  meta         jsonb,                           -- {"width","height","camera", ...}
  hidden       boolean not null default false,  -- admin menyembunyikan foto gagal
  received_at  timestamptz not null default now(),
  -- Semua file satu run ada di satu folder, supaya mudah dihapus bersama run.
  check (storage_path like 'runs/' || run_id::text || '/' || slot || '/%')
);
create index captures_run_slot_idx on public.captures (run_id, slot, captured_at desc);


-- ---------------------------------------------------------------------
-- 8. Trigger
-- ---------------------------------------------------------------------
create trigger courses_updated_at before update on public.courses
  for each row execute function private.set_updated_at();
create trigger course_items_updated_at before update on public.course_items
  for each row execute function private.set_updated_at();
create trigger app_state_updated_at before update on public.app_state
  for each row execute function private.set_updated_at();

-- Simpan salinan lintasan saat run dibuat, supaya replay tetap akurat
-- walaupun buoy digeser setelahnya.
create or replace function private.snapshot_course()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.course_snapshot is null and new.lintasan is not null then
    select jsonb_build_object(
             'course', to_jsonb(c),
             'items', coalesce((
               select jsonb_agg(to_jsonb(i) order by i.kind, i.seq)
               from public.course_items i
               where i.lintasan = c.lintasan
             ), '[]'::jsonb)
           )
      into new.course_snapshot
      from public.courses c
     where c.lintasan = new.lintasan;
  end if;
  return new;
end;
$$;

create trigger runs_snapshot_course before insert on public.runs
  for each row execute function private.snapshot_course();

-- Run baru dari kapal otomatis diikuti dashboard publik.
-- Run simulator tidak, supaya uji di laptop tidak mengganggu tampilan lomba.
create or replace function private.follow_boat_run()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.source = 'boat' then
    update public.app_state set live_run_id = new.id where id;
  end if;
  return new;
end;
$$;

create trigger runs_follow_boat after insert on public.runs
  for each row execute function private.follow_boat_run();


-- ---------------------------------------------------------------------
-- 9. RPC: deret telemetri satu run dalam format kolom (ringan untuk
--    jejak lintasan dan grafik uPlot). Fungsi mengembalikan satu nilai
--    jsonb, jadi tidak terpotong batas 1000 baris Data API.
--    p_step = 2 artinya ambil setiap sampel ke-2.
-- ---------------------------------------------------------------------
create or replace function public.get_run_series(p_run_id uuid, p_step int default 1)
returns jsonb
language sql
stable
set search_path = ''
as $$
  with s as (
    select t, lat, lon, sog_ms, cog_deg, heading_deg,
           row_number() over (order by t) as rn
    from public.telemetry
    where run_id = p_run_id
  )
  select jsonb_build_object(
    't',   coalesce(jsonb_agg(round(extract(epoch from t) * 1000) order by t), '[]'::jsonb),
    'lat', coalesce(jsonb_agg(round(lat::numeric, 7) order by t), '[]'::jsonb),
    'lon', coalesce(jsonb_agg(round(lon::numeric, 7) order by t), '[]'::jsonb),
    'sog', coalesce(jsonb_agg(round(sog_ms::numeric, 2) order by t), '[]'::jsonb),
    'cog', coalesce(jsonb_agg(round(cog_deg::numeric, 1) order by t), '[]'::jsonb),
    'hdg', coalesce(jsonb_agg(round(heading_deg::numeric, 1) order by t), '[]'::jsonb)
  )
  from s
  where (rn - 1) % greatest(p_step, 1) = 0;
$$;
grant execute on function public.get_run_series(uuid, int) to anon, authenticated;


-- ---------------------------------------------------------------------
-- 10. Row Level Security
-- ---------------------------------------------------------------------
alter table public.app_admins     enable row level security;
alter table public.app_state      enable row level security;
alter table public.courses        enable row level security;
alter table public.course_items   enable row level security;
alter table public.runs           enable row level security;
alter table public.telemetry      enable row level security;
alter table public.mission_events enable row level security;
alter table public.captures       enable row level security;

-- Publik hanya membaca
create policy "publik baca" on public.app_state      for select to anon, authenticated using (true);
create policy "publik baca" on public.courses        for select to anon, authenticated using (true);
create policy "publik baca" on public.course_items   for select to anon, authenticated using (true);
create policy "publik baca" on public.runs           for select to anon, authenticated using (true);
create policy "publik baca" on public.telemetry      for select to anon, authenticated using (true);
create policy "publik baca" on public.mission_events for select to anon, authenticated using (true);
create policy "publik baca" on public.captures       for select to anon, authenticated using (true);

-- Frontend mengecek "apakah saya admin?" dengan membaca barisnya sendiri
create policy "lihat diri sendiri" on public.app_admins
  for select to authenticated using (user_id = (select auth.uid()));

-- Admin: konfigurasi global
create policy "admin ubah" on public.app_state for update to authenticated
  using ((select private.is_admin())) with check ((select private.is_admin()));

-- Admin: lintasan
create policy "admin tambah" on public.courses for insert to authenticated
  with check ((select private.is_admin()));
create policy "admin ubah" on public.courses for update to authenticated
  using ((select private.is_admin())) with check ((select private.is_admin()));
create policy "admin hapus" on public.courses for delete to authenticated
  using ((select private.is_admin()));

create policy "admin tambah" on public.course_items for insert to authenticated
  with check ((select private.is_admin()));
create policy "admin ubah" on public.course_items for update to authenticated
  using ((select private.is_admin())) with check ((select private.is_admin()));
create policy "admin hapus" on public.course_items for delete to authenticated
  using ((select private.is_admin()));

-- Admin: run (label, tanda resmi, catatan, akhiri, hapus)
create policy "admin tambah" on public.runs for insert to authenticated
  with check ((select private.is_admin()));
create policy "admin ubah" on public.runs for update to authenticated
  using ((select private.is_admin())) with check ((select private.is_admin()));
create policy "admin hapus" on public.runs for delete to authenticated
  using ((select private.is_admin()));

-- Admin: sembunyikan atau hapus foto
create policy "admin ubah" on public.captures for update to authenticated
  using ((select private.is_admin())) with check ((select private.is_admin()));
create policy "admin hapus" on public.captures for delete to authenticated
  using ((select private.is_admin()));

-- telemetry dan mission_events sengaja tanpa policy tulis: hanya kapal
-- (secret key, melewati RLS) yang menulis. Hapus massal lewat hapus run
-- (cascade).

-- Lapisan kedua di atas RLS: role anon tidak punya hak tulis sama sekali,
-- termasuk untuk tabel yang dibuat di migrasi berikutnya.
revoke insert, update, delete, truncate on all tables in schema public from anon;
revoke truncate on all tables in schema public from authenticated;
revoke insert, update, delete on public.telemetry, public.mission_events from authenticated;
alter default privileges in schema public revoke insert, update, delete, truncate on tables from anon;


-- ---------------------------------------------------------------------
-- 11. Realtime
-- ---------------------------------------------------------------------
alter publication supabase_realtime add table
  public.app_state,
  public.courses,
  public.course_items,
  public.runs,
  public.telemetry,
  public.mission_events,
  public.captures;


-- ---------------------------------------------------------------------
-- 12. Storage
--     Bucket publik: file dibaca lewat URL publik tanpa policy SELECT
--     untuk anon, sehingga publik tidak bisa me-list isi bucket.
--     Kapal menulis dengan secret key (melewati RLS).
--     Path wajib: runs/<run_id>/<slot>/<nama>.jpg
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('captures', 'captures', true, 4194304, array['image/jpeg', 'image/png'])
on conflict (id) do nothing;

create policy "admin kelola captures" on storage.objects
  for all to authenticated
  using (bucket_id = 'captures' and (select private.is_admin()))
  with check (bucket_id = 'captures' and (select private.is_admin()));


-- ---------------------------------------------------------------------
-- Setelah lokasi lomba diketahui, isi koordinat lewat halaman admin
-- (/admin/course) atau SQL:
--   update public.courses set center_lat = <lat>, center_lon = <lon> where lintasan = 'A';
-- ---------------------------------------------------------------------
