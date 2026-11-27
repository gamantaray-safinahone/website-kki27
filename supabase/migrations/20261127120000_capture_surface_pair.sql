-- Foto underwater disertai foto permukaan yang diambil pada saat yang sama,
-- supaya panel Underwater juga memperlihatkan kondisi di atas air.
-- Foto surface tidak punya pasangan (kolom tetap null).
alter table public.captures
  add column surface_path text,
  add column surface_thumb_path text;

alter table public.captures
  add constraint captures_surface_pair_check check (
    (surface_path is null and surface_thumb_path is null)
    or (
      slot in ('UL', 'UR')
      and surface_path like 'runs/' || run_id::text || '/' || slot || '/%'
      and (surface_thumb_path is null
           or surface_thumb_path like 'runs/' || run_id::text || '/' || slot || '/%')
    )
  );
