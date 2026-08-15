insert into public.languages (code, name_english, native_name, direction, is_target_language, is_support_language, is_active)
values
  ('zh', 'Chinese', '中文', 'ltr', true, false, true),
  ('en', 'English', 'English', 'ltr', false, true, true),
  ('vi', 'Vietnamese', 'Tiếng Việt', 'ltr', false, true, true),
  ('th', 'Thai', 'ไทย', 'ltr', false, true, true),
  ('id', 'Indonesian', 'Bahasa Indonesia', 'ltr', false, true, true),
  ('es', 'Spanish', 'Español', 'ltr', false, true, true),
  ('pt', 'Portuguese', 'Português', 'ltr', false, true, true),
  ('fr', 'French', 'Français', 'ltr', false, true, true),
  ('de', 'German', 'Deutsch', 'ltr', false, true, true),
  ('ru', 'Russian', 'Русский', 'ltr', false, true, true),
  ('ja', 'Japanese', '日本語', 'ltr', false, true, true),
  ('ko', 'Korean', '한국어', 'ltr', false, true, true),
  ('tr', 'Turkish', 'Türkçe', 'ltr', false, true, true),
  ('it', 'Italian', 'Italiano', 'ltr', false, true, true),
  ('ar', 'Arabic', 'العربية', 'rtl', false, true, true)
on conflict (code) do update set
  name_english = excluded.name_english,
  native_name = excluded.native_name,
  direction = excluded.direction,
  is_target_language = excluded.is_target_language,
  is_support_language = excluded.is_support_language,
  is_active = excluded.is_active;

insert into public.libraries (slug, name, target_language_code, description, is_active)
values ('listen-to-chinese', 'Listen to Chinese', 'zh', 'Chinese listening, reading, and practice library.', true)
on conflict (slug) do update set
  name = excluded.name,
  target_language_code = excluded.target_language_code,
  description = excluded.description,
  is_active = excluded.is_active;

insert into public.level_systems (library_id, code, name, description, is_active)
select id, 'HSK', 'HSK', 'Hanyu Shuiping Kaoshi Chinese proficiency levels.', true
from public.libraries
where slug = 'listen-to-chinese'
on conflict (library_id, code) do update set
  name = excluded.name,
  description = excluded.description,
  is_active = excluded.is_active;

insert into public.levels (level_system_id, code, name, sort_order, description, is_active)
select ls.id, v.code, v.name, v.sort_order, v.description, true
from public.level_systems ls
join public.libraries lib on lib.id = ls.library_id
cross join (values
  ('HSK1', 'HSK 1', 1, 'HSK level 1'),
  ('HSK2', 'HSK 2', 2, 'HSK level 2'),
  ('HSK3', 'HSK 3', 3, 'HSK level 3'),
  ('HSK4', 'HSK 4', 4, 'HSK level 4'),
  ('HSK5', 'HSK 5', 5, 'HSK level 5'),
  ('HSK6', 'HSK 6', 6, 'HSK level 6'),
  ('HSK7', 'HSK 7', 7, 'HSK level 7'),
  ('HSK8', 'HSK 8', 8, 'HSK level 8'),
  ('HSK9', 'HSK 9', 9, 'HSK level 9')
) as v(code, name, sort_order, description)
where lib.slug = 'listen-to-chinese'
  and ls.code = 'HSK'
on conflict (level_system_id, code) do update set
  name = excluded.name,
  sort_order = excluded.sort_order,
  description = excluded.description,
  is_active = excluded.is_active;
