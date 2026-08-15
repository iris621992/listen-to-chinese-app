-- Bootstrap the minimal active language rows required by Lexicon Phase 1.
--
-- Supabase applies migrations before supabase/seed.sql, so these reference
-- rows must exist before the 20260714 lexicon migration runs.

insert into public.languages (
  code,
  name_english,
  native_name,
  direction,
  is_target_language,
  is_support_language,
  is_active
)
values
  ('zh', 'Chinese', '中文', 'ltr', true, false, true),
  ('en', 'English', 'English', 'ltr', false, true, true),
  ('vi', 'Vietnamese', 'Tiếng Việt', 'ltr', false, true, true),
  ('ar', 'Arabic', 'العربية', 'rtl', false, true, true)
on conflict (code) do update set
  name_english = excluded.name_english,
  native_name = excluded.native_name,
  direction = excluded.direction,
  is_target_language = excluded.is_target_language,
  is_support_language = excluded.is_support_language,
  is_active = excluded.is_active;

