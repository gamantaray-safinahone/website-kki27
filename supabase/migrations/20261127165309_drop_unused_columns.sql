-- Buang dua kolom yang tidak dipakai website maupun kapal:
-- - runs.is_official: penanda run resmi dihapus dari admin (tidak dibutuhkan).
-- - courses.zoom: peta menyesuaikan zoom ke grid lintasan (fitBounds).
-- Salinan lintasan di runs.course_snapshot memakai to_jsonb, jadi ikut
-- menyesuaikan tanpa perubahan fungsi.
alter table public.runs drop column is_official;
alter table public.courses drop column zoom;
