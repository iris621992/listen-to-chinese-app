-- Lexicon Phase 1 core relational schema
--
-- Scope:
-- - seven shared reference dimensions required by the lexicon
-- - twelve Phase 1 lexicon core tables
-- - integrity constraints, minimal indexes, review fields, RLS, and deny-by-default grants
-- - minimal reference seed rows only
--
-- Out of scope:
-- - lexical fixture rows for 叫 or 行
-- - examples, corpus, grammar links, relations, search projections, resource links, or app code

create extension if not exists pgcrypto;

do $$
begin
  if to_regprocedure('public.set_updated_at()') is null then
    raise exception 'Lexicon Phase 1 requires public.set_updated_at() from Database Foundation v1';
  end if;

  if (
    select count(*)
    from public.languages
    where code in ('zh', 'vi', 'en', 'ar')
      and is_active = true
  ) <> 4 then
    raise exception 'Lexicon Phase 1 requires active language records for zh, vi, en, and ar';
  end if;
end;
$$;

-- -----------------------------------------------------------------------------
-- Shared reference dimensions
-- -----------------------------------------------------------------------------

create table public.language_varieties (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  language_code text not null references public.languages(code) on update cascade,
  name_english text not null,
  native_name text,
  description text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (btrim(code) <> ''),
  check (btrim(name_english) <> '')
);

create table public.region_profiles (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  language_variety_id uuid not null references public.language_varieties(id) on delete restrict,
  name_english text not null,
  description text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, language_variety_id),
  check (btrim(code) <> ''),
  check (btrim(name_english) <> '')
);

create table public.script_variants (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name_english text not null,
  description text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (btrim(code) <> ''),
  check (btrim(name_english) <> '')
);

create table public.script_profiles (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  language_variety_id uuid not null references public.language_varieties(id) on delete restrict,
  region_profile_id uuid not null,
  script_variant_id uuid not null references public.script_variants(id) on delete restrict,
  name_english text not null,
  description text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, script_variant_id),
  foreign key (region_profile_id, language_variety_id)
    references public.region_profiles(id, language_variety_id)
    on delete restrict,
  check (btrim(code) <> ''),
  check (btrim(name_english) <> '')
);

create table public.pronunciation_systems (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  language_variety_id uuid not null references public.language_varieties(id) on delete restrict,
  name_english text not null,
  description text,
  is_tonal boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (btrim(code) <> ''),
  check (btrim(name_english) <> '')
);

create table public.parts_of_speech (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  name_english text not null,
  description text,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (btrim(code) <> ''),
  check (btrim(name_english) <> ''),
  check (sort_order >= 0)
);

create table public.locales (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  language_code text not null references public.languages(code) on update cascade,
  display_name text not null,
  direction text not null default 'ltr' check (direction in ('ltr', 'rtl')),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (btrim(code) <> ''),
  check (btrim(display_name) <> '')
);

-- -----------------------------------------------------------------------------
-- Core lexical identity
-- -----------------------------------------------------------------------------

create table public.lexical_concepts (
  id uuid primary key default gen_random_uuid(),
  canonical_key text not null unique,
  concept_type text not null check (
    concept_type in ('semantic_concept', 'lexical_family', 'cross_variety_connection', 'other')
  ),
  semantic_domain_code text,
  status text not null default 'provisional' check (
    status in ('provisional', 'reviewed', 'merged', 'deprecated')
  ),
  merged_into_concept_id uuid references public.lexical_concepts(id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id) on delete set null,
  check (btrim(canonical_key) <> ''),
  check (merged_into_concept_id is null or merged_into_concept_id <> id)
);

create table public.lexical_entries (
  id uuid primary key default gen_random_uuid(),
  concept_id uuid references public.lexical_concepts(id) on delete set null,
  entry_key text not null unique,
  slug text not null,
  language_variety_id uuid not null references public.language_varieties(id) on delete restrict,
  region_profile_id uuid not null,
  entry_kind text not null check (
    entry_kind in ('word', 'character', 'phrase', 'morpheme', 'proper_name', 'other')
  ),
  editorial_summary text,
  review_status text not null default 'provisional' check (
    review_status in ('imported_raw', 'provisional', 'needs_review', 'reviewed', 'rejected', 'deprecated')
  ),
  publication_status text not null default 'hidden' check (
    publication_status in ('hidden', 'preview', 'published', 'archived')
  ),
  confidence_level text check (
    confidence_level is null or confidence_level in ('low', 'medium', 'high')
  ),
  metadata jsonb not null default '{}'::jsonb,
  version_number integer not null default 1 check (version_number >= 1),
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  reviewed_by uuid references auth.users(id) on delete set null,
  published_at timestamptz,
  published_by uuid references auth.users(id) on delete set null,
  deprecated_at timestamptz,
  deprecated_by uuid references auth.users(id) on delete set null,
  unique (slug, language_variety_id, region_profile_id),
  foreign key (region_profile_id, language_variety_id)
    references public.region_profiles(id, language_variety_id)
    on delete restrict,
  check (btrim(entry_key) <> ''),
  check (btrim(slug) <> ''),
  check (publication_status <> 'published' or review_status = 'reviewed')
);

create table public.lexical_written_forms (
  id uuid primary key default gen_random_uuid(),
  lexical_entry_id uuid not null references public.lexical_entries(id) on delete cascade,
  script_profile_id uuid not null references public.script_profiles(id) on delete restrict,
  script_variant_id uuid not null references public.script_variants(id) on delete restrict,
  written_form text not null,
  normalized_form text not null,
  form_type text not null check (
    form_type in ('headword', 'standard_variant', 'regional_variant', 'historical', 'other')
  ),
  form_status text not null default 'current' check (
    form_status in ('current', 'rare', 'historical', 'deprecated')
  ),
  is_primary boolean not null default false,
  source_generation_type text not null default 'authored' check (
    source_generation_type in ('authored', 'source_verified', 'converted_candidate', 'imported_candidate')
  ),
  review_status text not null default 'provisional' check (
    review_status in ('imported_raw', 'provisional', 'needs_review', 'reviewed', 'rejected', 'deprecated')
  ),
  publication_status text not null default 'hidden' check (
    publication_status in ('hidden', 'preview', 'published', 'archived')
  ),
  confidence_level text check (
    confidence_level is null or confidence_level in ('low', 'medium', 'high')
  ),
  metadata jsonb not null default '{}'::jsonb,
  version_number integer not null default 1 check (version_number >= 1),
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  reviewed_by uuid references auth.users(id) on delete set null,
  unique (id, lexical_entry_id),
  unique (lexical_entry_id, script_profile_id, normalized_form),
  foreign key (script_profile_id, script_variant_id)
    references public.script_profiles(id, script_variant_id)
    on delete restrict,
  check (btrim(written_form) <> ''),
  check (btrim(normalized_form) <> ''),
  check (publication_status <> 'published' or review_status = 'reviewed'),
  check (
    source_generation_type not in ('converted_candidate', 'imported_candidate')
    or publication_status <> 'published'
    or review_status = 'reviewed'
  )
);

create table public.lexical_pronunciations (
  id uuid primary key default gen_random_uuid(),
  lexical_entry_id uuid not null references public.lexical_entries(id) on delete cascade,
  pronunciation_system_id uuid not null references public.pronunciation_systems(id) on delete restrict,
  pronunciation_text text not null,
  normalized_pronunciation text not null,
  pronunciation_no_tone text,
  tone_number_text text,
  display_order integer not null,
  is_default boolean not null default false,
  reading_status text not null default 'current' check (
    reading_status in ('current', 'rare', 'dialectal', 'historical', 'lexicalized', 'deprecated')
  ),
  standalone_content_status text not null default 'intentionally_deferred' check (
    standalone_content_status in ('has_items', 'no_standalone_items', 'intentionally_deferred')
  ),
  learner_priority text not null default 'extended' check (
    learner_priority in ('essential', 'primary', 'core', 'extended', 'reference_only')
  ),
  review_status text not null default 'provisional' check (
    review_status in ('imported_raw', 'provisional', 'needs_review', 'reviewed', 'rejected', 'deprecated')
  ),
  publication_status text not null default 'hidden' check (
    publication_status in ('hidden', 'preview', 'published', 'archived')
  ),
  metadata jsonb not null default '{}'::jsonb,
  version_number integer not null default 1 check (version_number >= 1),
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  reviewed_by uuid references auth.users(id) on delete set null,
  unique (id, lexical_entry_id),
  unique (lexical_entry_id, pronunciation_system_id, normalized_pronunciation),
  unique (lexical_entry_id, display_order),
  check (btrim(pronunciation_text) <> ''),
  check (btrim(normalized_pronunciation) <> ''),
  check (display_order > 0),
  check (publication_status <> 'published' or review_status = 'reviewed')
);

create table public.lexical_pronunciation_forms (
  lexical_entry_id uuid not null,
  pronunciation_id uuid not null,
  written_form_id uuid not null,
  is_primary_form_for_reading boolean not null default false,
  display_order integer not null,
  review_status text not null default 'provisional' check (
    review_status in ('imported_raw', 'provisional', 'needs_review', 'reviewed', 'rejected', 'deprecated')
  ),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (pronunciation_id, written_form_id),
  unique (pronunciation_id, display_order),
  foreign key (pronunciation_id, lexical_entry_id)
    references public.lexical_pronunciations(id, lexical_entry_id)
    on delete cascade,
  foreign key (written_form_id, lexical_entry_id)
    references public.lexical_written_forms(id, lexical_entry_id)
    on delete cascade,
  check (display_order > 0)
);

create table public.lexical_pos_groups (
  id uuid primary key default gen_random_uuid(),
  pronunciation_id uuid not null references public.lexical_pronunciations(id) on delete cascade,
  part_of_speech_id uuid not null references public.parts_of_speech(id) on delete restrict,
  group_key text not null,
  display_order integer not null,
  learner_label_override text,
  review_status text not null default 'provisional' check (
    review_status in ('imported_raw', 'provisional', 'needs_review', 'reviewed', 'rejected', 'deprecated')
  ),
  publication_status text not null default 'hidden' check (
    publication_status in ('hidden', 'preview', 'published', 'archived')
  ),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, pronunciation_id),
  unique (pronunciation_id, group_key),
  unique (pronunciation_id, display_order),
  check (btrim(group_key) <> ''),
  check (display_order > 0),
  check (publication_status <> 'published' or review_status = 'reviewed')
);

create table public.lexical_reading_items (
  id uuid primary key default gen_random_uuid(),
  pronunciation_id uuid not null references public.lexical_pronunciations(id) on delete cascade,
  pos_group_id uuid,
  parent_item_id uuid,
  item_key text not null unique,
  item_type text not null check (item_type in ('sense', 'usage')),
  usage_scope text,
  register_code text,
  domain_code text,
  region_profile_id uuid references public.region_profiles(id) on delete restrict,
  learner_priority text not null default 'extended' check (
    learner_priority in ('essential', 'primary', 'core', 'extended', 'reference_only')
  ),
  display_order integer not null,
  review_status text not null default 'provisional' check (
    review_status in ('imported_raw', 'provisional', 'needs_review', 'reviewed', 'rejected', 'deprecated')
  ),
  publication_status text not null default 'hidden' check (
    publication_status in ('hidden', 'preview', 'published', 'archived')
  ),
  confidence_level text check (
    confidence_level is null or confidence_level in ('low', 'medium', 'high')
  ),
  metadata jsonb not null default '{}'::jsonb,
  version_number integer not null default 1 check (version_number >= 1),
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  reviewed_by uuid references auth.users(id) on delete set null,
  published_at timestamptz,
  published_by uuid references auth.users(id) on delete set null,
  unique (id, pronunciation_id),
  foreign key (pos_group_id, pronunciation_id)
    references public.lexical_pos_groups(id, pronunciation_id)
    on delete restrict,
  foreign key (parent_item_id, pronunciation_id)
    references public.lexical_reading_items(id, pronunciation_id)
    on delete cascade,
  check (btrim(item_key) <> ''),
  check (display_order > 0),
  check (parent_item_id is null or parent_item_id <> id),
  check (publication_status <> 'published' or review_status = 'reviewed')
);

create table public.lexical_senses (
  reading_item_id uuid primary key references public.lexical_reading_items(id) on delete cascade,
  semantic_summary_internal text,
  is_subsense boolean not null default false,
  sense_boundary_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.lexical_usages (
  reading_item_id uuid primary key references public.lexical_reading_items(id) on delete cascade,
  usage_type text not null check (
    usage_type in (
      'grammar_marker',
      'discourse_construction',
      'bound_usage',
      'bound_morpheme',
      'word_formation_usage',
      'adverbial_or_word_formation',
      'dialectal_reference',
      'historical_note',
      'classifier_construction',
      'surname',
      'other'
    )
  ),
  construction_key text,
  grammaticalization_level text,
  usage_note_internal text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.lexical_pronunciation_aliases (
  id uuid primary key default gen_random_uuid(),
  pronunciation_id uuid references public.lexical_pronunciations(id) on delete cascade,
  related_reading_item_id uuid references public.lexical_reading_items(id) on delete cascade,
  alias_system_id uuid references public.pronunciation_systems(id) on delete restrict,
  alias_text text not null,
  normalized_alias text not null,
  alias_type text not null check (
    alias_type in (
      'search_alias',
      'historical_reading',
      'alternate_romanization',
      'dialectal_reading',
      'common_input',
      'other'
    )
  ),
  is_searchable boolean not null default true,
  review_status text not null default 'provisional' check (
    review_status in ('imported_raw', 'provisional', 'needs_review', 'reviewed', 'rejected', 'deprecated')
  ),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (related_reading_item_id, pronunciation_id)
    references public.lexical_reading_items(id, pronunciation_id)
    on delete cascade,
  check (pronunciation_id is not null or related_reading_item_id is not null),
  check (btrim(alias_text) <> ''),
  check (btrim(normalized_alias) <> '')
);

create table public.lexical_item_localizations (
  id uuid primary key default gen_random_uuid(),
  reading_item_id uuid not null references public.lexical_reading_items(id) on delete cascade,
  locale_id uuid not null references public.locales(id) on delete restrict,
  short_label text not null,
  full_explanation text,
  usage_note text,
  memory_tip text,
  search_labels text[],
  review_status text not null default 'provisional' check (
    review_status in ('imported_raw', 'provisional', 'needs_review', 'reviewed', 'rejected', 'deprecated')
  ),
  publication_status text not null default 'hidden' check (
    publication_status in ('hidden', 'preview', 'published', 'archived')
  ),
  version_number integer not null default 1 check (version_number >= 1),
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  reviewed_by uuid references auth.users(id) on delete set null,
  unique (reading_item_id, locale_id),
  check (btrim(short_label) <> ''),
  check (publication_status <> 'published' or review_status = 'reviewed')
);

create table public.lexical_item_chinese_definitions (
  id uuid primary key default gen_random_uuid(),
  reading_item_id uuid not null references public.lexical_reading_items(id) on delete cascade,
  script_profile_id uuid not null references public.script_profiles(id) on delete restrict,
  definition_text text not null,
  is_project_authored boolean not null default true check (is_project_authored),
  review_status text not null default 'provisional' check (
    review_status in ('imported_raw', 'provisional', 'needs_review', 'reviewed', 'rejected', 'deprecated')
  ),
  publication_status text not null default 'hidden' check (
    publication_status in ('hidden', 'preview', 'published', 'archived')
  ),
  version_number integer not null default 1 check (version_number >= 1),
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id) on delete set null,
  reviewed_at timestamptz,
  reviewed_by uuid references auth.users(id) on delete set null,
  unique (reading_item_id, script_profile_id),
  check (btrim(definition_text) <> ''),
  check (publication_status <> 'published' or review_status = 'reviewed')
);

-- -----------------------------------------------------------------------------
-- Integrity indexes
-- -----------------------------------------------------------------------------

create unique index lexical_written_forms_one_primary_per_entry_profile
  on public.lexical_written_forms (lexical_entry_id, script_profile_id)
  where is_primary = true;

create unique index lexical_pronunciations_one_default_per_entry
  on public.lexical_pronunciations (lexical_entry_id)
  where is_default = true;

create unique index lexical_pronunciation_forms_one_primary_per_reading
  on public.lexical_pronunciation_forms (pronunciation_id)
  where is_primary_form_for_reading = true;

create index lexical_written_forms_normalized_form_idx
  on public.lexical_written_forms (normalized_form);

create index lexical_written_forms_entry_script_idx
  on public.lexical_written_forms (lexical_entry_id, script_profile_id);

create index lexical_pronunciations_normalized_idx
  on public.lexical_pronunciations (normalized_pronunciation);

create index lexical_pronunciations_no_tone_idx
  on public.lexical_pronunciations (pronunciation_no_tone)
  where pronunciation_no_tone is not null;

create index lexical_reading_items_pronunciation_order_idx
  on public.lexical_reading_items (pronunciation_id, display_order, item_key);

create index lexical_item_localizations_locale_label_idx
  on public.lexical_item_localizations (locale_id, short_label);

create index lexical_pronunciation_aliases_normalized_idx
  on public.lexical_pronunciation_aliases (normalized_alias)
  where is_searchable = true;

-- -----------------------------------------------------------------------------
-- Deferred cross-table integrity checks
-- -----------------------------------------------------------------------------

create or replace function public.lexicon_check_default_pronunciation_integrity()
returns trigger
language plpgsql
set search_path = pg_catalog, public
as $$
begin
  if exists (
    select 1
    from public.lexical_entries e
    where (
      e.review_status = 'reviewed'
      or e.publication_status in ('preview', 'published')
    )
    and (
      select count(*)
      from public.lexical_pronunciations p
      where p.lexical_entry_id = e.id
        and p.is_default = true
    ) <> 1
  ) then
    raise exception 'Every reviewed or visible lexical entry must have exactly one default pronunciation';
  end if;

  return null;
end;
$$;

create constraint trigger lexical_entries_default_pronunciation_check
  after insert or update or delete on public.lexical_entries
  deferrable initially deferred
  for each row execute function public.lexicon_check_default_pronunciation_integrity();

create constraint trigger lexical_pronunciations_default_pronunciation_check
  after insert or update or delete on public.lexical_pronunciations
  deferrable initially deferred
  for each row execute function public.lexicon_check_default_pronunciation_integrity();

create or replace function public.lexicon_check_pronunciation_content_integrity()
returns trigger
language plpgsql
set search_path = pg_catalog, public
as $$
begin
  if exists (
    select 1
    from public.lexical_pronunciations p
    where p.standalone_content_status = 'no_standalone_items'
      and exists (
        select 1
        from public.lexical_reading_items i
        where i.pronunciation_id = p.id
      )
  ) then
    raise exception 'A pronunciation marked no_standalone_items cannot own reading items';
  end if;

  if exists (
    select 1
    from public.lexical_pronunciations p
    where p.standalone_content_status = 'has_items'
      and (
        p.review_status = 'reviewed'
        or p.publication_status in ('preview', 'published')
      )
      and not exists (
        select 1
        from public.lexical_reading_items i
        where i.pronunciation_id = p.id
      )
  ) then
    raise exception 'A reviewed or visible pronunciation marked has_items must own at least one reading item';
  end if;

  return null;
end;
$$;

create constraint trigger lexical_pronunciations_content_check
  after insert or update or delete on public.lexical_pronunciations
  deferrable initially deferred
  for each row execute function public.lexicon_check_pronunciation_content_integrity();

create constraint trigger lexical_reading_items_pronunciation_content_check
  after insert or update or delete on public.lexical_reading_items
  deferrable initially deferred
  for each row execute function public.lexicon_check_pronunciation_content_integrity();

create or replace function public.lexicon_check_reading_item_subtype_integrity()
returns trigger
language plpgsql
set search_path = pg_catalog, public
as $$
begin
  if exists (
    select 1
    from public.lexical_reading_items i
    left join public.lexical_senses s on s.reading_item_id = i.id
    left join public.lexical_usages u on u.reading_item_id = i.id
    where
      (i.item_type = 'sense' and (s.reading_item_id is null or u.reading_item_id is not null))
      or
      (i.item_type = 'usage' and (u.reading_item_id is null or s.reading_item_id is not null))
  ) then
    raise exception 'Every lexical reading item must have exactly one subtype matching item_type';
  end if;

  return null;
end;
$$;

create constraint trigger lexical_reading_items_subtype_check
  after insert or update or delete on public.lexical_reading_items
  deferrable initially deferred
  for each row execute function public.lexicon_check_reading_item_subtype_integrity();

create constraint trigger lexical_senses_subtype_check
  after insert or update or delete on public.lexical_senses
  deferrable initially deferred
  for each row execute function public.lexicon_check_reading_item_subtype_integrity();

create constraint trigger lexical_usages_subtype_check
  after insert or update or delete on public.lexical_usages
  deferrable initially deferred
  for each row execute function public.lexicon_check_reading_item_subtype_integrity();

create or replace function public.lexicon_check_sense_parent_integrity()
returns trigger
language plpgsql
set search_path = pg_catalog, public
as $$
begin
  if exists (
    select 1
    from public.lexical_senses s
    join public.lexical_reading_items i
      on i.id = s.reading_item_id
    where s.is_subsense is distinct from (i.parent_item_id is not null)
  ) then
    raise exception
      'A lexical sense is a subsense exactly when its reading item has a parent';
  end if;

  return null;
end;
$$;

create constraint trigger lexical_senses_parent_integrity_check
  after insert or update or delete on public.lexical_senses
  deferrable initially deferred
  for each row
  execute function public.lexicon_check_sense_parent_integrity();

create constraint trigger lexical_reading_items_sense_parent_integrity_check
  after insert or update or delete on public.lexical_reading_items
  deferrable initially deferred
  for each row
  execute function public.lexicon_check_sense_parent_integrity();

create or replace function public.lexicon_check_published_item_parent_integrity()
returns trigger
language plpgsql
set search_path = pg_catalog, public
as $$
begin
  if exists (
    select 1
    from public.lexical_reading_items i
    join public.lexical_pronunciations p on p.id = i.pronunciation_id
    join public.lexical_entries e on e.id = p.lexical_entry_id
    left join public.lexical_pos_groups g on g.id = i.pos_group_id
    left join public.lexical_reading_items parent_i on parent_i.id = i.parent_item_id
    where i.publication_status = 'published'
      and (
        i.review_status <> 'reviewed'
        or p.review_status <> 'reviewed'
        or e.review_status <> 'reviewed'
        or (g.id is not null and g.review_status <> 'reviewed')
        or (parent_i.id is not null and parent_i.review_status <> 'reviewed')
      )
  ) then
    raise exception 'Published lexical reading items require reviewed entry, pronunciation, POS group, and parent records';
  end if;

  return null;
end;
$$;

create constraint trigger lexical_entries_published_item_parent_check
  after insert or update or delete on public.lexical_entries
  deferrable initially deferred
  for each row execute function public.lexicon_check_published_item_parent_integrity();

create constraint trigger lexical_pronunciations_published_item_parent_check
  after insert or update or delete on public.lexical_pronunciations
  deferrable initially deferred
  for each row execute function public.lexicon_check_published_item_parent_integrity();

create constraint trigger lexical_pos_groups_published_item_parent_check
  after insert or update or delete on public.lexical_pos_groups
  deferrable initially deferred
  for each row execute function public.lexicon_check_published_item_parent_integrity();

create constraint trigger lexical_reading_items_published_item_parent_check
  after insert or update or delete on public.lexical_reading_items
  deferrable initially deferred
  for each row execute function public.lexicon_check_published_item_parent_integrity();

-- -----------------------------------------------------------------------------
-- Mutable-row timestamp triggers
-- -----------------------------------------------------------------------------

create trigger set_language_varieties_updated_at
  before update on public.language_varieties
  for each row execute function public.set_updated_at();

create trigger set_region_profiles_updated_at
  before update on public.region_profiles
  for each row execute function public.set_updated_at();

create trigger set_script_variants_updated_at
  before update on public.script_variants
  for each row execute function public.set_updated_at();

create trigger set_script_profiles_updated_at
  before update on public.script_profiles
  for each row execute function public.set_updated_at();

create trigger set_pronunciation_systems_updated_at
  before update on public.pronunciation_systems
  for each row execute function public.set_updated_at();

create trigger set_parts_of_speech_updated_at
  before update on public.parts_of_speech
  for each row execute function public.set_updated_at();

create trigger set_locales_updated_at
  before update on public.locales
  for each row execute function public.set_updated_at();

create trigger set_lexical_concepts_updated_at
  before update on public.lexical_concepts
  for each row execute function public.set_updated_at();

create trigger set_lexical_entries_updated_at
  before update on public.lexical_entries
  for each row execute function public.set_updated_at();

create trigger set_lexical_written_forms_updated_at
  before update on public.lexical_written_forms
  for each row execute function public.set_updated_at();

create trigger set_lexical_pronunciations_updated_at
  before update on public.lexical_pronunciations
  for each row execute function public.set_updated_at();

create trigger set_lexical_pronunciation_forms_updated_at
  before update on public.lexical_pronunciation_forms
  for each row execute function public.set_updated_at();

create trigger set_lexical_pos_groups_updated_at
  before update on public.lexical_pos_groups
  for each row execute function public.set_updated_at();

create trigger set_lexical_reading_items_updated_at
  before update on public.lexical_reading_items
  for each row execute function public.set_updated_at();

create trigger set_lexical_senses_updated_at
  before update on public.lexical_senses
  for each row execute function public.set_updated_at();

create trigger set_lexical_usages_updated_at
  before update on public.lexical_usages
  for each row execute function public.set_updated_at();

create trigger set_lexical_pronunciation_aliases_updated_at
  before update on public.lexical_pronunciation_aliases
  for each row execute function public.set_updated_at();

create trigger set_lexical_item_localizations_updated_at
  before update on public.lexical_item_localizations
  for each row execute function public.set_updated_at();

create trigger set_lexical_item_chinese_definitions_updated_at
  before update on public.lexical_item_chinese_definitions
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- Minimal shared reference seed rows
-- -----------------------------------------------------------------------------

insert into public.language_varieties (
  code,
  language_code,
  name_english,
  native_name,
  description,
  is_active
)
values (
  'mandarin',
  'zh',
  'Mandarin Chinese',
  '普通话',
  'Mandarin language variety. Region and script remain separate dimensions.',
  true
)
on conflict (code) do update set
  language_code = excluded.language_code,
  name_english = excluded.name_english,
  native_name = excluded.native_name,
  description = excluded.description,
  is_active = excluded.is_active;

insert into public.region_profiles (
  code,
  language_variety_id,
  name_english,
  description,
  is_active
)
select
  'mainland_mandarin',
  lv.id,
  'Mainland Mandarin',
  'Mainland China Mandarin editorial and usage profile.',
  true
from public.language_varieties lv
where lv.code = 'mandarin'
on conflict (code) do update set
  language_variety_id = excluded.language_variety_id,
  name_english = excluded.name_english,
  description = excluded.description,
  is_active = excluded.is_active;

insert into public.script_variants (
  code,
  name_english,
  description,
  is_active
)
values (
  'simplified',
  'Simplified Chinese',
  'Simplified Chinese character variant.',
  true
)
on conflict (code) do update set
  name_english = excluded.name_english,
  description = excluded.description,
  is_active = excluded.is_active;

insert into public.script_profiles (
  code,
  language_variety_id,
  region_profile_id,
  script_variant_id,
  name_english,
  description,
  is_active
)
select
  'simplified_mainland',
  lv.id,
  rp.id,
  sv.id,
  'Simplified Mainland Chinese',
  'Simplified script profile reviewed for Mainland Mandarin.',
  true
from public.language_varieties lv
join public.region_profiles rp
  on rp.language_variety_id = lv.id
 and rp.code = 'mainland_mandarin'
join public.script_variants sv
  on sv.code = 'simplified'
where lv.code = 'mandarin'
on conflict (code) do update set
  language_variety_id = excluded.language_variety_id,
  region_profile_id = excluded.region_profile_id,
  script_variant_id = excluded.script_variant_id,
  name_english = excluded.name_english,
  description = excluded.description,
  is_active = excluded.is_active;

insert into public.pronunciation_systems (
  code,
  language_variety_id,
  name_english,
  description,
  is_tonal,
  is_active
)
select
  'pinyin',
  lv.id,
  'Hanyu Pinyin',
  'Tone-marked or tone-number Mandarin romanization.',
  true,
  true
from public.language_varieties lv
where lv.code = 'mandarin'
on conflict (code) do update set
  language_variety_id = excluded.language_variety_id,
  name_english = excluded.name_english,
  description = excluded.description,
  is_tonal = excluded.is_tonal,
  is_active = excluded.is_active;

insert into public.locales (
  code,
  language_code,
  display_name,
  direction,
  is_active
)
select
  seed.code,
  l.code,
  seed.display_name,
  l.direction,
  true
from (
  values
    ('vi', 'Tiếng Việt'),
    ('en', 'English'),
    ('ar', 'العربية')
) as seed(code, display_name)
join public.languages l on l.code = seed.code
on conflict (code) do update set
  language_code = excluded.language_code,
  display_name = excluded.display_name,
  direction = excluded.direction,
  is_active = excluded.is_active;

insert into public.parts_of_speech (
  code,
  name_english,
  description,
  sort_order,
  is_active
)
values
  ('verb', 'Verb', 'Verb or verb-centered lexical group.', 10, true),
  ('noun', 'Noun', 'Noun or noun-centered lexical group.', 20, true),
  ('classifier', 'Classifier', 'Classifier or measure-word lexical group.', 30, true),
  ('predicative', 'Predicative / modal', 'Predicative or modal-like lexical group.', 40, true),
  ('adjective', 'Adjective', 'Adjective or evaluative predicative lexical group.', 50, true),
  ('adverb', 'Adverb', 'Adverbial lexical group.', 60, true),
  ('proper_noun', 'Proper noun', 'Surname or other proper-name lexical group.', 70, true)
on conflict (code) do update set
  name_english = excluded.name_english,
  description = excluded.description,
  sort_order = excluded.sort_order,
  is_active = excluded.is_active;

-- -----------------------------------------------------------------------------
-- Phase 1 security boundary: RLS enabled, no browser read or write access
-- -----------------------------------------------------------------------------

alter table public.language_varieties enable row level security;
alter table public.region_profiles enable row level security;
alter table public.script_variants enable row level security;
alter table public.script_profiles enable row level security;
alter table public.pronunciation_systems enable row level security;
alter table public.parts_of_speech enable row level security;
alter table public.locales enable row level security;
alter table public.lexical_concepts enable row level security;
alter table public.lexical_entries enable row level security;
alter table public.lexical_written_forms enable row level security;
alter table public.lexical_pronunciations enable row level security;
alter table public.lexical_pronunciation_forms enable row level security;
alter table public.lexical_pos_groups enable row level security;
alter table public.lexical_reading_items enable row level security;
alter table public.lexical_senses enable row level security;
alter table public.lexical_usages enable row level security;
alter table public.lexical_pronunciation_aliases enable row level security;
alter table public.lexical_item_localizations enable row level security;
alter table public.lexical_item_chinese_definitions enable row level security;

revoke all on table public.language_varieties from anon, authenticated;
revoke all on table public.region_profiles from anon, authenticated;
revoke all on table public.script_variants from anon, authenticated;
revoke all on table public.script_profiles from anon, authenticated;
revoke all on table public.pronunciation_systems from anon, authenticated;
revoke all on table public.parts_of_speech from anon, authenticated;
revoke all on table public.locales from anon, authenticated;
revoke all on table public.lexical_concepts from anon, authenticated;
revoke all on table public.lexical_entries from anon, authenticated;
revoke all on table public.lexical_written_forms from anon, authenticated;
revoke all on table public.lexical_pronunciations from anon, authenticated;
revoke all on table public.lexical_pronunciation_forms from anon, authenticated;
revoke all on table public.lexical_pos_groups from anon, authenticated;
revoke all on table public.lexical_reading_items from anon, authenticated;
revoke all on table public.lexical_senses from anon, authenticated;
revoke all on table public.lexical_usages from anon, authenticated;
revoke all on table public.lexical_pronunciation_aliases from anon, authenticated;
revoke all on table public.lexical_item_localizations from anon, authenticated;
revoke all on table public.lexical_item_chinese_definitions from anon, authenticated;

revoke all on function public.lexicon_check_default_pronunciation_integrity() from public, anon, authenticated;
revoke all on function public.lexicon_check_pronunciation_content_integrity() from public, anon, authenticated;
revoke all on function public.lexicon_check_reading_item_subtype_integrity() from public, anon, authenticated;
revoke all on function public.lexicon_check_sense_parent_integrity() from public, anon, authenticated;
revoke all on function public.lexicon_check_published_item_parent_integrity() from public, anon, authenticated;